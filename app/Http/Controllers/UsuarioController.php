<?php

namespace App\Http\Controllers;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'identificador' => 'required|string',
            'password' => 'required|string',
        ]);

        $usuario = Usuario::where('nombre', $validated['identificador'])
            ->orWhere('email', $validated['identificador'])
            ->first();

        if (!$usuario || !$usuario->password || !Hash::check($validated['password'], $usuario->password)) {
            return response()->json([
                'message' => 'Usuario o contraseña incorrectos.',
            ], 401);
        }

        return response()->json([
            'usuario' => $usuario,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:usuarios',
            'password' => 'required|string|min:8',
        ], [
            'nombre.required' => 'Escribe tu nombre de jugador.',
            'email.required' => 'Escribe tu correo electrónico.',
            'email.email' => 'Escribe un correo electrónico válido.',
            'email.unique' => 'Este correo ya tiene una cuenta.',
            'password.required' => 'Escribe una contraseña.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $usuario = Usuario::create($validated);

        return response()->json($usuario, 201);
    }
}
