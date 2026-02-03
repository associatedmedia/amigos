<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order; 
use App\Models\User;
use App\Models\Product;
use App\Models\Banner; // ✅ Import the Banner Model

class AdminDashController extends Controller
{
    // 1. GET ALL ACTIVE ORDERS
    public function index()
    {
        $orders = Order::with(['items.product', 'user'])
            ->whereIn('status', ['pending', 'cooking', 'ready_for_pickup'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    // 2. UPDATE ORDER STATUS
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,cooking,ready_for_pickup,delivered,cancelled'
        ]);

        $order = Order::findOrFail($id);
        $order->status = $request->status;
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Order status updated to ' . $request->status
        ]);
    }

    // 3. DASHBOARD STATS
    public function stats() 
    {
        $totalOrders = Order::count();
        $totalCustomers = User::where('role', 'customer')->count();
        $totalProducts = Product::count();
        
        $totalSales = Order::where('status', '!=', 'cancelled')->sum('total_amount');
        
        $todaySales = Order::whereDate('created_at', \Carbon\Carbon::today())
            ->where('status', '!=', 'cancelled')
            ->sum('total_amount');

        return response()->json([
            'total_orders' => $totalOrders,
            'total_customers' => $totalCustomers,
            'total_products' => $totalProducts,
            'total_sales' => $totalSales,
            'today_sales' => $todaySales,
            'total_drivers' => User::where('role', 'driver')->count(),
        ]);
    }

    // 4. TOGGLE PRODUCT STATUS
    public function toggleProduct($id)
    {
        $product = Product::find($id);
        if (!$product) return response()->json(['error' => 'Not found'], 404);

        $product->status = $product->status ? 0 : 1; 
        $product->save();

        return response()->json([
            'success' => true, 
            'new_status' => $product->status
        ]);
    }

    // ==========================================
    //           BANNER MANAGEMENT
    // ==========================================

    // 5. GET BANNERS
    public function getBanners()
    {
        // Return all banners, newest first
        return Banner::orderBy('created_at', 'desc')->get();
    }

    // 6. UPLOAD BANNER
    public function uploadBanner(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // Max 5MB
        ]);

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            
            // Generate unique name
            $imageName = time() . '_' . uniqid() . '.' . $image->extension();  
            
            // Save to 'public/banners' folder
            $image->move(public_path('banners'), $imageName);
            
            // Create Database Record
            $banner = new Banner();
            // Save the FULL URL so the App can load it easily
            $banner->image = url('banners/' . $imageName); 
            $banner->title = 'App Banner'; // Default title
            $banner->is_active = 1;
            $banner->save();

            return response()->json(['success' => true, 'banner' => $banner]);
        }

        return response()->json(['error' => 'No image uploaded'], 400);
    }

    // 7. DELETE BANNER
    public function deleteBanner($id)
    {
        $banner = Banner::find($id);
        if($banner) {
            // Optional: Delete the actual file from the folder to save space
            try {
                $filename = basename($banner->image);
                $path = public_path('banners/' . $filename);
                if(file_exists($path)) {
                    unlink($path);
                }
            } catch (\Exception $e) {
                // Ignore file delete errors, just delete DB record
            }

            $banner->delete();
            return response()->json(['success' => true]);
        }
        return response()->json(['error' => 'Banner not found'], 404);
    }
}