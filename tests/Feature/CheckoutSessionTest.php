<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Stripe\ApiRequestor;
use Stripe\HttpClient\ClientInterface;
use Tests\TestCase;

class CheckoutSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_requires_a_catalog_product(): void
    {
        $this->postJson('/api/create-checkout-session')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);

        $this->postJson('/api/create-checkout-session', [
            'title' => 'Producto inventado',
            'price' => 1,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    public function test_stripe_checkout_reports_when_credentials_are_missing(): void
    {
        config(['services.stripe.secret' => null]);

        $this->postJson('/api/create-checkout-session', [
            'title' => 'Elite',
        ])
            ->assertServiceUnavailable()
            ->assertJsonPath('message', 'Los pagos con tarjeta no están configurados todavía. Inténtalo más tarde.');
    }

    public function test_stripe_cart_checkout_uses_catalog_prices_and_quantities(): void
    {
        config([
            'services.stripe.secret' => 'sk_test_zuriland',
            'services.frontend.url' => 'https://zuriland-frontend.onrender.com',
        ]);
        $stripeClient = new class implements ClientInterface
        {
            public array $requests = [];

            public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null)
            {
                $this->requests[] = compact('method', 'absUrl', 'params', 'apiMode');

                return [
                    json_encode(['id' => 'cs_test_cart', 'url' => 'https://checkout.stripe.com/c/pay/cs_test_cart']),
                    200,
                    ['Content-Type' => 'application/json'],
                ];
            }
        };
        ApiRequestor::setHttpClient($stripeClient);

        try {
            $this->postJson('/api/create-checkout-session', [
                'items' => [
                    ['title' => 'Dios', 'quantity' => 2],
                    ['title' => 'Elite', 'quantity' => 1],
                    ['title' => 'Leyenda', 'quantity' => 1],
                ],
            ])
                ->assertOk()
                ->assertJsonPath('url', 'https://checkout.stripe.com/c/pay/cs_test_cart');

            $this->assertCount(1, $stripeClient->requests);
            $lineItems = $stripeClient->requests[0]['params']['line_items'];
            $this->assertSame(2, $lineItems[0]['quantity']);
            $this->assertSame(7900, $lineItems[0]['price_data']['unit_amount']);
            $this->assertSame(1, $lineItems[1]['quantity']);
            $this->assertSame(4900, $lineItems[1]['price_data']['unit_amount']);
            $this->assertSame(14900, $lineItems[2]['price_data']['unit_amount']);
            $this->assertSame(
                'https://zuriland-frontend.onrender.com/pago-exitoso?session_id={CHECKOUT_SESSION_ID}',
                $stripeClient->requests[0]['params']['success_url'],
            );
            $this->assertSame(
                'https://zuriland-frontend.onrender.com/pago-cancelado',
                $stripeClient->requests[0]['params']['cancel_url'],
            );
        } finally {
            ApiRequestor::setHttpClient(null);
        }
    }

    public function test_stripe_payment_verification_confirms_only_paid_completed_sessions(): void
    {
        config(['services.stripe.secret' => 'sk_test_zuriland']);
        $stripeClient = new class implements ClientInterface
        {
            public array $requests = [];

            public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null)
            {
                $this->requests[] = compact('method', 'absUrl');
                $sessionId = str_ends_with($absUrl, 'cs_test_paid') ? 'cs_test_paid' : 'cs_test_unpaid';

                return [
                    json_encode([
                        'id' => $sessionId,
                        'object' => 'checkout.session',
                        'mode' => 'payment',
                        'status' => $sessionId === 'cs_test_paid' ? 'complete' : 'open',
                        'payment_status' => $sessionId === 'cs_test_paid' ? 'paid' : 'unpaid',
                    ]),
                    200,
                    ['Content-Type' => 'application/json'],
                ];
            }
        };
        ApiRequestor::setHttpClient($stripeClient);

        try {
            $this->getJson('/api/checkout-session/cs_test_paid')
                ->assertOk()
                ->assertJsonPath('paid', true);
            $this->getJson('/api/checkout-session/cs_test_unpaid')
                ->assertOk()
                ->assertJsonPath('paid', false);

            $this->assertCount(2, $stripeClient->requests);
        } finally {
            ApiRequestor::setHttpClient(null);
        }
    }

    public function test_stripe_payment_verification_rejects_malformed_session_ids(): void
    {
        $this->getJson('/api/checkout-session/not-a-stripe-session')
            ->assertNotFound();
    }

    public function test_paypal_order_reports_when_credentials_are_missing(): void
    {
        config([
            'services.paypal.client_id' => null,
            'services.paypal.secret' => null,
        ]);
        Http::fake();

        $this->postJson('/api/paypal/orders', ['title' => 'Elite'])
            ->assertServiceUnavailable()
            ->assertJsonPath('message', 'PayPal no está configurado todavía. Inténtalo más tarde.');

        Http::assertNothingSent();
    }

    public function test_paypal_order_uses_the_server_catalog_price(): void
    {
        config([
            'services.paypal.client_id' => 'sandbox-client',
            'services.paypal.secret' => 'sandbox-secret',
        ]);
        Http::fake([
            'https://api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response([
                'access_token' => 'sandbox-access-token',
            ]),
            'https://api-m.sandbox.paypal.com/v2/checkout/orders' => Http::response([
                'id' => 'PAYPAL-ORDER-123',
                'links' => [['rel' => 'approve', 'href' => 'https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL-ORDER-123']],
            ], 201),
        ]);

        $this->postJson('/api/paypal/orders', ['title' => 'Elite'])
            ->assertOk()
            ->assertJsonPath('id', 'PAYPAL-ORDER-123')
            ->assertJsonPath('approval_url', 'https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL-ORDER-123');

        $this->assertDatabaseHas('paypal_orders', [
            'paypal_order_id' => 'PAYPAL-ORDER-123',
            'title' => 'Elite',
            'amount' => 49,
            'status' => 'pending',
        ]);

        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/v2/checkout/orders')
            && data_get($request->data(), 'purchase_units.0.amount.value') === '49.00'
            && data_get($request->data(), 'purchase_units.0.amount.currency_code') === 'MXN'
        );
    }

    public function test_paypal_cart_order_calculates_total_and_items_from_server_catalog(): void
    {
        config([
            'services.paypal.client_id' => 'sandbox-client',
            'services.paypal.secret' => 'sandbox-secret',
        ]);
        Http::fake([
            'https://api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response([
                'access_token' => 'sandbox-access-token',
            ]),
            'https://api-m.sandbox.paypal.com/v2/checkout/orders' => Http::response([
                'id' => 'PAYPAL-CART-123',
                'links' => [['rel' => 'approve', 'href' => 'https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL-CART-123']],
            ], 201),
        ]);

        $this->postJson('/api/paypal/orders', [
            'items' => [
                ['title' => 'Dios', 'quantity' => 2],
                ['title' => 'Elite', 'quantity' => 1],
                ['title' => 'Leyenda', 'quantity' => 1],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('approval_url', 'https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL-CART-123');

        $this->assertDatabaseHas('paypal_orders', [
            'paypal_order_id' => 'PAYPAL-CART-123',
            'title' => 'Dios x 2, Elite, Leyenda',
            'amount' => 356,
            'status' => 'pending',
        ]);

        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/v2/checkout/orders')
            && data_get($request->data(), 'purchase_units.0.amount.value') === '356.00'
            && data_get($request->data(), 'purchase_units.0.amount.breakdown.item_total.value') === '356.00'
            && data_get($request->data(), 'purchase_units.0.items.0.quantity') === '2'
            && data_get($request->data(), 'purchase_units.0.items.0.unit_amount.value') === '79.00'
            && data_get($request->data(), 'purchase_units.0.items.1.unit_amount.value') === '49.00'
            && data_get($request->data(), 'purchase_units.0.items.2.unit_amount.value') === '149.00'
        );
    }

    public function test_paypal_order_rejects_products_outside_the_catalog(): void
    {
        Http::fake();

        $this->postJson('/api/paypal/orders', ['title' => 'Producto inventado'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);

        Http::assertNothingSent();
    }

    public function test_paypal_cart_order_rejects_duplicates_and_invalid_quantities(): void
    {
        Http::fake();

        $this->postJson('/api/paypal/orders', [
            'items' => [
                ['title' => 'Elite', 'quantity' => 1],
                ['title' => 'Elite', 'quantity' => 0],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['items.1.title', 'items.1.quantity']);

        Http::assertNothingSent();
    }

    public function test_paypal_capture_confirms_and_records_a_completed_payment(): void
    {
        config([
            'services.paypal.client_id' => 'sandbox-client',
            'services.paypal.secret' => 'sandbox-secret',
        ]);
        DB::table('paypal_orders')->insert([
            'paypal_order_id' => 'PAYPAL-ORDER-123',
            'title' => 'Elite',
            'amount' => 49,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        Http::fake([
            'https://api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response([
                'access_token' => 'sandbox-access-token',
            ]),
            'https://api-m.sandbox.paypal.com/v2/checkout/orders/PAYPAL-ORDER-123/capture' => Http::response([
                'status' => 'COMPLETED',
                'purchase_units' => [[
                    'payments' => [
                        'captures' => [[
                            'status' => 'COMPLETED',
                            'amount' => ['currency_code' => 'MXN', 'value' => '49.00'],
                        ]],
                    ],
                ]],
            ]),
        ]);

        $this->postJson('/api/paypal/orders/PAYPAL-ORDER-123/capture')
            ->assertOk()
            ->assertJsonPath('status', 'COMPLETED')
            ->assertJsonPath('title', 'Elite');

        $this->assertDatabaseHas('paypal_orders', [
            'paypal_order_id' => 'PAYPAL-ORDER-123',
            'status' => 'completed',
        ]);
    }
}
