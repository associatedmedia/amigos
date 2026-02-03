<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RazorpayWebController;


Route::get('/', function () {
    return view('welcome');
});

