<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class OrderStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = [
            ['status_code' => 'pending', 'label' => 'Pending', 'step_index' => 0],
            ['status_code' => 'accepted', 'label' => 'Accepted', 'step_index' => 1],
            ['status_code' => 'assigned', 'label' => 'Driver Assigned', 'step_index' => 1],
            ['status_code' => 'cooking', 'label' => 'Cooking', 'step_index' => 1],
            ['status_code' => 'ready_for_pickup', 'label' => 'Ready for Pickup', 'step_index' => 2],
            ['status_code' => 'picked_up', 'label' => 'Picked Up', 'step_index' => 2],
            ['status_code' => 'out_for_delivery', 'label' => 'Out for Delivery', 'step_index' => 3],
            ['status_code' => 'delivered', 'label' => 'Delivered', 'step_index' => 4],
            ['status_code' => 'cancelled', 'label' => 'Cancelled', 'step_index' => -1],
            ['status_code' => 'refunded', 'label' => 'Refunded', 'step_index' => -1],
        ];

        foreach ($statuses as $status) {
            \App\Models\OrderStatus::updateOrCreate(
                ['status_code' => $status['status_code']],
                $status
            );
        }
    }
}
