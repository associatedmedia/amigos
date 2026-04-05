<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SettingsController extends Controller
{
    public function getAppSettings()
    {
        $settings = Cache::remember('app_settings', 300, function () {
            $settingsFromDb = Setting::all()->keyBy('key');

            $storeOnline = $settingsFromDb->get('is_store_online');
            $codEnabled = $settingsFromDb->get('cod_enabled');
            $minOrderCriteria = $settingsFromDb->get('minimum_order_criteria');
            $appCacheTimeline = $settingsFromDb->get('app_cache_timeline_minutes');

            return [
                'is_store_online' => $storeOnline ? (bool)$storeOnline->value : true,
                'cod_enabled' => $codEnabled ? (bool)$codEnabled->value : true,
                'minimum_order_criteria' => $minOrderCriteria ? json_decode($minOrderCriteria->value, true) : [],
                'app_cache_timeline_minutes' => $appCacheTimeline ? (int)$appCacheTimeline->value : 15,
            ];
        });

        return response()->json(['success' => true, 'data' => $settings]);
    }
}