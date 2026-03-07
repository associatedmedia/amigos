<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RazorpayWebController;
use App\Http\Controllers\webadmin\AuthController;
use App\Http\Controllers\webadmin\DashboardController;
use App\Http\Controllers\webadmin\OrderController;
use App\Http\Controllers\webadmin\ProductController;
use App\Http\Controllers\webadmin\CategoryController;

use App\Http\Controllers\webadmin\CustomerController;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('admin')->group(function () {
    Route::get('login', [AuthController::class, 'showLoginForm'])->name('admin.login');
    Route::post('login', [AuthController::class, 'login'])->name('admin.login.submit');
    Route::post('logout', [AuthController::class, 'logout'])->name('admin.logout');

    Route::middleware(['admin'])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
        
        // Customers
        Route::get('customers', [CustomerController::class, 'index'])->name('admin.customers.index');
        Route::get('customers/data', [CustomerController::class, 'data'])->name('admin.customers.data');
        Route::get('customers/create', [CustomerController::class, 'create'])->name('admin.customers.create');
        
        // Orders
        Route::get('orders', [OrderController::class, 'index'])->name('admin.orders.index');
        Route::get('orders/data', [OrderController::class, 'data'])->name('admin.orders.data');
        Route::get('orders/create', [OrderController::class, 'create'])->name('admin.orders.create');
        Route::get('orders/{id}', [OrderController::class, 'show'])->name('admin.orders.show');
        
        // Products
        Route::get('products', [ProductController::class, 'index'])->name('admin.products.index');
        Route::get('products/data', [ProductController::class, 'data'])->name('admin.products.data');
        Route::get('products/create', [ProductController::class, 'create'])->name('admin.products.create');
        Route::get('products/{id}', [ProductController::class, 'show'])->name('admin.products.show');
        
        // Categories
        Route::get('categories', [CategoryController::class, 'index'])->name('admin.categories.index');
        Route::get('categories/data', [CategoryController::class, 'data'])->name('admin.categories.data');
        Route::get('categories/create', [CategoryController::class, 'create'])->name('admin.categories.create');

        // Banners
        Route::get('banners', [\App\Http\Controllers\webadmin\BannerController::class, 'index'])->name('admin.banners.index');
        Route::get('banners/data', [\App\Http\Controllers\webadmin\BannerController::class, 'data'])->name('admin.banners.data');
        Route::get('banners/create', [\App\Http\Controllers\webadmin\BannerController::class, 'create'])->name('admin.banners.create');
    });
});
