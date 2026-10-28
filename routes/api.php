<?php

use App\Http\Controllers\UsuarioController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\PayPalController;

Route::post('/create-checkout-session', [CheckoutController::class, 'create']);
Route::post('/paypal/orders', [PayPalController::class, 'createOrder'])->middleware('throttle:10,1');
Route::post('/paypal/orders/{orderId}/capture', [PayPalController::class, 'captureOrder'])->middleware('throttle:10,1');

Route::post('/usuarios', [UsuarioController::class, 'store']);
Route::post('/login', [UsuarioController::class, 'login'])->middleware('throttle:5,1');