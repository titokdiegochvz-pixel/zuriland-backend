<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class TownyTownController extends Controller
{
    private const RECENT_KILLS_LIMIT = 18;
    private const KILL_LEADERBOARD_LIMIT = 10;

    public function index()
    {
        $snapshot = DB::table('towny_town_snapshots')->where('id', 1)->first();
        $towns = $snapshot
            ? json_decode($snapshot->data, true, 512, JSON_THROW_ON_ERROR)
            : [];
        $townsByName = [];

        foreach ($towns as $town) {
            $key = strtolower($town['name']);
            $townsByName[$key] = [
                'name' => $town['name'],
                'players' => $town['players'] ?? $town['residents'] ?? [],
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

        $killLeaderboard = DB::table('towny_kill_events')
            ->select('killer_name', DB::raw('COUNT(*) as kills'))
            ->groupBy('killer_name')
            ->orderByDesc('kills')
            ->orderBy('killer_name')
            ->limit(self::KILL_LEADERBOARD_LIMIT)
            ->get()
            ->map(fn ($player) => [
                'player' => $player->killer_name,
                'kills' => (int) $player->kills,
            ]);

        $towns = array_values($townsByName);
        usort($towns, fn (array $first, array $second) => strcasecmp($first['name'], $second['name']));

        $updatedAt = $snapshot?->updated_at;
        $latestKill = $kills->first()?->occurred_at;
        if ($latestKill && (! $updatedAt || Carbon::parse($latestKill)->gt(Carbon::parse($updatedAt)))) {
            $updatedAt = $latestKill;
        }

        return response()->json([
            'towns' => $towns,
            'kill_leaderboard' => $killLeaderboard,
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
            'towns.*.players' => ['sometimes', 'required', 'array', 'max:10000'],
            'towns.*.players.*' => ['required', 'string', 'max:16'],
            'towns.*.residents' => ['sometimes', 'required', 'array', 'max:10000'],
            'towns.*.residents.*' => ['required', 'string', 'max:16'],
        ]);

        $towns = array_map(fn (array $town) => [
            'name' => $town['name'],
            'players' => $town['players'] ?? $town['residents'] ?? [],
        ], $validated['towns']);

        $now = now();
        $exists = DB::table('towny_town_snapshots')->where('id', 1)->exists();
        $values = [
            'data' => json_encode($towns, JSON_THROW_ON_ERROR),
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
