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
            'total_amount' => 'required|numeric',
            'first_order_discount' => 'nullable|numeric|min:0',
            'is_first_order_discount' => 'nullable|boolean',
            'coupon_code' => 'nullable|string',
            'coupon_discount' => 'nullable|numeric|min:0'
        ]);

        

        try {
            // 2. Start Transaction
            return DB::transaction(function () use ($request) {

                // Validate Coupon strictly again
                if ($request->filled('coupon_code')) {
                    $coupon = \App\Models\Coupon::where('code', $request->coupon_code)->first();
                    if (!$coupon || !$coupon->is_active) {
                        throw new \Exception('Invalid or inactive coupon code.');
                    }
                    if ($request->total_amount + ($request->coupon_discount ?? 0) < $coupon->min_cart_amount) {
                         throw new \Exception('Cart total does not meet the minimum required for this coupon.');
                    }
                    // Limit checks could also go here for absolute precision
                }

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
                    'platform' => $request->platform,
                    'comment' => $request->comment,
                    'status' => 'pending',
                    'first_order_discount' => $request->first_order_discount ?? 0,
                    'is_first_order_discount' => $request->is_first_order_discount ?? false,
                    'coupon_code' => $request->coupon_code,
                    'coupon_discount' => $request->coupon_discount ?? 0
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
                
                // Print jobs will be queued when the admin accepts the order, not here.


                // Send Push Notification
                $user = Auth::user();
                if ($user && $user->fcm_token) {
                    app(\App\Services\ExpoPushService::class)->send(
                        "Order Placed successfully! 🍕",
                        "Your order #{$order->order_number} has been placed.",
                        [$user->fcm_token],
                        ['order_id' => $order->id]
                    );
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
    $userId = $request->query('user_id'); // Ensure your route passes this, or use auth()->id()

    if (!$userId) {
        return response()->json([]);
    }

    // 2. Fetch last 10 orders with items AND their related Product details
    // ✅ FIX: Use dot notation 'items.product' to load the Product table data
    $orders = \App\Models\Order::with('items.product') 
                ->where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get();

    // 3. Extract unique products
    $uniqueProducts = [];

    foreach ($orders as $order) {
        foreach ($order->items as $item) {
            
            // ✅ FIX: Access the related product model
            $product = $item->product;

            // Safety check: If product was deleted from admin, skip it
            if (!$product) continue;

            // Use Product ID as key to prevent duplicates
            $productId = $product->id;

            // Only add if not already in our list
            if (!isset($uniqueProducts[$productId])) {
                $uniqueProducts[$productId] = [
                    'id'          => $product->id,
                    'name'        => $product->name,       // ✅ Get Name from Product table
                    'price'       => $product->price,      // Get current price (or $item->price for paid price)
                    'image'       => $product->image,      // ✅ Get Image from Product table
                    'description' => $product->description,
                    'is_veg'      => $product->is_veg,
                    'category_name' => $product->category->name ?? '', // Optional: if you need category
                ];
            }
        }
    }

    // 4. Return clean array (reset keys)
    // Limit to top 10 unique items to show horizontally
    return response()->json(array_values(array_slice($uniqueProducts, 0, 10)));
}

}