<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UsuarioRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_registers_a_usuario(): void
    {
        $response = $this->postJson('/api/usuarios', [
            'nombre' => 'Ana',
            'email' => 'ana@example.com',
            'password' => 'ClaveSegura123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('nombre', 'Ana')
            ->assertJsonPath('email', 'ana@example.com')
            ->assertJsonMissingPath('password');

        $this->assertDatabaseHas('usuarios', [
            'nombre' => 'Ana',
            'email' => 'ana@example.com',
        ]);

        $usuario = \App\Models\Usuario::where('email', 'ana@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('ClaveSegura123', $usuario->password));
    }

    public function test_it_logs_in_with_the_registered_username_or_email(): void
    {
        $this->postJson('/api/usuarios', [
            'nombre' => 'Ana',
            'email' => 'ana@example.com',
            'password' => 'ClaveSegura123',
        ])->assertCreated();

        $this->postJson('/api/login', [
            'identificador' => 'Ana',
            'password' => 'ClaveSegura123',
        ])->assertOk()
            ->assertJsonPath('usuario.nombre', 'Ana')
            ->assertJsonMissingPath('usuario.password');

        $this->postJson('/api/login', [
            'identificador' => 'ana@example.com',
            'password' => 'ClaveSegura123',
        ])->assertOk()
            ->assertJsonPath('usuario.email', 'ana@example.com');
    }

    public function test_it_rejects_invalid_login_credentials(): void
    {
        $this->postJson('/api/usuarios', [
            'nombre' => 'Ana',
            'email' => 'ana@example.com',
            'password' => 'ClaveSegura123',
        ])->assertCreated();

        $this->postJson('/api/login', [
            'identificador' => 'Ana',
            'password' => 'incorrecta',
        ])->assertUnauthorized()
            ->assertJsonPath('message', 'Usuario o contraseña incorrectos.');
    }
}
