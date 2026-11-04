<?php

use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\TownyRankingController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\PayPalController;
use App\Http\Controllers\MinecraftStatusController;

Route::get('/minecraft/status', [MinecraftStatusController::class, 'show'])->middleware('throttle:30,1');
Route::post('/minecraft/status', [MinecraftStatusController::class, 'store'])->middleware('throttle:30,1');
Route::get('/towny/ranking', [TownyRankingController::class, 'show']);
Route::post('/towny/ranking', [TownyRankingController::class, 'store'])->middleware('throttle:10,1');

Route::post('/create-checkout-session', [CheckoutController::class, 'create']);
Route::post('/paypal/orders', [PayPalController::class, 'createOrder'])->middleware('throttle:10,1');
Route::post('/paypal/orders/{orderId}/capture', [PayPalController::class, 'captureOrder'])->middleware('throttle:10,1');

Route::post('/usuarios', [UsuarioController::class, 'store']);
Route::post('/login', [UsuarioController::class, 'login'])->middleware('throttle:5,1');