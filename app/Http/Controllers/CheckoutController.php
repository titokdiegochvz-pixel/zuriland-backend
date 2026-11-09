<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Checkout\Session;
use Stripe\Stripe;

class CheckoutController extends Controller
{
    private const PRODUCTS = [
        'Elite' => 49,
        'Dios' => 79,
        'Leyenda' => 149,
        'Pack Utilidad' => 49,
        'Pack Maestro' => 149,
    ];

    public function create(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required_without:items', 'string', 'in:'.implode(',', array_keys(self::PRODUCTS))],
            'items' => ['required_without:title', 'array', 'min:1', 'max:5'],
            'items.*.title' => ['required', 'string', 'distinct', 'in:'.implode(',', array_keys(self::PRODUCTS))],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        if (! config('services.stripe.secret')) {
            Log::warning('Stripe checkout is unavailable because its secret key is not configured.');

            return response()->json([
                'message' => 'Los pagos con tarjeta no están configurados todavía. Inténtalo más tarde.',
            ], 503);
        }

        $items = isset($validated['items'])
            ? $validated['items']
            : [['title' => $validated['title'], 'quantity' => 1]];
        $lineItems = array_map(fn (array $item) => [
            'price_data' => [
                'currency' => 'mxn',
                'product_data' => ['name' => $item['title']],
                'unit_amount' => self::PRODUCTS[$item['title']] * 100,
            ],
            'quantity' => $item['quantity'],
        ], $items);

        Stripe::setApiKey(config('services.stripe.secret'));
        $returnUrl = rtrim(config('app.url'), '/');

        $session = Session::create([
            'line_items' => $lineItems,
            'mode' => 'payment',
            'success_url' => $returnUrl.'/pago-exitoso?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => $returnUrl.'/pago-cancelado',
        ]);

        return response()->json(['url' => $session->url]);
    }

    public function status(string $sessionId)
    {
        if (! config('services.stripe.secret')) {
            Log::warning('Stripe payment verification is unavailable because its secret key is not configured.');

            return response()->json([
                'message' => 'No se pudo verificar el pago en este momento.',
            ], 503);
        }

        Stripe::setApiKey(config('services.stripe.secret'));

        $session = Session::retrieve($sessionId);
        $paid = $session->mode === 'payment'
            && $session->status === 'complete'
            && $session->payment_status === 'paid';

        return response()->json(['paid' => $paid]);
    }
}
