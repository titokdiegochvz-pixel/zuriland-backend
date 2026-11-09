<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class PayPalController extends Controller
{
    private const PRODUCTS = [
        'Elite' => 49,
        'Dios' => 79,
        'Leyenda' => 149,
        'Pack Utilidad' => 49,
        'Pack Maestro' => 149,
    ];

    public function createOrder(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required_without:items', 'string', 'in:'.implode(',', array_keys(self::PRODUCTS))],
            'items' => ['required_without:title', 'array', 'min:1', 'max:5'],
            'items.*.title' => ['required', 'string', 'distinct', 'in:'.implode(',', array_keys(self::PRODUCTS))],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        if (! config('services.paypal.client_id') || ! config('services.paypal.secret')) {
            return response()->json([
                'message' => 'PayPal no está configurado todavía. Inténtalo más tarde.',
            ], 503);
        }

        $items = isset($validated['items'])
            ? $validated['items']
            : [['title' => $validated['title'], 'quantity' => 1]];
        $price = collect($items)->sum(
            fn (array $item) => self::PRODUCTS[$item['title']] * $item['quantity']
        );
        $title = collect($items)
            ->map(fn (array $item) => $item['title'].($item['quantity'] > 1 ? " x {$item['quantity']}" : ''))
            ->implode(', ');
        $paypalItems = collect($items)
            ->map(fn (array $item) => [
                'name' => $item['title'],
                'quantity' => (string) $item['quantity'],
                'unit_amount' => [
                    'currency_code' => 'MXN',
                    'value' => number_format(self::PRODUCTS[$item['title']], 2, '.', ''),
                ],
            ])
            ->all();
        $accessToken = $this->accessToken();
        $baseUrl = rtrim(config('services.paypal.base_url'), '/');
        $frontendUrl = rtrim(config('services.frontend.url'), '/');

        $response = Http::withToken($accessToken)
            ->withHeaders(['PayPal-Request-Id' => (string) Str::uuid()])
            ->post("{$baseUrl}/v2/checkout/orders", [
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'description' => $title,
                    'amount' => [
                        'currency_code' => 'MXN',
                        'value' => number_format($price, 2, '.', ''),
                        'breakdown' => [
                            'item_total' => [
                                'currency_code' => 'MXN',
                                'value' => number_format($price, 2, '.', ''),
                            ],
                        ],
                    ],
                    'items' => $paypalItems,
                ]],
                'payment_source' => [
                    'paypal' => [
                        'experience_context' => [
                            'brand_name' => 'ZURILAND',
                            'locale' => 'es-MX',
                            'user_action' => 'PAY_NOW',
                            'return_url' => "{$frontendUrl}/cart?paypal=success",
                            'cancel_url' => "{$frontendUrl}/cart?paypal=cancelled",
                        ],
                    ],
                ],
            ]);
        $response->throw();

        $orderId = $response->json('id');
        $approvalLink = collect($response->json('links', []))->firstWhere('rel', 'approve');
        $approvalUrl = $approvalLink['href'] ?? null;

        if (! $orderId || ! $approvalUrl) {
            throw new RuntimeException('PayPal no devolvió el enlace de aprobación de la orden.');
        }

        DB::table('paypal_orders')->insert([
            'paypal_order_id' => $orderId,
            'title' => $title,
            'amount' => $price,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'id' => $orderId,
            'approval_url' => $approvalUrl,
        ]);
    }

    public function captureOrder(string $orderId)
    {
        if (! config('services.paypal.client_id') || ! config('services.paypal.secret')) {
            return response()->json([
                'message' => 'PayPal no está configurado todavía. Inténtalo más tarde.',
            ], 503);
        }

        $order = DB::table('paypal_orders')->where('paypal_order_id', $orderId)->first();

        if (! $order) {
            return response()->json(['message' => 'Orden de PayPal no encontrada.'], 404);
        }

        if ($order->status === 'completed') {
            return response()->json(['status' => 'COMPLETED', 'title' => $order->title]);
        }

        $baseUrl = rtrim(config('services.paypal.base_url'), '/');
        $response = Http::withToken($this->accessToken())
            ->withHeaders(['PayPal-Request-Id' => "capture-{$orderId}"])
            ->post("{$baseUrl}/v2/checkout/orders/{$orderId}/capture");
        $response->throw();

        $capture = $response->json('purchase_units.0.payments.captures.0');
        $capturedAmount = data_get($capture, 'amount.value');
        $capturedCurrency = data_get($capture, 'amount.currency_code');

        if (
            $response->json('status') !== 'COMPLETED'
            || data_get($capture, 'status') !== 'COMPLETED'
            || $capturedCurrency !== 'MXN'
            || (float) $capturedAmount !== (float) $order->amount
        ) {
            return response()->json(['message' => 'PayPal no confirmó el pago esperado.'], 409);
        }

        DB::table('paypal_orders')
            ->where('paypal_order_id', $orderId)
            ->update(['status' => 'completed', 'updated_at' => now()]);

        return response()->json(['status' => 'COMPLETED', 'title' => $order->title]);
    }

    private function accessToken(): string
    {
        $clientId = config('services.paypal.client_id');
        $secret = config('services.paypal.secret');

        if (! $clientId || ! $secret) {
            throw new RuntimeException('Faltan las credenciales de PayPal en la configuración del backend.');
        }

        $baseUrl = rtrim(config('services.paypal.base_url'), '/');
        $response = Http::asForm()
            ->withBasicAuth($clientId, $secret)
            ->post("{$baseUrl}/v1/oauth2/token", ['grant_type' => 'client_credentials']);
        $response->throw();

        $token = $response->json('access_token');

        if (! $token) {
            throw new RuntimeException('PayPal no devolvió un token de acceso.');
        }

        return $token;
    }
}
