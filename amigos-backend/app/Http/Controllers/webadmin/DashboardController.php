<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Category;
use App\Models\User;

use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $totalOrders = Order::count();
        $totalSales = Order::where('status', '!=', 'cancelled')->sum('total_amount') ?? 0;
        
        $todaySales = Order::where('status', '!=', 'cancelled')
                           ->whereDate('created_at', Carbon::today())
                           ->sum('total_amount') ?? 0;
                           
        $weeklySales = Order::where('status', '!=', 'cancelled')
                            ->where('created_at', '>=', Carbon::now()->startOfWeek())
                            ->sum('total_amount') ?? 0;

        $todayOrders = Order::whereDate('created_at', Carbon::today())->count();
        $weeklyOrders = Order::where('created_at', '>=', Carbon::now()->startOfWeek())->count();

        $totalProducts = Product::count();
        $totalCategories = Category::count();
        $totalUsers = User::count();
        
        $recentOrders = Order::with('user')->orderBy('created_at', 'desc')->take(5)->get();

        return view('webadmin.dashboard', compact(
            'totalOrders', 'todayOrders', 'weeklyOrders', 'totalSales', 'todaySales', 'weeklySales', 'totalProducts', 'totalCategories', 'totalUsers', 'recentOrders'
        ));
    }
}
