<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MinecraftStatusTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        config([
            'services.minecraft.status_url' => 'https://api.mcstatus.io/v2/status/java',
            'services.minecraft.host' => 'pgsql-stained.tun.ply.gg',
        ]);
    }

    public function test_public_status_returns_the_live_player_count(): void
    {
        Http::fake([
            'https://api.mcstatus.io/v2/status/java/pgsql-stained.tun.ply.gg' => Http::response([
                'online' => true,
                'players' => ['online' => 1, 'max' => 20],
            ]),
        ]);

        $this->getJson('/api/minecraft/status')
            ->assertOk()
            ->assertExactJson([
                'online' => true,
                'players' => ['online' => 1, 'max' => 20],
            ]);

        Http::assertSent(fn ($request) => $request->url() === 'https://api.mcstatus.io/v2/status/java/pgsql-stained.tun.ply.gg');
    }

    public function test_public_status_reports_an_offline_server_without_claiming_players_are_online(): void
    {
        Http::fake([
            'https://api.mcstatus.io/v2/status/java/pgsql-stained.tun.ply.gg' => Http::response([
                'online' => false,
            ]),
        ]);

        $this->getJson('/api/minecraft/status')
            ->assertOk()
            ->assertExactJson([
                'online' => false,
                'players' => ['online' => 0, 'max' => 0],
            ]);
    }

    public function test_public_status_reports_upstream_errors(): void
    {
        Http::fake([
            'https://api.mcstatus.io/v2/status/java/pgsql-stained.tun.ply.gg' => Http::response([], 503),
        ]);

        $this->getJson('/api/minecraft/status')
            ->assertServiceUnavailable()
            ->assertJsonPath('message', 'No se pudo consultar el estado del servidor Minecraft.');
    }

    public function test_authenticated_plugin_push_is_returned_as_the_current_status(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);

        $this->withToken('sync-secret')
            ->postJson('/api/minecraft/status', [
                'online' => true,
                'players' => ['online' => 3, 'max' => 120],
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Estado de Minecraft sincronizado.');

        Http::fake();

        $this->getJson('/api/minecraft/status')
            ->assertOk()
            ->assertExactJson([
                'online' => true,
                'players' => ['online' => 3, 'max' => 120],
            ]);

        Http::assertNothingSent();
    }

    public function test_plugin_push_requires_the_towny_sync_token(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);

        $payload = [
            'online' => true,
            'players' => ['online' => 2, 'max' => 120],
        ];

        $this->postJson('/api/minecraft/status', $payload)
            ->assertUnauthorized();

        $this->withToken('wrong-token')
            ->postJson('/api/minecraft/status', $payload)
            ->assertUnauthorized();
    }

    public function test_plugin_push_validates_player_counts(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);

        $this->withToken('sync-secret')
            ->postJson('/api/minecraft/status', [
                'online' => true,
                'players' => ['online' => -1, 'max' => 120],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['players.online']);
    }
}
