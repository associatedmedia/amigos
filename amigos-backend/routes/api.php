<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthOtpController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\Api\AdminDashController;
use App\Http\Controllers\BannerController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ==========================================
// 1. PUBLIC ROUTES (No Token Required)
// ==========================================

// Authentication
Route::post('/send-otp', [AuthOtpController::class, 'sendOtp']);
Route::post('/verify-otp', [AuthOtpController::class, 'verifyOtp']);
Route::post('/login-with-otp', [AuthOtpController::class, 'verifyOtp']); // Alias for Admin App

// Public Menu Data
Route::get('/menu', [MenuController::class, 'index']);
Route::get('/products', [MenuController::class, 'index']); // Fallback

// Banners/Sliders
Route::get('/banners', [BannerController::class, 'index']);

// Content (Legacy - Optional)
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);

// ==========================================
// 2. CUSTOMER ROUTES (Requires Token)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    
    // Ordering
    Route::post('/place-order', [OrderController::class, 'store']);
    Route::get('/order-history', [OrderController::class, 'index']);
    Route::get('/orders', [OrderController::class, 'index']); // Customer view
    Route::post('/update-order-status', [OrderController::class, 'updatePaymentStatus']);

    // Profile
    Route::get('/user', [ProfileController::class, 'show']);
    Route::post('/user/update', [ProfileController::class, 'update']);
});

// ==========================================
// 3. ADMIN DASHBOARD ROUTES
// ==========================================

// NOTE: If you haven't created a specific 'admin' middleware yet, 
// remove 'admin' from the array below -> middleware(['auth:sanctum'])
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {

    // --- Dashboard Stats ---
    Route::get('/stats', [AdminDashController::class, 'stats']);

    // --- Order Management (Kitchen Display) ---
    Route::get('/orders', [AdminDashController::class, 'index']);
    Route::post('/orders/{id}/status', [AdminDashController::class, 'updateStatus']);

    // --- Driver Management ---
    Route::get('/drivers', [AdminDashController::class, 'getDrivers']);
    Route::post('/drivers', [AdminDashController::class, 'addDriver']);
    Route::delete('/drivers/{id}', [AdminDashController::class, 'deleteDriver']);

    // --- Banner/Slider Management ---
    Route::get('/sliders', [AdminDashController::class, 'getBanners']);
    Route::post('/sliders', [AdminDashController::class, 'uploadBanner']);
    Route::delete('/sliders/{id}', [AdminDashController::class, 'deleteBanner']);

    // --- Menu/Product Management ---
    Route::post('/products/{id}/toggle', [AdminDashController::class, 'toggleProduct']); // ✅ Missing Fix

    // --- Customer Data ---
    Route::get('/customers', [AdminDashController::class, 'getCustomers']);

    // --- Legacy Content Controller (Optional) ---
    Route::get('/content', [ContentController::class, 'getAll']);
    Route::post('/product', [ContentController::class, 'storeProduct']);
    Route::delete('/product/{id}', [ContentController::class, 'deleteProduct']);
    Route::post('/banner', [ContentController::class, 'storeBanner']);
    Route::delete('/banner/{id}', [ContentController::class, 'deleteBanner']);

});