<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthOtpController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\CouponApiController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\Api\AdminDashController;
use App\Http\Controllers\BannerController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\DriverLocationController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\PrinterApiController;

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

// Store Settings (Online/Offline)
Route::get('/settings', [\App\Http\Controllers\Api\SettingController::class, 'index']);

// Banners/Sliders
Route::get('/banners', [BannerController::class, 'index']);
Route::get('/offer-banner', function() {
    $banner = \App\Models\OfferBanner::where('is_active', true)->latest()->first();
    if($banner && $banner->image_url){
         $banner->image_url = env('APP_URL') . '/' . $banner->image_url;
    }
    return response()->json(['success' => true, 'data' => $banner]);
});

// Content (Legacy - Optional)
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);

// ==========================================
// 2. APP VERSION AND CONFIG (Public)
// ==========================================
Route::get('/app-version', function () {
    return response()->json([
        'success'         => true,
        'minimum_version' => '21.0.0', // Update this when you want to force updates
        'store_url_android' => 'https://play.google.com/store/apps/details?id=com.associatedmedia.amigospizza',
        'store_url_ios'     => 'https://apps.apple.com/us/app/amigos-pizza/id6758044063' // Replace with actual iOS ID if needed
    ]);
});

// ==========================================
// 3. CUSTOMER ROUTES (Requires Token)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    
    // Ordering
    Route::post('/place-order', [OrderController::class, 'store']);
    Route::post('/validate-coupon', [CouponApiController::class, 'validateCoupon']);
    Route::get('/order-history', [OrderController::class, 'index']);
    Route::get('/orders', [OrderController::class, 'index']); // Customer view
    Route::post('/update-order-status', [OrderController::class, 'updatePaymentStatus']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);

    // Profile
    Route::get('/user', [ProfileController::class, 'show']);
    Route::post('/user/update', [ProfileController::class, 'update']);
    Route::delete('/user/delete', [ProfileController::class, 'destroy']);
    Route::get('/user/history', [OrderController::class, 'userHistory']);

    // Driver Location Tracking
    Route::post('/driver/location', [DriverLocationController::class, 'update']);
    Route::get('/orders/{id}/track', [DriverLocationController::class, 'show']);
   
    // Driver Routes
    Route::get('/driver/orders', [App\Http\Controllers\Api\DriverApiController::class, 'getMyOrders']);
    Route::post('/driver/orders/{id}/status', [App\Http\Controllers\Api\DriverApiController::class, 'updateOrderStatus']);
    Route::post('/driver/update-location', [\App\Http\Controllers\Api\DriverApiController::class, 'updateLocation']);
    Route::get('/driver/analytics', [\App\Http\Controllers\Api\DriverApiController::class, 'getAnalytics']);
    Route::get('/driver/order-history', [\App\Http\Controllers\Api\DriverApiController::class, 'getOrderHistory']);
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

// get settings
Route::get('/app-settings', [SettingController::class, 'getAppSettings']);
Route::post('/settings/update', [SettingController::class, 'updateSetting'])->middleware(['auth:sanctum', 'admin']);

// Printer API (For Local Bridge)
Route::group(['prefix' => 'printer'], function () {
    Route::get('/configs', [PrinterApiController::class, 'getConfigs']);
    Route::get('/pending-jobs', [PrinterApiController::class, 'getPendingJobs']);
    Route::post('/jobs/{id}/status', [PrinterApiController::class, 'updateJobStatus']);
    
    // TEMPORARY: Expose logs to debug missing print jobs on AWS
    // Route::get('/debug-logs', function () {
    //     $logFile = storage_path('logs/laravel.log');
    //     if (file_exists($logFile)) {
    //         // Get the last 500 lines for faster loading
    //         $lines = file($logFile);
    //         $lastLines = array_slice($lines, -500);
    //         return response(implode("", $lastLines))->header('Content-Type', 'text/plain');
    //     }
    //     return response('No log file found.', 404);
    // });

    // TEMPORARY: Expose DB contents to check if jobs are saving
    // Route::get('/debug-db', function () {
    //     return response()->json([
    //         'total_jobs' => \App\Models\PrintJob::count(),
    //         'all_jobs' => \App\Models\PrintJob::all()
    //     ]);
    // });
});