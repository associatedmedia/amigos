<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RazorpayWebController;


Route::get('/', function () {
    return view('welcome');
});



// 1. The page your App opens
Route::get('/payment-page', [RazorpayWebController::class, 'showPaymentPage']);

// 2. The URL Razorpay sends the user to after payment
Route::post('/payment-callback', [RazorpayWebController::class, 'handleCallback'])->name('razorpay.callback');