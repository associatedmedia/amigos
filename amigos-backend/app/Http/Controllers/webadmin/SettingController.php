<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function toggleOnline()
    {
        $setting = Setting::first();
        if (!$setting) {
            $setting = Setting::create(['is_online' => true]);
        }
        
        $setting->is_online = !$setting->is_online;
        $setting->save();
        
        $status = $setting->is_online ? 'online' : 'offline';
        return back()->with('success', "Store is now $status!");
    }
}
