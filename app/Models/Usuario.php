<?php

namespace App\Models;

use App\Notifications\UsuarioResetPasswordNotification;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Usuario extends Authenticatable
{
    use Notifiable;

    protected $table = 'usuarios';

    protected $fillable = [
        'nombre',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
    ];

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new UsuarioResetPasswordNotification($token));
    }
}
