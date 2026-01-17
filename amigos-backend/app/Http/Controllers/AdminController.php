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

    // 5. Get Dashboard Stats
    public function getDashboardStats()
    {
        // Import Carbon at the top: use Carbon\Carbon;
        
        $today = \Carbon\Carbon::today();

        $stats = [
            'total_orders' => Order::count(),
            'total_customers' => User::count(), // You can filter by role later
            'total_drivers' => User::count(),   // Placeholder until role added
            // 'total_products' => Product::count(), // Uncomment when Product model exists
            // 'total_categories' => Category::count(), // Uncomment when Category model exists
            'total_products' => 12,   // Mock for now
            'total_categories' => 4,  // Mock for now
            
            'total_sales' => Order::where('status', 'delivered')->sum('total_amount') ?? 0,
            'today_sales' => Order::whereDate('created_at', $today)
                                  ->where('status', 'delivered')
                                  ->sum('total_amount') ?? 0,
        ];

        return response()->json($stats);
    }
    // 6. Get All Customers
    public function getCustomers()
    {
        // Fetches all users, newest first
        $customers = User::orderBy('created_at', 'desc')->get();
        return response()->json($customers);
    }
}