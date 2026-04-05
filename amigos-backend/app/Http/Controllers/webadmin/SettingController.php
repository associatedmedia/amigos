<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->keyBy('key');
        $codEnabled = $settings->get('cod_enabled')->value ?? '1';
        $isStoreOnline = $settings->get('is_store_online')->value ?? '1';
        $minOrderCriteria = json_decode($settings->get('minimum_order_criteria')->value ?? '[]', true);
        $appCacheTimeline = $settings->get('app_cache_timeline_minutes')->value ?? '15';

        // Pad the criteria array to ensure there are always enough fields in the form
        $distances = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'fallback'];
        $criteriaMap = collect($minOrderCriteria)->keyBy('distance');
        $fullCriteria = [];
        foreach ($distances as $dist) {
            $fullCriteria[] = [
                'distance' => $dist,
                'min_value' => $criteriaMap->get((string)$dist)['min_value'] ?? 0
            ];
        }

        return view('webadmin.settings.index', compact('codEnabled', 'isStoreOnline', 'fullCriteria', 'appCacheTimeline'));
    }

    public function update(Request $request)
    {
        $request->validate([
            'cod_enabled' => 'required|in:0,1',
            'is_store_online' => 'required|in:0,1',
            'app_cache_timeline_minutes' => 'required|integer|min:0',
            'criteria' => 'required|array',
            'criteria.*.min_value' => 'required|numeric|min:0',
        ]);

        Setting::updateOrCreate(['key' => 'cod_enabled'], ['value' => $request->cod_enabled]);
        Setting::updateOrCreate(['key' => 'is_store_online'], ['value' => $request->is_store_online]);
        Setting::updateOrCreate(['key' => 'app_cache_timeline_minutes'], ['value' => $request->app_cache_timeline_minutes]);

        $criteriaToSave = [];
        foreach ($request->criteria as $distance => $values) {
            $criteriaToSave[] = [
                'distance' => is_numeric($distance) ? (int)$distance : $distance,
                'min_value' => (int)$values['min_value']
            ];
        }

        Setting::updateOrCreate(
            ['key' => 'minimum_order_criteria'],
            ['value' => json_encode($criteriaToSave)]
        );

        Cache::forget('app_settings');

        return redirect()->route('admin.settings.index')->with('success', 'Settings updated successfully.');
    }

    public function toggleOnline()
    {
        $setting = Setting::where('key', 'is_store_online')->first();
        $newStatus = ($setting && $setting->value == '1') ? '0' : '1';

        Setting::updateOrCreate(
            ['key' => 'is_store_online'],
            ['value' => $newStatus]
        );

        Cache::forget('app_settings');
        
        $status = $newStatus == '1' ? 'online' : 'offline';
        return back()->with('success', "Store is now $status!");
    }
}
