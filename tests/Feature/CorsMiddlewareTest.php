<?php

namespace Tests\Feature;

use Tests\TestCase;

class CorsMiddlewareTest extends TestCase
{
    public function test_api_preflight_allows_the_local_frontend(): void
    {
        $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'content-type',
        ])
            ->options('/api/usuarios')
            ->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    }

    public function test_api_request_reaches_the_registered_route(): void
    {
        $response = $this->withHeader('Origin', 'http://localhost:3000')
            ->postJson('/api/usuarios');

        $response->assertUnprocessable();
    }
}
