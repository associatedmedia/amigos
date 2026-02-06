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

    public function show($id)
    {
        // Find order by ID
        $order = \App\Models\Order::find($id);

        // If not found, return error
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found'], 404);
        }

        return response()->json([
            'success' => true,
            'order' => $order
        ]);
    }

    // Update Order Status (Called after successful payment)
    public function updatePaymentStatus(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'payment_id' => 'required|string',
            'status' => 'required|string' // e.g. 'paid'
        ]);

        $order = Order::find($request->order_id);

        if ($order) {
            $order->payment_id = $request->payment_id;
            $order->payment_status = 'paid';
            
            // Optional: If you want to move the main status to 'confirmed' or keep it 'pending'
            // $order->status = 'pending'; 
            
            $order->save();

            return response()->json([
                'success' => true, 
                'message' => 'Payment updated successfully'
            ]);
        }

        return response()->json(['success' => false, 'message' => 'Order not found'], 404);
    }

    // Add this method inside the class
   public function userHistory(Request $request) 
   {
    // 1. Get User ID
    $userId = $request->query('user_id'); 

    if (!$userId) {
        return response()->json([]);
    }

    // 2. Fetch last 10 orders with their items
    $orders = \App\Models\Order::with('items') // <--- Eager load the relationship
                ->where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get();

    // 3. Extract unique items
    $allItems = [];

    foreach ($orders as $order) {
        foreach ($order->items as $item) {
            
            // We use 'product_id' (or name) as the key to prevent duplicates.
            // If I ordered "Burger" yesterday and today, I only want to see it once.
            
            $key = $item->product_id ?? $item->name; 

            // Only add if we haven't added this product yet
            if (!isset($allItems[$key])) {
                $allItems[$key] = [
                    'id'        => $item->product_id ?? $item->id, // Prefer Product ID for reordering
                    'name'      => $item->name,
                    'price'     => $item->price,
                    'image_url' => $item->image_url ?? null, // Ensure your OrderItem table stores this, or fetch from Product model
                    'is_veg'    => $item->is_veg ?? false,
                ];
            }
        }
    }

    // 4. Return as a clean list (re-indexed)
    // We slice(0, 10) to limit the horizontal list size
    return response()->json(array_slice(array_values($allItems), 0, 10));
}

}