<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $setting = Setting::first();
        if (!$setting) {
            $setting = Setting::create(['is_online' => true]);
        }
        
        return response()->json([
            'success' => true,
            'data' => $setting
        ]);
    }
}
