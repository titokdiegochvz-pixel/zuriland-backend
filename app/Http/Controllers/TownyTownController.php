<?php

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TownyTownController extends Controller
{
    private const RECENT_KILLS_LIMIT = 18;

    public function index()
    {
        try {
            return $this->townySnapshot();
        } catch (QueryException $exception) {
            Log::warning('Unable to load the Towny roster from the database.', [
                'sql_state' => $exception->getCode(),
            ]);

            return response()->json([
                'available' => false,
                'message' => 'Los datos de Towny no están disponibles. Revisa la conexión y las migraciones de la base de datos.',
                'towns' => [],
                'players' => [],
                'updated_at' => null,
            ], 503);
        }
    }

    private function townySnapshot()
    {
        $snapshot = DB::table('towny_town_snapshots')->where('id', 1)->first();
        $snapshotData = $snapshot
            ? json_decode($snapshot->data, true, 512, JSON_THROW_ON_ERROR)
            : ['towns' => [], 'players' => []];
        $towns = array_is_list($snapshotData)
            ? $snapshotData
            : ($snapshotData['towns'] ?? []);
        $players = array_is_list($snapshotData)
            ? []
            : ($snapshotData['players'] ?? []);

        if (! $players) {
            foreach ($towns as $town) {
                foreach ($town['players'] ?? $town['residents'] ?? [] as $player) {
                    $players[] = is_string($player)
                        ? ['name' => $player, 'kills' => 0, 'online' => true]
                        : [
                            'name' => $player['name'],
                            'kills' => (int) ($player['kills'] ?? 0),
                            'online' => (bool) ($player['online'] ?? true),
                        ];
                }
            }
        }

        $players = array_map(
            fn (array|string $player) => is_string($player)
                ? ['name' => $player, 'kills' => 0, 'online' => true]
                : [
                    'name' => $player['name'],
                    'kills' => (int) $player['kills'],
                    'online' => (bool) ($player['online'] ?? true),
                ],
            $players
        );
        $playersByName = [];
        foreach ($players as $player) {
            $playersByName[strtolower($player['name'])] = $player;
        }

        $playersFromKillers = DB::table('towny_kill_events')
            ->selectRaw('LOWER(killer_name) as player_key, MAX(killer_name) as name, COUNT(*) as kills')
            ->groupByRaw('LOWER(killer_name)')
            ->get();
        foreach ($playersFromKillers as $player) {
            $key = $player->player_key;
            if (! isset($playersByName[$key])) {
                $playersByName[$key] = [
                    'name' => $player->name,
                    'kills' => (int) $player->kills,
                    'online' => false,
                ];
            }
        }

        $playersFromVictims = DB::table('towny_kill_events')
            ->selectRaw('LOWER(victim_name) as player_key, MAX(victim_name) as name')
            ->groupByRaw('LOWER(victim_name)')
            ->get();
        foreach ($playersFromVictims as $player) {
            $key = $player->player_key;
            if (! isset($playersByName[$key])) {
                $playersByName[$key] = [
                    'name' => $player->name,
                    'kills' => 0,
                    'online' => false,
                ];
            }
        }
        $players = array_values($playersByName);
        $townsByName = [];

        foreach ($towns as $town) {
            $key = strtolower($town['name']);
            $townsByName[$key] = [
                'name' => $town['name'],
                'players' => array_map(
                    fn (array|string $player) => is_string($player)
                        ? ['name' => $player, 'kills' => 0, 'online' => true]
                        : [
                            'name' => $player['name'],
                            'kills' => (int) $player['kills'],
                            'online' => (bool) ($player['online'] ?? true),
                        ],
                    $town['players'] ?? $town['residents'] ?? []
                ),
                'kills' => [],
            ];
        }

        $kills = DB::table('towny_kill_events')
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->limit(self::RECENT_KILLS_LIMIT)
            ->get(['killer_name', 'killer_town', 'victim_name', 'occurred_at']);

        foreach ($kills as $kill) {
            $townName = $kill->killer_town ?: 'Sin ciudad';
            $key = strtolower($townName);
            if (! isset($townsByName[$key])) {
                $townsByName[$key] = [
                    'name' => $townName,
                    'players' => [],
                    'kills' => [],
                ];
            }

            $townsByName[$key]['kills'][] = [
                'killer_name' => $kill->killer_name,
                'victim_name' => $kill->victim_name,
                'occurred_at' => $kill->occurred_at,
            ];
        }

        $towns = array_values($townsByName);
        usort($towns, fn (array $first, array $second) => strcasecmp($first['name'], $second['name']));

        $updatedAt = $snapshot?->updated_at;
        $latestKill = $kills->first()?->occurred_at;
        if ($latestKill && (! $updatedAt || Carbon::parse($latestKill)->gt(Carbon::parse($updatedAt)))) {
            $updatedAt = $latestKill;
        }

        return response()->json([
            'towns' => $towns,
            'players' => $players,
            'updated_at' => $updatedAt,
        ]);
    }

    public function store(Request $request)
    {
        $syncToken = (string) config('services.towny.sync_token');

        if ($syncToken === '') {
            return response()->json([
                'message' => 'La sincronización de Towny no está configurada.',
            ], 503);
        }

        $providedToken = $request->bearerToken();

        if (! is_string($providedToken) || ! hash_equals($syncToken, $providedToken)) {
            return response()->json([
                'message' => 'No autorizado.',
            ], 401);
        }

        $validated = $request->validate([
            'towns' => ['required', 'array', 'max:1000'],
            'towns.*.name' => ['required', 'string', 'max:100'],
            'towns.*.players' => ['sometimes', 'array', 'max:10000'],
            'towns.*.players.*' => ['required', 'array:name,kills,online'],
            'towns.*.players.*.name' => ['required', 'string', 'max:16'],
            'towns.*.players.*.kills' => ['required', 'integer', 'min:0', 'max:1000000000'],
            'towns.*.players.*.online' => ['sometimes', 'boolean'],
            'towns.*.residents' => ['sometimes', 'array', 'max:10000'],
            'towns.*.residents.*' => ['required', 'string', 'max:16'],
            'players' => ['sometimes', 'array', 'max:10000'],
            'players.*' => ['required', 'array:name,kills,online'],
            'players.*.name' => ['required', 'string', 'max:16'],
            'players.*.kills' => ['required', 'integer', 'min:0', 'max:1000000000'],
            'players.*.online' => ['sometimes', 'boolean'],
        ]);

        $towns = array_map(function (array $town) {
            $players = $town['players'] ?? array_map(
                fn (string $resident) => ['name' => $resident, 'kills' => 0, 'online' => true],
                $town['residents'] ?? []
            );
            $players = array_map(
                fn (array $player) => [
                    'name' => $player['name'],
                    'kills' => $player['kills'],
                    'online' => (bool) ($player['online'] ?? true),
                ],
                $players
            );

            return [
                'name' => $town['name'],
                'players' => $players,
            ];
        }, $validated['towns']);
        $players = array_map(
            fn (array $player) => [
                'name' => $player['name'],
                'kills' => $player['kills'],
                'online' => (bool) ($player['online'] ?? true),
            ],
            $validated['players'] ?? array_merge(...array_map(
                fn (array $town) => $town['players'],
                $towns ?: [[]]
            ))
        );

        $now = now();
        $exists = DB::table('towny_town_snapshots')->where('id', 1)->exists();
        $values = [
            'data' => json_encode([
                'towns' => $towns,
                'players' => $players,
            ], JSON_THROW_ON_ERROR),
            'updated_at' => $now,
        ];

        if (! $exists) {
            $values['created_at'] = $now;
        }

        DB::table('towny_town_snapshots')->updateOrInsert(
            ['id' => 1],
            $values
        );

        return response()->json([
            'message' => 'Ciudades de Towny sincronizadas.',
            'updated_at' => $now->toIso8601String(),
        ]);
    }
}
