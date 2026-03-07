<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RazorpayWebController;
use App\Http\Controllers\webadmin\AuthController;
use App\Http\Controllers\webadmin\DashboardController;
use App\Http\Controllers\webadmin\OrderController;
use App\Http\Controllers\webadmin\ProductController;
use App\Http\Controllers\webadmin\CategoryController;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('admin')->group(function () {
    Route::get('login', [AuthController::class, 'showLoginForm'])->name('admin.login');
    Route::post('login', [AuthController::class, 'login'])->name('admin.login.submit');
    Route::post('logout', [AuthController::class, 'logout'])->name('admin.logout');

    Route::middleware(['admin'])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
        
        Route::get('orders', [OrderController::class, 'index'])->name('admin.orders.index');
        Route::get('orders/{id}', [OrderController::class, 'show'])->name('admin.orders.show');
        
        Route::get('products', [ProductController::class, 'index'])->name('admin.products.index');
        Route::get('products/{id}', [ProductController::class, 'show'])->name('admin.products.show');
        
        Route::get('categories', [CategoryController::class, 'index'])->name('admin.categories.index');
    });
});
