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
        // ✅ 1. Load Order WITH Driver Details
        // We select specific fields to keep it fast
        $order = \App\Models\Order::with(['driver' => function($query) {
            $query->select('id', 'name', 'mobile_no', 'role'); // Fetch name & phone
        }])
        ->select('id', 'driver_id', 'status')
        ->find($orderId);

        // Safety Checks
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found']);
        }
        if (!$order->driver_id || !$order->driver) {
            return response()->json(['success' => false, 'message' => 'No driver assigned yet']);
        }

        try {
            // 2. Get Live Location from Redis
            $position = Redis::geopos('drivers_live', $order->driver_id);

            // Default to null if no GPS yet
            $driverLoc = null;
            if (!empty($position) && isset($position[0])) {
                $driverLoc = [
                    'latitude' => (float)$position[0][1],
                    'longitude' => (float)$position[0][0]
                ];
            }

            return response()->json([
                'success' => true,
                'status' => $order->status,
                'driver_location' => $driverLoc,
                
                // ✅ SEND DRIVER DETAILS
                'driver' => [
                    'name' => $order->driver->name,
                    'mobile_no' => $order->driver->mobile_no,
                    'role' => 'Delivery Partner', // You can customize this
                    // 'image' => $order->driver->image_url // Uncomment if you have images
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error("Tracking Error: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Server Error'], 500);
        }
    }
    
}