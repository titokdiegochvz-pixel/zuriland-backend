<?php

use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\ClientIssueController;
use App\Http\Controllers\MinecraftStatusController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\PayPalController;
use App\Http\Controllers\TownyKillController;
use App\Http\Controllers\TownyRankingController;
use App\Http\Controllers\TownyTownController;
use App\Http\Controllers\UsuarioController;
use Illuminate\Support\Facades\Route;

Route::get('/minecraft/status', [MinecraftStatusController::class, 'show'])->middleware('throttle:120,1');
Route::post('/minecraft/status', [MinecraftStatusController::class, 'store'])->middleware('throttle:30,1');
Route::get('/towny/ranking', [TownyRankingController::class, 'show']);
Route::post('/towny/ranking', [TownyRankingController::class, 'store'])->middleware('throttle:towny-ranking-sync');
Route::get('/towny/kills', [TownyTownController::class, 'index'])->middleware('throttle:120,1');
Route::post('/towny/kills', [TownyKillController::class, 'store'])->middleware('throttle:600,1');
Route::post('/towny/towns', [TownyTownController::class, 'store'])->middleware('throttle:towny-town-sync');

Route::post('/client-issues', [ClientIssueController::class, 'store'])->middleware('throttle:30,1');
Route::post('/create-checkout-session', [CheckoutController::class, 'create'])->middleware('throttle:10,1');
Route::get('/checkout-session/{sessionId}', [CheckoutController::class, 'status'])
    ->where('sessionId', 'cs_[A-Za-z0-9_]+')
    ->middleware('throttle:30,1');
Route::post('/paypal/orders', [PayPalController::class, 'createOrder'])->middleware('throttle:10,1');
Route::post('/paypal/orders/{orderId}/capture', [PayPalController::class, 'captureOrder'])->middleware('throttle:10,1');

Route::post('/usuarios', [UsuarioController::class, 'store']);
Route::post('/login', [UsuarioController::class, 'login'])->middleware('throttle:5,1');
Route::post('/password/email', [PasswordResetController::class, 'sendLink'])->middleware('throttle:3,1');
Route::post('/password/reset', [PasswordResetController::class, 'reset'])->middleware('throttle:5,1');
