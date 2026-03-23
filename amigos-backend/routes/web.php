<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RazorpayWebController;
use App\Http\Controllers\webadmin\AuthController;
use App\Http\Controllers\webadmin\DashboardController;
use App\Http\Controllers\webadmin\OrderController;
use App\Http\Controllers\webadmin\ProductController;
use App\Http\Controllers\webadmin\CategoryController;
use App\Http\Controllers\webadmin\CustomerController;
use App\Http\Controllers\webadmin\OfferBannerController;
use App\Http\Controllers\webadmin\SettingController;
use App\Http\Controllers\webadmin\PrinterSetupController;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('admin')->group(function () {
    Route::get('login', [AuthController::class, 'showLoginForm'])->name('admin.login');
    Route::post('login', [AuthController::class, 'login'])->name('admin.login.submit');
    Route::post('logout', [AuthController::class, 'logout'])->name('admin.logout');

    Route::middleware(['admin'])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
        
        // Settings (Online/Offline Toggle)
        Route::resource('settings', SettingController::class)->names('admin.settings')->only(['index', 'update']);
        Route::get('settings', [SettingController::class, 'index'])->name('admin.settings.index');
        Route::get('settings', [SettingController::class, 'update'])->name('admin.settings.update');
        Route::post('settings/toggle-online', [SettingController::class, 'toggleOnline'])->name('admin.settings.toggleOnline');

    
        // Web Admin - Offer Banners
        Route::get('offer-banners/data', [OfferBannerController::class, 'data'])->name('admin.offer-banners.data');
        Route::resource('offer-banners', OfferBannerController::class)->names('admin.offer-banners')->except(['show']);
        
        // Customers
        Route::get('customers', [CustomerController::class, 'index'])->name('admin.customers.index');
        Route::get('customers/data', [CustomerController::class, 'data'])->name('admin.customers.data');
        Route::get('customers/create', [CustomerController::class, 'create'])->name('admin.customers.create');
        Route::post('customers/ajax', [CustomerController::class, 'storeAjax'])->name('admin.customers.storeAjax');
        Route::post('customers', [CustomerController::class, 'store'])->name('admin.customers.store');
        Route::get('customers/{id}', [CustomerController::class, 'show'])->name('admin.customers.show');
        Route::get('customers/{id}/edit', [CustomerController::class, 'edit'])->name('admin.customers.edit');
        Route::put('customers/{id}', [CustomerController::class, 'update'])->name('admin.customers.update');
        Route::delete('customers/{id}', [CustomerController::class, 'destroy'])->name('admin.customers.destroy');
        
        // Orders
        Route::get('orders', [OrderController::class, 'index'])->name('admin.orders.index');
        Route::get('orders/data', [OrderController::class, 'data'])->name('admin.orders.data');
        Route::get('orders/latest-id', [OrderController::class, 'latestOrderId'])->name('admin.orders.latest_id');
        Route::get('orders/create', [OrderController::class, 'create'])->name('admin.orders.create');
        Route::post('orders', [OrderController::class, 'store'])->name('admin.orders.store');
        Route::get('orders/{id}/edit', [OrderController::class, 'edit'])->name('admin.orders.edit');
        Route::put('orders/{id}', [OrderController::class, 'update'])->name('admin.orders.update');
        Route::get('orders/{id}', [OrderController::class, 'show'])->name('admin.orders.show');
        Route::put('orders/{id}/status', [OrderController::class, 'updateStatus'])->name('admin.orders.updateStatus');
        Route::put('orders/{id}/assign-driver', [OrderController::class, 'assignDriver'])->name('admin.orders.assignDriver');
        
        // Route::resource('orders', App\Http\Controllers\webadmin\OrderController::class);

        Route::get('/admin/orders/{id}/print-kot', [App\Http\Controllers\webadmin\OrderController::class, 'printKOT'])->name('admin.orders.printKOT');

        // Printer Setup
        Route::resource('printer-setups', PrinterSetupController::class)->names('admin.printer-setups');
        
        // Products
        Route::get('products', [ProductController::class, 'index'])->name('admin.products.index');
        Route::get('products/data', [ProductController::class, 'data'])->name('admin.products.data');
        Route::get('products/create', [ProductController::class, 'create'])->name('admin.products.create');
        Route::post('products', [ProductController::class, 'store'])->name('admin.products.store');
        Route::get('products/{id}', [ProductController::class, 'show'])->name('admin.products.show');
        Route::get('products/{id}/edit', [ProductController::class, 'edit'])->name('admin.products.edit');
        Route::put('products/{id}', [ProductController::class, 'update'])->name('admin.products.update');
        Route::delete('products/{id}', [ProductController::class, 'destroy'])->name('admin.products.destroy');
        
        // Categories
        Route::get('categories', [CategoryController::class, 'index'])->name('admin.categories.index');
        Route::get('categories/data', [CategoryController::class, 'data'])->name('admin.categories.data');
        Route::get('categories/create', [CategoryController::class, 'create'])->name('admin.categories.create');
        Route::post('categories', [CategoryController::class, 'store'])->name('admin.categories.store');
        Route::get('categories/{id}', [CategoryController::class, 'show'])->name('admin.categories.show');
        Route::get('categories/{id}/edit', [CategoryController::class, 'edit'])->name('admin.categories.edit');
        Route::put('categories/{id}', [CategoryController::class, 'update'])->name('admin.categories.update');
        Route::delete('categories/{id}', [CategoryController::class, 'destroy'])->name('admin.categories.destroy');

        // Banners
        Route::get('banners', [\App\Http\Controllers\webadmin\BannerController::class, 'index'])->name('admin.banners.index');
        Route::get('banners/data', [\App\Http\Controllers\webadmin\BannerController::class, 'data'])->name('admin.banners.data');
        Route::get('banners/create', [\App\Http\Controllers\webadmin\BannerController::class, 'create'])->name('admin.banners.create');
        Route::post('banners', [\App\Http\Controllers\webadmin\BannerController::class, 'store'])->name('admin.banners.store');
        Route::get('banners/{id}', [\App\Http\Controllers\webadmin\BannerController::class, 'show'])->name('admin.banners.show');
        Route::get('banners/{id}/edit', [\App\Http\Controllers\webadmin\BannerController::class, 'edit'])->name('admin.banners.edit');
        Route::put('banners/{id}', [\App\Http\Controllers\webadmin\BannerController::class, 'update'])->name('admin.banners.update');
        Route::delete('banners/{id}', [\App\Http\Controllers\webadmin\BannerController::class, 'destroy'])->name('admin.banners.destroy');
        // Drivers
        Route::get('drivers', [\App\Http\Controllers\webadmin\DriverController::class, 'index'])->name('admin.drivers.index');
        Route::get('drivers/data', [\App\Http\Controllers\webadmin\DriverController::class, 'data'])->name('admin.drivers.data');
        Route::get('drivers/create', [\App\Http\Controllers\webadmin\DriverController::class, 'create'])->name('admin.drivers.create');
        Route::post('drivers', [\App\Http\Controllers\webadmin\DriverController::class, 'store'])->name('admin.drivers.store');
        Route::get('drivers/{id}/edit', [\App\Http\Controllers\webadmin\DriverController::class, 'edit'])->name('admin.drivers.edit');
        Route::put('drivers/{id}', [\App\Http\Controllers\webadmin\DriverController::class, 'update'])->name('admin.drivers.update');
        Route::delete('drivers/{id}', [\App\Http\Controllers\webadmin\DriverController::class, 'destroy'])->name('admin.drivers.destroy');
        // Order Statuses
        Route::get('order-statuses', [\App\Http\Controllers\webadmin\OrderStatusController::class, 'index'])->name('admin.order-statuses.index');
        Route::get('order-statuses/data', [\App\Http\Controllers\webadmin\OrderStatusController::class, 'data'])->name('admin.order-statuses.data');
        Route::get('order-statuses/create', [\App\Http\Controllers\webadmin\OrderStatusController::class, 'create'])->name('admin.order-statuses.create');
        Route::post('order-statuses', [\App\Http\Controllers\webadmin\OrderStatusController::class, 'store'])->name('admin.order-statuses.store');
        Route::get('order-statuses/{id}/edit', [\App\Http\Controllers\webadmin\OrderStatusController::class, 'edit'])->name('admin.order-statuses.edit');
        Route::put('order-statuses/{id}', [\App\Http\Controllers\webadmin\OrderStatusController::class, 'update'])->name('admin.order-statuses.update');
        Route::delete('order-statuses/{id}', [\App\Http\Controllers\webadmin\OrderStatusController::class, 'destroy'])->name('admin.order-statuses.destroy');


        Route::get('/orders/{id}/live-location', [App\Http\Controllers\webadmin\OrderController::class, 'getLiveLocation'])->name('admin.orders.live-location');
    });
});
