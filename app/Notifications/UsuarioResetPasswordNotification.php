<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UsuarioResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly string $token)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);

        return (new MailMessage)
            ->subject('Restablece tu contraseña de ZuriLand')
            ->greeting('Hola, '.$notifiable->nombre)
            ->line('Recibimos una solicitud para cambiar la contraseña de tu cuenta.')
            ->action('Crear nueva contraseña', $url)
            ->line('Este enlace vence en 60 minutos. Si no solicitaste el cambio, puedes ignorar este mensaje.');
    }
}
