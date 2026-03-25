<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\DriverLocation;

class DriverApiController extends Controller
{
    // 1. Get orders currently assigned to this driver
    public function getMyOrders(Request $request)
    {
        $driverId = $request->user()->id;

        $orders = Order::with(['items.product', 'user'])
            ->where('driver_id', $driverId)
            ->whereIn('status', ['assigned', 'picked_up'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'orders' => $orders]);
    }

    // 2. Update the status of an order (Picked Up / Delivered)
    public function updateOrderStatus(Request $request, $orderId)
    {
        $request->validate(['status' => 'required|in:picked_up,delivered']);
        
        $order = Order::where('id', $orderId)->where('driver_id', $request->user()->id)->firstOrFail();
        $order->status = $request->status;
        $order->save();

        return response()->json(['success' => true, 'message' => 'Status updated to ' . $order->status]);
    }

    public function updateLocation(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'is_online' => 'required|boolean'
        ]);

        $driver = $request->user();
        try {
            $request->validate([
                'latitude' => 'required|numeric',
                'longitude' => 'required|numeric',
                'is_online' => 'required|boolean'
            ]);

            $driver = $request->user();

            // Ensure only drivers can update locations
            if ($driver->role !== 'driver') {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            // 1. Permanent DB Update (MySQL)
            try {
                \App\Models\DriverLocation::updateOrCreate(
                    ['driver_id' => $driver->id],
                    [
                        'latitude' => $request->latitude,
                        'longitude' => $request->longitude,
                        'is_online' => $request->is_online,
                        'updated_at' => now()
                    ]
                );
            } catch (\Exception $dbEx) {
                // Return descriptive DB error for debugging (Migration related usually)
                return response()->json([
                    'success' => false, 
                    'message' => 'DB Error: ' . $dbEx->getMessage()
                ], 500);
            }

            // 2. Update Redis for live tracking if online
            try {
                if ($request->is_online) {
                    \Illuminate\Support\Facades\Redis::geoadd('drivers_live', $request->longitude, $request->latitude, $driver->id);
                    \Illuminate\Support\Facades\Redis::setex("driver:{$driver->id}:details", 3600, json_encode([
                        'lat' => $request->latitude, 
                        'lng' => $request->longitude, 
                        'updated_at' => now()
                    ]));
                }
            } catch (\Exception $e) {
                // Log but ignore Redis connectivity issues securely on local environments
            }

            return response()->json(['success' => true]);
        } catch (\Exception $globalEx) {
            return response()->json([
                'success' => false, 
                'message' => 'Global Error: ' . $globalEx->getMessage()
            ], 500);
        }
    }

    public function getAnalytics(Request $request)
    {
        $driverId = $request->user()->id;

        // Count today's deliveries
        $totalDeliveries = Order::where('driver_id', $driverId)
            ->where('status', 'delivered')
            ->whereDate('updated_at', \Carbon\Carbon::today())
            ->count();

        // Calculate today's cash to collect
        $cashToCollect = Order::where('driver_id', $driverId)
            ->where('status', 'delivered')
            ->where('payment_method', 'cash')
            ->whereDate('updated_at', \Carbon\Carbon::today())
            ->sum('total_amount');

        return response()->json([
            'success' => true, 
            'total_deliveries' => $totalDeliveries,
            'cash_to_collect' => (float) $cashToCollect
        ]);
    }

    public function getOrderHistory(Request $request)
    {
        $driverId = $request->user()->id;

        $orders = Order::with(['items.product', 'user'])
            ->where('driver_id', $driverId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'orders' => $orders]);
    }

    public function declineOrder(Request $request, $orderId)
    {
        $order = Order::where('id', $orderId)->where('driver_id', $request->user()->id)->firstOrFail();
        
        $order->driver_id = null;
        $order->status = 'processing';
        $order->save();

        return response()->json(['success' => true, 'message' => 'Order declined successfully.']);
    }
}