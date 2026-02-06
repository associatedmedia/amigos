<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use App\Models\Order;

class DriverLocationController extends Controller
{
    // ✅ 1. DRIVER APP CALLS THIS (Every 5 seconds)
    public function update(Request $request)
    {
        $driverId = $request->driver_id;
        $lat = $request->lat;
        $lng = $request->lng;

        if (!$driverId || !$lat || !$lng) {
             return response()->json(['success' => false], 400);
        }

        // Save to Redis Geo-Spatial Index
        // Key: 'drivers_live', Lng, Lat, MemberID
        Redis::geoadd('drivers_live', $lng, $lat, $driverId);

        // Save extra details (Optional, enables fetching timestamp)
        Redis::setex("driver:{$driverId}:details", 3600, json_encode([
            'lat' => $lat, 
            'lng' => $lng, 
            'updated_at' => now()
        ]));

        return response()->json(['success' => true]);
    }

    // ✅ 2. CUSTOMER APP CALLS THIS (To Track Order)
    public function show($orderId)
    {
        // 1. Find the driver assigned to this order
        $order = \App\Models\Order::select('id', 'driver_id', 'status')->find($orderId);

        // Check if order exists and has a driver
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found']);
        }
        if (!$order->driver_id) {
            return response()->json(['success' => false, 'message' => 'No driver assigned yet']);
        }

        try {
            // 2. Get Live Location from Redis
            $position = Redis::geopos('drivers_live', $order->driver_id);

            // 🛑 CRASH FIX: Check if Redis returned [null]
            // If the driver hasn't sent location yet, $position[0] will be null.
            if (empty($position) || !isset($position[0])) {
                return response()->json([
                    'success' => true,
                    'status' => $order->status,
                    'message' => 'Driver location waiting...',
                    'driver_location' => null // Return null safely instead of crashing
                ]);
            }

            // 3. Extract Coordinates (Only if we passed the check above)
            $lng = $position[0][0];
            $lat = $position[0][1];

            return response()->json([
                'success' => true,
                'driver_location' => [
                    'latitude' => (float)$lat,
                    'longitude' => (float)$lng
                ],
                'status' => $order->status
            ]);

        } catch (\Exception $e) {
            \Log::error("Tracking Error: " . $e->getMessage());
            // Return a safe response even if Redis fails completely
            return response()->json(['success' => false, 'message' => 'Server Error'], 500);
        }
    }
}