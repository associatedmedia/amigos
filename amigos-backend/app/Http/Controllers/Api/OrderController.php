<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validation
        $request->validate([
            'mobile_no' => 'required|string',
            'address' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
            'total_amount' => 'required|numeric'
        ]);

        

        try {
            // 2. Start Transaction
            return DB::transaction(function () use ($request) {

                // 3. Create the Main Order
                $order = Order::create([
                    'user_id' => Auth::id(), // Automatically get user from Sanctum token
                    'mobile_no' => $request->mobile_no,
                    'address' => $request->address,
                    'customer_name' => $request->customer_name,
                    'order_number' => Order::generateOrderNumber(),
                    'store_id' => $request->store_id,
                    'payment_method' => $request->payment_method,
                    'timestamp' => time(),
                    'total_amount' => $request->total_amount,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'status' => 'pending' 
                ]);

                // 4. Save Each Item in the Order
                foreach ($request->items as $item) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $item['id'],
                        'quantity' => $item['quantity'],
                        'price' => $item['price'], // Saving price at time of purchase
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Order placed successfully!',
                    'order_id' => $order->id,
                    'order_number' => $order->order_number
                ], 201);
            });

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to place order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Order History for the logged-in user
     */
    public function index()
    {
        $orders = Order::with('items.product')
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }


}