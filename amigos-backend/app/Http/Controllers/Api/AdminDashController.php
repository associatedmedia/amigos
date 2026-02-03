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
   // 2. UPDATE ORDER STATUS (Updated with Driver Logic)
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            // Add 'out_for_delivery' to the allowed list
            'status' => 'required|in:pending,cooking,ready_for_pickup,out_for_delivery,delivered,cancelled',
            'driver_id' => 'nullable|exists:users,id' // Check if driver exists
        ]);

        $order = Order::findOrFail($id);
        $order->status = $request->status;

        // If a driver is selected, assign them
        if ($request->has('driver_id') && $request->driver_id != null) {
            $order->driver_id = $request->driver_id;
        }

        $order->save();

        // TODO: Notification logic
        // If status == 'out_for_delivery', notify Customer ("Driver X is coming") AND Driver ("New Order Assigned")

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

     public function getCustomers()
    {
        // Fetches all users, newest first
        $customers = User::orderBy('created_at', 'desc')->get();
        return response()->json($customers);
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

    // ==========================================
    //           DRIVER MANAGEMENT
    // ==========================================

    // 8. GET ALL DRIVERS
    public function getDrivers()
    {
        return User::where('role', 'driver')
                   ->orderBy('name', 'asc')
                   ->get(['id', 'name', 'mobile_no', 'is_active']); // Select specific fields
    }

    // 9. ADD NEW DRIVER
    public function addDriver(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'mobile_no' => 'required|numeric|unique:users,mobile_no',
            'password' => 'required|min:4' // Simple PIN/Password
        ]);

        $driver = new User();
        $driver->name = $request->name;
        $driver->mobile_no = $request->mobile_no;
        $driver->password = bcrypt($request->password);
        $driver->role = 'driver'; // ✅ Critical: Mark as driver
        $driver->save();

        return response()->json(['success' => true, 'driver' => $driver]);
    }

    // 10. DELETE DRIVER
    public function deleteDriver($id)
    {
        $driver = User::where('id', $id)->where('role', 'driver')->first();
        
        if (!$driver) {
            return response()->json(['error' => 'Driver not found'], 404);
        }

        $driver->delete();
        return response()->json(['success' => true]);
    }
}