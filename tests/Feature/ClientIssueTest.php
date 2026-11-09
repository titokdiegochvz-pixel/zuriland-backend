<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class ClientIssueTest extends TestCase
{
    public function test_it_logs_only_allowlisted_client_issue_metadata(): void
    {
        Log::shouldReceive('warning')
            ->once()
            ->with('Client reported an operational issue.', [
                'feature' => 'payment',
                'failure' => 'http_error',
                'status' => 503,
            ]);

        $this->postJson('/api/client-issues', [
            'feature' => 'payment',
            'failure' => 'http_error',
            'status' => 503,
            'email' => 'private@example.com',
            'message' => 'This data must not be logged.',
        ])->assertAccepted();
    }

    public function test_it_rejects_unrecognized_issue_metadata(): void
    {
        $this->postJson('/api/client-issues', [
            'feature' => 'unknown',
            'failure' => 'http_error',
            'status' => 503,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['feature']);
    }
}
