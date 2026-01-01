<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthOtpController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProfileController;


// Auth Routes
Route::post('/send-otp', [AuthOtpController::class, 'sendOtp']);
Route::post('/verify-otp', [AuthOtpController::class, 'verifyOtp']);

// Protected Routes (Require Token)
Route::middleware('auth:sanctum')->group(function () {

    // Menu
    Route::get('/menu', [MenuController::class, 'index']);

    // Orders
    Route::post('/place-order', [OrderController::class, 'store']);
    Route::get('/order-history', [OrderController::class, 'index']);
    Route::get('/orders', [OrderController::class, 'index']);


    // Profile
    Route::get('/user', [ProfileController::class, 'show']);
    Route::post('/user/update', [ProfileController::class, 'update']);
});