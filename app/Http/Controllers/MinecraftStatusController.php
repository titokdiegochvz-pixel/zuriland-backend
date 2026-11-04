<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MinecraftStatusController extends Controller
{
    public function show()
    {
        try {
            $status = Cache::get('minecraft.server.status');
            if ($status !== null) {
                return response()->json($status);
            }

            $status = Cache::remember('minecraft.server.status', now()->addSeconds(15), function () {
                $response = Http::acceptJson()
                    ->timeout(5)
                    ->get(
                        rtrim(config('services.minecraft.status_url'), '/').'/'.config('services.minecraft.host')
                    );
                $response->throw();

                $data = $response->json();
                if (! is_array($data) || ! is_bool($data['online'] ?? null)) {
                    Log::warning('Minecraft status provider returned an invalid response.');

                    return null;
                }

                return [
                    'online' => $data['online'],
                    'players' => [
                        'online' => max(0, (int) data_get($data, 'players.online', 0)),
                        'max' => max(0, (int) data_get($data, 'players.max', 0)),
                    ],
                ];
            });

            if ($status === null) {
                return response()->json(['message' => 'El proveedor devolvió un estado de Minecraft inválido.'], 502);
            }

            return response()->json($status);
        } catch (ConnectionException|RequestException $exception) {
            Log::warning('Unable to fetch Minecraft server status.', [
                'message' => $exception->getMessage(),
            ]);

            return response()->json(['message' => 'No se pudo consultar el estado del servidor Minecraft.'], 503);
        }
    }

    public function store(Request $request)
    {
        $syncToken = (string) config('services.towny.sync_token');

        if ($syncToken === '') {
            return response()->json([
                'message' => 'La sincronización de Minecraft no está configurada.',
            ], 503);
        }

        $providedToken = $request->bearerToken();

        if (! is_string($providedToken) || ! hash_equals($syncToken, $providedToken)) {
            return response()->json([
                'message' => 'No autorizado.',
            ], 401);
        }

        $validated = $request->validate([
            'online' => ['required', 'boolean'],
            'players.online' => ['required', 'integer', 'min:0', 'max:1000000'],
            'players.max' => ['required', 'integer', 'min:0', 'max:1000000'],
        ]);

        $status = [
            'online' => $validated['online'],
            'players' => [
                'online' => $validated['players']['online'],
                'max' => $validated['players']['max'],
            ],
        ];

        Cache::put('minecraft.server.status', $status, now()->addSeconds(15));

        return response()->json([
            'message' => 'Estado de Minecraft sincronizado.',
        ]);
    }
}
