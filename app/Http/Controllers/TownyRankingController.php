<?php

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TownyRankingController extends Controller
{
    public function show()
    {
        try {
            $snapshot = DB::table('towny_ranking_snapshots')->where('id', 1)->first();

            return response()->json([
                'nations' => $snapshot
                    ? json_decode($snapshot->data, true, 512, JSON_THROW_ON_ERROR)
                    : [],
                'updated_at' => $snapshot?->updated_at,
            ]);
        } catch (QueryException $exception) {
            Log::warning('Unable to load the Towny ranking from the database.', [
                'sql_state' => $exception->getCode(),
            ]);

            return response()->json([
                'available' => false,
                'message' => 'La clasificación de Towny no está disponible. Revisa la conexión y las migraciones de la base de datos.',
                'nations' => [],
                'updated_at' => null,
            ], 503);
        }
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
            'nations' => ['required', 'array', 'max:1000'],
            'nations.*.name' => ['required', 'string', 'max:100'],
            'nations.*.towns' => ['required', 'integer', 'min:0', 'max:100000'],
            'nations.*.residents' => ['required', 'integer', 'min:0', 'max:1000000'],
            'nations.*.land' => ['required', 'integer', 'min:0', 'max:100000000'],
            'nations.*.kills' => ['sometimes', 'required', 'integer', 'min:0', 'max:1000000000'],
        ]);

        $nations = array_map(
            fn (array $nation) => [...$nation, 'kills' => $nation['kills'] ?? 0],
            $validated['nations']
        );

        $now = now();
        $exists = DB::table('towny_ranking_snapshots')->where('id', 1)->exists();
        $values = [
            'data' => json_encode($nations, JSON_THROW_ON_ERROR),
            'updated_at' => $now,
        ];

        if (! $exists) {
            $values['created_at'] = $now;
        }

        DB::table('towny_ranking_snapshots')->updateOrInsert(['id' => 1], $values);

        return response()->json([
            'message' => 'Clasificación de Towny sincronizada.',
            'updated_at' => $now->toIso8601String(),
        ]);
    }
}
