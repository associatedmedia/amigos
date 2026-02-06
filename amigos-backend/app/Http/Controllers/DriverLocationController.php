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
        // Find the driver assigned to this order
        $order = Order::select('id', 'driver_id', 'status')->find($orderId);

        if (!$order || !$order->driver_id) {
            return response()->json(['success' => false, 'message' => 'No driver assigned']);
        }

        // Get Live Location from Redis
        $position = Redis::geopos('drivers_live', $order->driver_id);

        if (empty($position)) {
            return response()->json(['success' => false, 'message' => 'Waiting for driver GPS...']);
        }

        // Redis returns [[lng, lat]]
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
    }
}