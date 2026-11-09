<?php

namespace Tests\Feature;

use App\Models\Usuario;
use App\Notifications\UsuarioResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_sends_a_reset_link_without_revealing_unknown_emails(): void
    {
        Notification::fake();
        $usuario = $this->createUsuario();

        $this->postJson('/api/password/email', ['email' => $usuario->email])
            ->assertAccepted()
            ->assertJsonPath(
                'message',
                'Si el correo pertenece a una cuenta, recibirás un enlace para restablecer la contraseña.',
            );

        Notification::assertSentTo($usuario, UsuarioResetPasswordNotification::class);

        $this->postJson('/api/password/email', ['email' => 'desconocido@example.com'])
            ->assertAccepted()
            ->assertJsonPath(
                'message',
                'Si el correo pertenece a una cuenta, recibirás un enlace para restablecer la contraseña.',
            );
    }

    public function test_production_does_not_claim_to_send_recovery_email_with_the_log_mailer(): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        config(['mail.default' => 'log']);
        Notification::fake();
        Log::shouldReceive('warning')
            ->once()
            ->with('Password recovery is unavailable because the production mailer is set to log.');

        $this->postJson('/api/password/email', ['email' => 'ana@example.com'])
            ->assertServiceUnavailable()
            ->assertJsonPath(
                'message',
                'La recuperación de contraseña no está disponible en este momento.',
            );

        Notification::assertNothingSent();
    }

    public function test_it_resets_the_password_with_a_valid_token(): void
    {
        Notification::fake();
        $usuario = $this->createUsuario();

        $this->postJson('/api/password/email', ['email' => $usuario->email])->assertAccepted();

        $token = null;
        Notification::assertSentTo(
            $usuario,
            UsuarioResetPasswordNotification::class,
            function (UsuarioResetPasswordNotification $notification) use (&$token, $usuario): bool {
                $token = $notification->token;
                $resetUrl = $notification->toMail($usuario)->actionUrl;

                $this->assertStringContainsString('/reset-password?token=', $resetUrl);
                $this->assertStringContainsString('email=ana%40example.com', $resetUrl);

                return true;
            },
        );

        $this->postJson('/api/password/reset', [
            'email' => $usuario->email,
            'token' => $token,
            'password' => 'NuevaClave123',
            'password_confirmation' => 'NuevaClave123',
        ])->assertOk()
            ->assertJsonPath('message', 'Tu contraseña se actualizó. Ya puedes iniciar sesión.');

        $this->assertTrue(Hash::check('NuevaClave123', $usuario->fresh()->password));
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $usuario->email]);
    }

    public function test_it_rejects_an_invalid_reset_token(): void
    {
        $usuario = $this->createUsuario();

        $this->postJson('/api/password/reset', [
            'email' => $usuario->email,
            'token' => 'invalid-token',
            'password' => 'NuevaClave123',
            'password_confirmation' => 'NuevaClave123',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'El enlace venció o ya fue utilizado. Solicita uno nuevo.');

        $this->assertTrue(Hash::check('ClaveActual123', $usuario->fresh()->password));
    }

    public function test_it_rejects_an_expired_reset_token(): void
    {
        Notification::fake();
        $usuario = $this->createUsuario();

        $this->postJson('/api/password/email', ['email' => $usuario->email])->assertAccepted();

        $token = null;
        Notification::assertSentTo(
            $usuario,
            UsuarioResetPasswordNotification::class,
            function (UsuarioResetPasswordNotification $notification) use (&$token): bool {
                $token = $notification->token;

                return true;
            },
        );

        $this->travel(61)->minutes();

        $this->postJson('/api/password/reset', [
            'email' => $usuario->email,
            'token' => $token,
            'password' => 'NuevaClave123',
            'password_confirmation' => 'NuevaClave123',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'El enlace venció o ya fue utilizado. Solicita uno nuevo.');

        $this->assertTrue(Hash::check('ClaveActual123', $usuario->fresh()->password));
    }

    private function createUsuario(): Usuario
    {
        return Usuario::create([
            'nombre' => 'Ana',
            'email' => 'ana@example.com',
            'password' => Hash::make('ClaveActual123'),
        ]);
    }
}
