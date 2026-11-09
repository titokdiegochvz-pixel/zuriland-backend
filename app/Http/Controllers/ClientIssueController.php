<?php

namespace App\Http\Controllers;

use App\Mail\OperationalIssueAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

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

        $this->sendAlert($validated);

        return response()->json(['message' => 'Reporte recibido.'], 202);
    }

    private function sendAlert(array $issue): void
    {
        $recipient = config('services.operations.alert_email');

        if (
            ! is_string($recipient)
            || filter_var($recipient, FILTER_VALIDATE_EMAIL) === false
            || config('mail.default') === 'log'
        ) {
            return;
        }

        $key = 'operations-alert:'.hash('sha256', $issue['feature'].'|'.$issue['failure']);

        try {
            RateLimiter::attempt($key, 1, function () use ($recipient, $issue): bool {
                Mail::to($recipient)->send(new OperationalIssueAlert(
                    $issue['feature'],
                    $issue['failure'],
                    $issue['status'] ?? null,
                ));

                return true;
            }, 900);
        } catch (TransportExceptionInterface $exception) {
            Log::error('Operational alert email could not be sent.', [
                'feature' => $issue['feature'],
                'exception' => $exception::class,
            ]);
        }
    }
}
