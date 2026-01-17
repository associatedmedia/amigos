<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\User;

class AdminController extends Controller
{
    // 1. Get All Orders (Newest First)
    public function getOrders()
    {
        // 'with' joins the users table so we get customer name
        $orders = Order::with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    // 2. Get Available Drivers
    public function getDrivers()
    {
        // Currently fetching all users. 
        // Later, if you add a 'role' column, change this to: User::where('role', 'driver')->get();
        $drivers = User::all(); 
        return response()->json($drivers);
    }

    // 3. Update Order Status (Cooking, Ready, etc.)
    public function updateStatus(Request $request)
    {
        $order = Order::find($request->order_id);

        if ($order) {
            $order->status = $request->status;
            $order->save();
            return response()->json(['success' => true, 'message' => 'Status updated successfully']);
        }

        return response()->json(['success' => false, 'message' => 'Order not found'], 404);
    }

    // 4. Assign Driver
    public function assignDriver(Request $request)
    {
        $order = Order::find($request->order_id);

        if ($order) {
            $order->status = 'out_for_delivery';
            
            // IMPORTANT: We will enable this line after adding the 'driver_id' column to your database
             $order->driver_id = $request->driver_id; 
            
            $order->save();
            return response()->json(['success' => true, 'message' => 'Driver assigned successfully']);
        }

        return response()->json(['success' => false, 'message' => 'Order not found'], 404);
    }
}