<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ClientIssueController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'feature' => ['required', 'string', 'in:account,payment,minecraft-status'],
            'failure' => ['required', 'string', 'in:network,http_error'],
            'status' => ['nullable', 'integer', 'min:400', 'max:599'],
        ]);

        Log::warning('Client reported an operational issue.', [
            'feature' => $validated['feature'],
            'failure' => $validated['failure'],
            'status' => $validated['status'] ?? null,
        ]);

        return response()->json(['message' => 'Reporte recibido.'], 202);
    }
}
