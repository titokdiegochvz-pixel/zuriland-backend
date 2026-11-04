<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class TownyKillController extends Controller
{
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
            'event_id' => ['required', 'uuid'],
            'killer_name' => ['required', 'string', 'max:16'],
            'killer_town' => ['nullable', 'string', 'max:100'],
            'victim_name' => ['required', 'string', 'max:16', 'different:killer_name'],
            'occurred_at' => ['required', 'date'],
        ]);

        $inserted = DB::table('towny_kill_events')->insertOrIgnore([
            'event_id' => $validated['event_id'],
            'killer_name' => $validated['killer_name'],
            'killer_town' => $validated['killer_town'] ?? null,
            'victim_name' => $validated['victim_name'],
            'occurred_at' => Carbon::parse($validated['occurred_at']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => $inserted
                ? 'Baja de jugador registrada.'
                : 'La baja ya estaba registrada.',
        ], $inserted ? 201 : 200);
    }
}
