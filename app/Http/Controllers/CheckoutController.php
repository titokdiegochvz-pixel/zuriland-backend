<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Stripe\Checkout\Session;
use Stripe\Stripe;

class CheckoutController extends Controller
{
    public function create(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'price' => ['required', 'integer', 'min:1'],
        ]);

        Stripe::setApiKey(config('services.stripe.secret'));

        $session = Session::create([
            'line_items' => [[
                'price_data' => [
                    'currency' => 'mxn', // o 'usd'
                    'product_data' => ['name' => $validated['title']],
                    'unit_amount' => $validated['price'] * 100,
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
