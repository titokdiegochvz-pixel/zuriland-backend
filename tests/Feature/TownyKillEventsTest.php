<?php

namespace Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TownyKillEventsTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_city_roster_is_empty_before_the_first_sync(): void
    {
        $this->getJson('/api/towny/kills')
            ->assertOk()
            ->assertExactJson([
                'towns' => [],
                'players' => [],
                'updated_at' => null,
            ]);
    }

    public function test_public_city_roster_returns_a_clear_unavailable_response_when_database_is_unreachable(): void
    {
        DB::shouldReceive('table')
            ->once()
            ->with('towny_town_snapshots')
            ->andThrow(new QueryException(
                'pgsql',
                'select * from towny_town_snapshots where id = ?',
                [1],
                new \PDOException('Connection refused')
            ));

        $this->getJson('/api/towny/kills')
            ->assertServiceUnavailable()
            ->assertExactJson([
                'available' => false,
                'message' => 'Los datos de Towny no están disponibles. Revisa la conexión y las migraciones de la base de datos.',
                'towns' => [],
                'players' => [],
                'updated_at' => null,
            ]);
    }

    public function test_town_snapshot_publishes_all_players_including_players_without_a_town(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);

        $this->withToken('sync-secret')
            ->postJson('/api/towny/towns', [
                'towns' => [
                    [
                        'name' => 'Atlantis',
                        'players' => [
                            ['name' => 'TownResident', 'kills' => 3, 'online' => false],
                        ],
                    ],
                ],
                'players' => [
                    ['name' => 'TownResident', 'kills' => 3, 'online' => false],
                    ['name' => 'NomadPlayer', 'kills' => 19, 'online' => true],
                ],
            ])
            ->assertOk();

        $this->getJson('/api/towny/kills')
            ->assertOk()
            ->assertJsonPath('towns.0.players.0.name', 'TownResident')
            ->assertJsonPath('players.0.name', 'TownResident')
            ->assertJsonPath('players.0.online', false)
            ->assertJsonPath('players.1.name', 'NomadPlayer')
            ->assertJsonPath('players.1.kills', 19)
            ->assertJsonPath('players.1.online', true);
    }

    public function test_authenticated_town_snapshot_is_published(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);
        $payload = [
            'towns' => [
                [
                    'name' => 'Thalassia',
                    'players' => [
                        ['name' => 'Yisuautu', 'kills' => 14],
                        ['name' => 'Iatomicmk', 'kills' => 7],
                    ],
                ],
                [
                    'name' => 'Atlantis',
                    'players' => [
                        ['name' => 'Amaro', 'kills' => 42],
                        ['name' => 'Zurixgod', 'kills' => 5],
                        ['name' => 'Yisu', 'kills' => 2],
                        ['name' => 'Iatomicmk', 'kills' => 7],
                    ],
                ],
            ],
        ];

        $this->withToken('sync-secret')
            ->postJson('/api/towny/towns', $payload)
            ->assertOk()
            ->assertJsonPath('message', 'Ciudades de Towny sincronizadas.');

        $this->getJson('/api/towny/kills')
            ->assertOk()
            ->assertJsonPath('towns.0.name', 'Atlantis')
            ->assertJsonPath('towns.0.players.0.name', 'Amaro')
            ->assertJsonPath('towns.0.players.0.kills', 42)
            ->assertJsonPath('towns.0.players.3.name', 'Iatomicmk')
            ->assertJsonPath('towns.0.players.3.kills', 7)
            ->assertJsonPath('towns.1.name', 'Thalassia')
            ->assertJsonPath('towns.1.players.0.name', 'Yisuautu')
            ->assertJsonPath('towns.1.players.0.kills', 14);
    }

    public function test_legacy_town_residents_are_published_with_zero_kills_until_next_online_sync(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);

        $this->withToken('sync-secret')
            ->postJson('/api/towny/towns', [
                'towns' => [
                    ['name' => 'Thalassia', 'residents' => ['Yisuautu', 'Iatomicmk']],
                ],
            ])
            ->assertOk();

        $this->getJson('/api/towny/kills')
            ->assertOk()
            ->assertJsonPath('towns.0.players.0.name', 'Yisuautu')
            ->assertJsonPath('towns.0.players.0.kills', 0)
            ->assertJsonPath('towns.0.players.1.name', 'Iatomicmk')
            ->assertJsonPath('towns.0.players.1.kills', 0);
    }

    public function test_town_snapshot_accepts_cities_with_no_online_players(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);

        $this->withToken('sync-secret')
            ->postJson('/api/towny/towns', [
                'towns' => [
                    ['name' => 'Atlantis', 'players' => []],
                    ['name' => 'Thalassia', 'players' => []],
                ],
            ])
            ->assertOk();

        $this->getJson('/api/towny/kills')
            ->assertOk()
            ->assertJsonPath('towns.0.name', 'Atlantis')
            ->assertJsonPath('towns.0.players', [])
            ->assertJsonPath('towns.1.name', 'Thalassia')
            ->assertJsonPath('towns.1.players', []);
    }

    public function test_town_snapshot_keeps_online_and_offline_residents(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);

        $this->withToken('sync-secret')
            ->postJson('/api/towny/towns', [
                'towns' => [
                    [
                        'name' => 'Thalassia',
                        'players' => [
                            ['name' => 'OnlinePlayer', 'kills' => 3, 'online' => true],
                            ['name' => 'OfflinePlayer', 'kills' => 8, 'online' => false],
                        ],
                    ],
                ],
            ])
            ->assertOk();

        $this->getJson('/api/towny/kills')
            ->assertOk()
            ->assertJsonPath('towns.0.players.0.name', 'OnlinePlayer')
            ->assertJsonPath('towns.0.players.0.online', true)
            ->assertJsonPath('towns.0.players.1.name', 'OfflinePlayer')
            ->assertJsonPath('towns.0.players.1.online', false);
    }

    public function test_town_snapshot_accepts_legacy_players_payloads_without_kill_counts(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);

        $this->withToken('sync-secret')
            ->postJson('/api/towny/towns', [
                'towns' => [
                    [
                        'name' => 'Thalassia',
                        'players' => [
                            ['name' => 'LegacyTownPlayer', 'online' => true],
                        ],
                    ],
                ],
                'players' => [
                    ['name' => 'LegacyNomad', 'online' => false],
                ],
            ])
            ->assertOk();

        $this->getJson('/api/towny/kills')
            ->assertOk()
            ->assertJsonPath('towns.0.players.0.name', 'LegacyTownPlayer')
            ->assertJsonPath('towns.0.players.0.kills', 0)
            ->assertJsonPath('towns.0.players.0.online', true)
            ->assertJsonPath('players.0.name', 'LegacyNomad')
            ->assertJsonPath('players.0.kills', 0)
            ->assertJsonPath('players.0.online', false);
    }

    public function test_town_snapshot_retains_players_after_they_leave_and_marks_them_offline(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);

        $this->withToken('sync-secret')
            ->postJson('/api/towny/towns', [
                'towns' => [
                    ['name' => 'Atlantis', 'players' => []],
                ],
                'players' => [
                    ['name' => 'Yoyanac', 'kills' => 0, 'online' => true],
                    ['name' => '1_LU_1', 'kills' => 0, 'online' => true],
                    ['name' => 'CurrentPlayer', 'kills' => 2, 'online' => true],
                ],
            ])
            ->assertOk();

        $this->withToken('sync-secret')
            ->postJson('/api/towny/towns', [
                'towns' => [
                    ['name' => 'Atlantis', 'players' => []],
                ],
                'players' => [
                    ['name' => 'CurrentPlayer', 'kills' => 2, 'online' => true],
                ],
            ])
            ->assertOk();

        $this->getJson('/api/towny/kills')
            ->assertOk()
            ->assertJsonFragment([
                'name' => 'Yoyanac',
                'kills' => 0,
                'online' => false,
            ])
            ->assertJsonFragment([
                'name' => '1_LU_1',
                'kills' => 0,
                'online' => false,
            ])
            ->assertJsonFragment([
                'name' => 'CurrentPlayer',
                'kills' => 2,
                'online' => true,
            ]);
    }

    public function test_town_snapshot_requires_the_sync_token(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);

        $this->postJson('/api/towny/towns', ['towns' => []])
            ->assertUnauthorized();
    }

    public function test_kill_event_sync_requires_a_configured_bearer_token(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);

        $this->postJson('/api/towny/kills', $this->killEvent())
            ->assertUnauthorized();

        $this->withToken('wrong-token')
            ->postJson('/api/towny/kills', $this->killEvent())
            ->assertUnauthorized();
    }

    public function test_kill_event_sync_reports_when_no_token_is_configured(): void
    {
        config(['services.towny.sync_token' => null]);

        $this->withToken('sync-secret')
            ->postJson('/api/towny/kills', $this->killEvent())
            ->assertServiceUnavailable();
    }

    public function test_authenticated_kill_event_is_published_with_killer_town_and_victim(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);
        $event = $this->killEvent();

        $this->withToken('sync-secret')
            ->postJson('/api/towny/kills', $event)
            ->assertCreated()
            ->assertJsonPath('message', 'Baja de jugador registrada.');

        $this->assertDatabaseHas('towny_kill_events', [
            'event_id' => $event['event_id'],
            'killer_name' => 'Alex',
            'killer_town' => 'Atlantis',
            'victim_name' => 'Steve',
        ]);

        $this->getJson('/api/towny/kills')
            ->assertOk()
            ->assertJsonPath('towns.0.name', 'Atlantis')
            ->assertJsonPath('towns.0.players', [])
            ->assertJsonPath('towns.0.kills.0.killer_name', 'Alex')
            ->assertJsonPath('towns.0.kills.0.victim_name', 'Steve')
            ->assertJsonPath('players.0.name', 'Alex')
            ->assertJsonPath('players.0.kills', 1)
            ->assertJsonPath('players.1.name', 'Steve')
            ->assertJsonPath('players.1.kills', 0);
    }

    public function test_repeated_kill_event_id_does_not_create_duplicate_rows(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);
        $event = $this->killEvent();

        $this->withToken('sync-secret')
            ->postJson('/api/towny/kills', $event)
            ->assertCreated();

        $this->withToken('sync-secret')
            ->postJson('/api/towny/kills', $event)
            ->assertOk()
            ->assertJsonPath('message', 'La baja ya estaba registrada.');

        $this->assertDatabaseCount('towny_kill_events', 1);
    }

    public function test_public_city_feed_returns_only_the_latest_eighteen_kills(): void
    {
        foreach (range(1, 20) as $index) {
            DB::table('towny_kill_events')->insert([
                'event_id' => fake()->uuid(),
                'killer_name' => 'Killer'.$index,
                'killer_town' => 'Atlantis',
                'victim_name' => 'Victim'.$index,
                'occurred_at' => now()->addSeconds($index),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->getJson('/api/towny/kills')
            ->assertOk()
            ->assertJsonCount(18, 'towns.0.kills')
            ->assertJsonPath('towns.0.kills.0.killer_name', 'Killer20')
            ->assertJsonPath('towns.0.kills.17.killer_name', 'Killer3');
    }

    public function test_kill_event_rejects_same_killer_and_victim(): void
    {
        config(['services.towny.sync_token' => 'sync-secret']);
        $event = $this->killEvent();
        $event['victim_name'] = $event['killer_name'];

        $this->withToken('sync-secret')
            ->postJson('/api/towny/kills', $event)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['victim_name']);
    }

    private function killEvent(): array
    {
        return [
            'event_id' => fake()->uuid(),
            'killer_name' => 'Alex',
            'killer_town' => 'Atlantis',
            'victim_name' => 'Steve',
            'occurred_at' => now()->toIso8601String(),
        ];
    }
}
