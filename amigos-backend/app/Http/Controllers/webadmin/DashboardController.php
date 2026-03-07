<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Category;
use App\Models\User;

class DashboardController extends Controller
{
    public function index()
    {
        $totalOrders = Order::count();
        $totalSales = Order::where('status', '!=', 'cancelled')->sum('total_amount') ?? 0;
        $totalProducts = Product::count();
        $totalCategories = Category::count();
        $totalUsers = User::count();
        
        $recentOrders = Order::with('user')->orderBy('created_at', 'desc')->take(5)->get();

        return view('webadmin.dashboard', compact(
            'totalOrders', 'totalSales', 'totalProducts', 'totalCategories', 'totalUsers', 'recentOrders'
        ));
    }
}
