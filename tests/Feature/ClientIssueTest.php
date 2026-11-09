<?php

namespace Tests\Feature;

use App\Mail\OperationalIssueAlert;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
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

    public function test_it_emails_deduplicated_alerts_when_mail_is_configured(): void
    {
        Mail::fake();
        config(['mail.default' => 'smtp']);
        config(['services.operations.alert_email' => 'operator@example.com']);

        $key = 'operations-alert:'.hash('sha256', 'payment|http_error');
        RateLimiter::clear($key);

        $issue = [
            'feature' => 'payment',
            'failure' => 'http_error',
            'status' => 503,
        ];

        $this->postJson('/api/client-issues', $issue)->assertAccepted();
        $this->postJson('/api/client-issues', $issue)->assertAccepted();

        Mail::assertSentTimes(OperationalIssueAlert::class, 1);
        Mail::assertSent(OperationalIssueAlert::class, function (OperationalIssueAlert $mail): bool {
            return $mail->hasTo('operator@example.com')
                && $mail->feature === 'payment'
                && $mail->failure === 'http_error'
                && $mail->status === 503;
        });
    }

    public function test_it_does_not_email_alerts_with_the_log_mailer(): void
    {
        Mail::fake();
        config(['mail.default' => 'log']);
        config(['services.operations.alert_email' => 'operator@example.com']);

        $this->postJson('/api/client-issues', [
            'feature' => 'account',
            'failure' => 'network',
        ])->assertAccepted();

        Mail::assertNothingOutgoing();
    }
}
