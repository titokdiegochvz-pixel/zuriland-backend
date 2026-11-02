<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Stripe\Checkout\Session;
use Stripe\Stripe;

class CheckoutController extends Controller
{
    private const PRODUCTS = [
        'Elite' => 49,
        'Dios' => 99,
        'Leyenda' => 199,
        'Pack Utilidad' => 49,
        'Pack Maestro' => 149,
    ];

    public function create(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'in:'.implode(',', array_keys(self::PRODUCTS))],
        ]);

        Stripe::setApiKey(config('services.stripe.secret'));

        $session = Session::create([
            'line_items' => [[
                'price_data' => [
                    'currency' => 'mxn', // o 'usd'
                    'product_data' => ['name' => $validated['title']],
                    'unit_amount' => self::PRODUCTS[$validated['title']] * 100,
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'success_url' => rtrim(config('services.frontend.url'), '/').'/pago-exitoso',
            'cancel_url' => rtrim(config('services.frontend.url'), '/').'/pago-cancelado',
        ]);

        return response()->json(['url' => $session->url]);
    }
}
