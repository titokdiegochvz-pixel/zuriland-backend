<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
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

    public function test_paypal_order_rejects_products_outside_the_catalog(): void
    {
        Http::fake();

        $this->postJson('/api/paypal/orders', ['title' => 'Producto inventado'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);

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
