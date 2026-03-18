<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all();
        $orderStatuses = \App\Models\OrderStatus::orderBy('step_index')->get();
        
        return response()->json([
            'success' => true,
            'data' => $settings,
            'order_statuses' => $orderStatuses
        ]);
    }

    public function updateSetting(Request $request)
    {
        $request->validate([
            'key' => 'required|string',
            'value' => 'required|string'
        ]);

        $setting = Setting::updateOrCreate(
            ['key' => $request->key],
            ['value' => $request->value]
        );

        return response()->json([
            'success' => true,
            'setting' => $setting
        ]);
    }

    public function getAppSettings()
    {
        // Alias for index or filtered settings if needed
        return $this->index();
    }
}
