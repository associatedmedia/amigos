<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index()
    {
        // Get all available products
        $products = Product::where('is_available', true)->get();

        // Group them by category string (e.g., 'Pizza', 'Drinks')
        $grouped = $products->groupBy('category')->map(function ($items, $key) {
            return [
                'category_name' => $key,
                'products' => $items
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $grouped
        ]);
    }
}