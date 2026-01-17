<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. SEED USERS (Admin, Drivers, Customers)
        // Note: We are using the 'mobile_no' you defined in your migration
        
        $adminId = DB::table('users')->insertGetId([
            'name' => 'Manager Chef',
            'mobile_no' => '9999999999',
            'address' => 'Amigos HQ, Kitchen 1',
            'latitude' => 26.9124,
            'longitude' => 75.7873,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $driver1 = DB::table('users')->insertGetId([
            'name' => 'Driver Rahul',
            'mobile_no' => '8888888888',
            'address' => 'Station Road, Jaipur',
            'latitude' => 26.9150,
            'longitude' => 75.8000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $driver2 = DB::table('users')->insertGetId([
            'name' => 'Driver Amit',
            'mobile_no' => '8888888889',
            'address' => 'Civil Lines, Jaipur',
            'latitude' => 26.9000,
            'longitude' => 75.7500,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $customer = DB::table('users')->insertGetId([
            'name' => 'Shoaib Customer',
            'mobile_no' => '7777777777',
            'address' => 'Malviya Nagar, Block C',
            'latitude' => 26.8500,
            'longitude' => 75.8100,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. SEED CATEGORIES (If you have a categories table)
        // Uncomment if you have this table created
        /*
        $catPizza = DB::table('categories')->insertGetId(['name' => 'Pizza', 'image' => 'pizza.png']);
        $catSides = DB::table('categories')->insertGetId(['name' => 'Sides', 'image' => 'fries.png']);
        $catDrinks = DB::table('categories')->insertGetId(['name' => 'Drinks', 'image' => 'coke.png']);

        // 3. SEED PRODUCTS (If you have a products table)
        DB::table('products')->insert([
            ['name' => 'Pepperoni Feast', 'price' => 450, 'category_id' => $catPizza, 'description' => 'Spicy pepperoni with mozzarella'],
            ['name' => 'Veggie Paradise', 'price' => 350, 'category_id' => $catPizza, 'description' => 'Onions, capsicum, corn'],
            ['name' => 'Garlic Bread', 'price' => 120, 'category_id' => $catSides, 'description' => 'Cheesy garlic goodness'],
            ['name' => 'Coke Zero', 'price' => 60, 'category_id' => $catDrinks, 'description' => 'No sugar, full taste'],
        ]);
        */

        // 4. SEED ORDERS (For Admin Dashboard testing)
        DB::table('orders')->insert([
            [
                'user_id' => $customer,
                'mobile_no' => '7777777777',
                'address' => 'Malviya Nagar, Block C',
                'latitude' => 26.8500,
                'longitude' => 75.8100,
                'total_amount' => 570.00,
                'status' => 'pending', // Pending order
                'created_at' => Carbon::now()->subMinutes(5),
                'updated_at' => Carbon::now()->subMinutes(5),
            ],
            [
                'user_id' => $customer,
                'mobile_no' => '7777777777',
                'address' => 'GT Mall, Entrance Gate',
                'latitude' => 26.8550,
                'longitude' => 75.8150,
                'total_amount' => 1200.00,
                'status' => 'cooking', // Currently cooking
                'created_at' => Carbon::now()->subMinutes(20),
                'updated_at' => Carbon::now()->subMinutes(10),
            ],
            [
                'user_id' => $customer,
                'mobile_no' => '7777777777',
                'address' => 'Raja Park, Lane 4',
                'latitude' => 26.8800,
                'longitude' => 75.8200,
                'total_amount' => 350.00,
                'status' => 'ready', // Ready for Driver
                'created_at' => Carbon::now()->subMinutes(30),
                'updated_at' => Carbon::now()->subMinutes(5),
            ]
        ]);
        
        echo "✅ Sample data seeded successfully!";
    }
}