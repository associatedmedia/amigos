<?php

namespace App\Http\Controllers;

use App\Models\Banner;
use Illuminate\Http\Request;

class BannerController extends Controller
{
    public function index()
    {
        // Return only active banners
        $banners = Banner::where('is_active', true)->get();
        return response()->json($banners);
    }
}