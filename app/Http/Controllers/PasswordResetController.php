<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class PasswordResetController extends Controller
{
    public function sendLink(Request $request): JsonResponse
    {
        if (app()->environment('production') && config('mail.default') === 'log') {
            return response()->json([
                'message' => 'La recuperación de contraseña no está disponible en este momento.',
            ], 503);
        }

        $validated = $request->validate([
            'email' => 'required|email',
        ], [
            'email.required' => 'Escribe el correo de tu cuenta.',
            'email.email' => 'Escribe un correo electrónico válido.',
        ]);

        Password::broker('usuarios')->sendResetLink($validated);

        return response()->json([
            'message' => 'Si el correo pertenece a una cuenta, recibirás un enlace para restablecer la contraseña.',
        ], 202);
    }

    public function reset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'email.required' => 'No encontramos el correo de esta solicitud.',
            'email.email' => 'El correo del enlace no es válido.',
            'token.required' => 'El enlace no contiene un token válido. Solicita uno nuevo.',
            'password.required' => 'Escribe una nueva contraseña.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ]);

        $status = Password::broker('usuarios')->reset(
            $validated,
            function (Usuario $usuario, string $password): void {
                $usuario->forceFill([
                    'password' => Hash::make($password),
                ])->save();
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => $status === Password::INVALID_TOKEN
                    ? 'El enlace venció o ya fue utilizado. Solicita uno nuevo.'
                    : 'No se pudo encontrar una cuenta con ese correo.',
            ], 422);
        }

        return response()->json([
            'message' => 'Tu contraseña se actualizó. Ya puedes iniciar sesión.',
        ]);
    }
}
