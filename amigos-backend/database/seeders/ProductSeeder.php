<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    use WithoutModelEvents;
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Product::create([
            'name' => 'Margherita Pizza',
            'description' => 'Classic cheese and tomato',
            'price' => 299,
            'category' => 'Pizza',
            'image_url' => 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?w=500',
        ]);

        \App\Models\Product::create([
            'name' => 'Farmhouse Pizza',
            'description' => 'Deluxe veggie pizza with mushrooms',
            'price' => 399,
            'category' => 'Pizza',
            'image_url' => 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500',
        ]);

        \App\Models\Product::create([
            'name' => 'Garlic Bread',
            'description' => 'Buttery bread with herbs',
            'price' => 99,
            'category' => 'Sides',
            'image_url' => 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500',
        ]);
    }


}