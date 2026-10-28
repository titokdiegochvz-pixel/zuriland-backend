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
        'Dios' => 99,
        'Leyenda' => 199,
        'Pack Utilidad' => 49,
        'Pack Maestro' => 149,
    ];

    public function createOrder(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'in:'.implode(',', array_keys(self::PRODUCTS))],
        ]);
        $price = self::PRODUCTS[$validated['title']];
        $accessToken = $this->accessToken();
        $baseUrl = rtrim(config('services.paypal.base_url'), '/');
        $frontendUrl = rtrim(config('services.frontend.url'), '/');

        $response = Http::withToken($accessToken)
            ->withHeaders(['PayPal-Request-Id' => (string) Str::uuid()])
            ->post("{$baseUrl}/v2/checkout/orders", [
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'description' => $validated['title'],
                    'amount' => [
                        'currency_code' => 'MXN',
                        'value' => number_format($price, 2, '.', ''),
                    ],
                ]],
                'payment_source' => [
                    'paypal' => [
                        'experience_context' => [
                            'brand_name' => 'ZURILAND',
                            'locale' => 'es-MX',
                            'user_action' => 'PAY_NOW',
                            'return_url' => "{$frontendUrl}/store?paypal=success",
                            'cancel_url' => "{$frontendUrl}/store?paypal=cancelled",
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
            'title' => $validated['title'],
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
