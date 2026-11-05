<?php

namespace Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TownyRankingTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_ranking_is_empty_before_the_first_sync(): void
    {
        $this->getJson('/api/towny/ranking')
            ->assertOk()
            ->assertExactJson([
                'nations' => [],
                'updated_at' => null,
            ]);
    }

    public function test_public_ranking_returns_a_clear_unavailable_response_when_database_is_unreachable(): void
    {
        DB::shouldReceive('table')
            ->once()
            ->with('towny_ranking_snapshots')
            ->andThrow(new QueryException(
                'pgsql',
                'select * from towny_ranking_snapshots where id = ?',
                [1],
                new \PDOException('Connection refused')
            ));

        $this->getJson('/api/towny/ranking')
            ->assertServiceUnavailable()
            ->assertExactJson([
                'available' => false,
                'message' => 'La clasificación de Towny no está disponible. Revisa la conexión y las migraciones de la base de datos.',
                'nations' => [],
                'updated_at' => null,
            ]);
    }

    public function test_towny_sync_requires_a_configured_bearer_token(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);

        $this->postJson('/api/towny/ranking', ['nations' => []])
            ->assertUnauthorized();

        $this->withToken('wrong-token')
            ->postJson('/api/towny/ranking', ['nations' => []])
            ->assertUnauthorized();
    }

    public function test_towny_sync_reports_when_no_token_is_configured(): void
    {
        config(['services.towny.sync_token' => null]);

        $this->withToken('sync-secret')
            ->postJson('/api/towny/ranking', ['nations' => []])
            ->assertServiceUnavailable();
    }

    public function test_valid_towny_sync_replaces_the_public_ranking_snapshot(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);

        $payload = [
            'nations' => [
                [
                    'name' => 'Zuri',
                    'towns' => 3,
                    'residents' => 18,
                    'land' => 42,
                    'kills' => 127,
                ],
            ],
        ];

        $this->withToken('sync-secret')
            ->postJson('/api/towny/ranking', $payload)
            ->assertOk()
            ->assertJsonPath('message', 'Clasificación de Towny sincronizada.')
            ->assertJsonStructure(['updated_at']);

        $this->assertDatabaseHas('towny_ranking_snapshots', [
            'id' => 1,
            'data' => json_encode($payload['nations']),
        ]);

        $this->getJson('/api/towny/ranking')
            ->assertOk()
            ->assertJsonPath('nations.0.name', 'Zuri')
            ->assertJsonPath('nations.0.towns', 3)
            ->assertJsonPath('nations.0.residents', 18)
            ->assertJsonPath('nations.0.land', 42)
            ->assertJsonPath('nations.0.kills', 127)
            ->assertJsonStructure(['updated_at']);
    }

    public function test_towny_sync_defaults_kills_for_older_plugins(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);

        $this->withToken('sync-secret')
            ->postJson('/api/towny/ranking', [
                'nations' => [[
                    'name' => 'Zuri',
                    'towns' => 3,
                    'residents' => 18,
                    'land' => 42,
                ]],
            ])
            ->assertOk();

        $this->getJson('/api/towny/ranking')
            ->assertOk()
            ->assertJsonPath('nations.0.kills', 0);
    }

    public function test_towny_sync_validates_the_complete_snapshot_before_writing(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);
        DB::table('towny_ranking_snapshots')->insert([
            'id' => 1,
            'data' => json_encode([[
                'name' => 'Existing',
                'towns' => 1,
                'residents' => 2,
                'land' => 3,
            ]]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withToken('sync-secret')
            ->postJson('/api/towny/ranking', [
                'nations' => [[
                    'name' => 'Invalid',
                    'towns' => -1,
                    'residents' => 2,
                    'land' => 3,
                ]],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['nations.0.towns']);

        $this->assertDatabaseHas('towny_ranking_snapshots', [
            'id' => 1,
            'data' => json_encode([[
                'name' => 'Existing',
                'towns' => 1,
                'residents' => 2,
                'land' => 3,
            ]]),
        ]);
    }
}
