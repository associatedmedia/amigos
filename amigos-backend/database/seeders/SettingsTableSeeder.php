<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingsTableSeeder extends Seeder
{
    public function run()
    {
        $criteria = json_encode([
            ['distance' => 1, 'min_value' => 200],
            ['distance' => 2, 'min_value' => 300],
            ['distance' => 3, 'min_value' => 450],
            ['distance' => 4, 'min_value' => 550],
            ['distance' => 5, 'min_value' => 700],
            ['distance' => 6, 'min_value' => 800],
            ['distance' => 7, 'min_value' => 900],
            ['distance' => 8, 'min_value' => 1000],
            ['distance' => 9, 'min_value' => 1200],
            ['distance' => 10, 'min_value' => 1350],
            ['distance' => 'fallback', 'min_value' => 2500]
        ]);

        DB::table('settings')->upsert([
            ['key' => 'cod_enabled', 'value' => '1', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'is_store_online', 'value' => '1', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'minimum_order_criteria', 'value' => $criteria, 'created_at' => now(), 'updated_at' => now()],
        ], ['key'], ['value', 'updated_at']);
    }
}