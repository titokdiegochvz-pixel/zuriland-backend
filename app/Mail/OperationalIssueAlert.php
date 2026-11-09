<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OperationalIssueAlert extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $feature,
        public readonly string $failure,
        public readonly ?int $status,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Alerta operativa de ZuriLand');
    }

    public function content(): Content
    {
        return new Content(text: 'emails.operational-issue-alert');
    }
}
