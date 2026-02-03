<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthOtpController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProfileController;
// use App\Http\Controllers\AdminController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\Api\AdminDashController;


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
    Route::post('/update-order-status', [OrderController::class, 'updatePaymentStatus']);


    // Profile
    Route::get('/user', [ProfileController::class, 'show']);
    Route::post('/user/update', [ProfileController::class, 'update']);
});


// Route::get('/admin/orders', [AdminController::class, 'getOrders']);
// Route::get('/admin/drivers', [AdminController::class, 'getDrivers']);
// Route::get('/admin/stats', [AdminController::class, 'getDashboardStats']);
// Route::get('/admin/customers', [AdminController::class, 'getCustomers']);


Route::get('/admin/content', [ContentController::class, 'getAll']);
Route::post('/admin/product', [ContentController::class, 'storeProduct']);
Route::delete('/admin/product/{id}', [ContentController::class, 'deleteProduct']);
Route::post('/admin/banner', [ContentController::class, 'storeBanner']);
Route::delete('/admin/banner/{id}', [ContentController::class, 'deleteBanner']);

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    
    // Kitchen Dashboard: Get all orders
    Route::get('/admin/orders', [AdminDashController::class, 'index']);
    // Kitchen Action: Change status (Cooking, Ready, etc.)
    Route::post('/admin/orders/{id}/status', [AdminDashController::class, 'updateStatus']);
    // Admin Stats
    Route::get('/admin/stats', [AdminDashController::class, 'stats']);

    Route::get('/admin/sliders', [AdminDashController::class, 'getBanners']); // App calls this
    Route::post('/admin/sliders', [AdminDashController::class, 'uploadBanner']); // App calls this
    Route::delete('/admin/sliders/{id}', [AdminDashController::class, 'deleteBanner']); // App calls this

});