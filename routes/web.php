<?php

use Illuminate\Support\Facades\Route;

$serveFrontend = function () {
    $frontendIndex = public_path('site/index.html');

    return is_file($frontendIndex)
        ? response()->file($frontendIndex)
        : view('welcome');
};

Route::get('/', $serveFrontend);
Route::get('/reset-password', $serveFrontend)->name('password.reset');
Route::get('/{path}', function () use ($serveFrontend) {
    abort_if(str_starts_with(request()->path(), 'api/'), 404);

    return $serveFrontend();
})->where('path', '.*');
