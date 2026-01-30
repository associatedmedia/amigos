<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order; // Make sure you have an Order model

class AdminController extends Controller
{
    // 1. GET ALL ACTIVE ORDERS (Kitchen View)
    public function index()
    {
        // Fetch orders that are NOT delivered yet
        // Eager load 'items' and 'user' so we know what to cook and who ordered it
        $orders = Order::with(['items.product', 'user'])
            ->whereIn('status', ['pending', 'cooking', 'ready_for_pickup'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    // 2. UPDATE ORDER STATUS (e.g., Pending -> Cooking)
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,cooking,ready_for_pickup,delivered,cancelled'
        ]);

        $order = Order::findOrFail($id);
        $order->status = $request->status;
        $order->save();

        // TODO: Send Push Notification to Customer here ("Your food is cooking!")

        return response()->json([
            'success' => true,
            'message' => 'Order status updated to ' . $request->status
        ]);
    }

    public function stats() 
    {
        // 1. Get Counts
        $totalOrders = Order::count();
        $totalCustomers = User::where('role', 'customer')->count();
        $totalProducts = \App\Models\Product::count();
        
        // 2. Calculate Revenue
        $totalSales = Order::where('status', '!=', 'cancelled')->sum('total_amount');
        
        // 3. Today's Specifics
        $todaySales = Order::whereDate('created_at', \Carbon\Carbon::today())
            ->where('status', '!=', 'cancelled')
            ->sum('total_amount');

        return response()->json([
            'total_orders' => $totalOrders,
            'total_customers' => $totalCustomers,
            'total_products' => $totalProducts,
            'total_sales' => $totalSales,
            'today_sales' => $todaySales,
            'total_drivers' => 0, // Placeholder until we build driver app
        ]);
    }
}