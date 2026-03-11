<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index()
    {
        // Get all active categories
        $categories = \App\Models\Category::where('is_active', true)->get();
        
        // Get all available products
        $products = Product::where('is_available', true)->get();

        // Group products by category string
        $groupedProducts = $products->groupBy('category');

        $grouped = $categories->map(function ($category) use ($groupedProducts) {
            
            // Format Image URL securely
            $imageUrl = $category->image_url;
            if ($imageUrl) {
                // If the URL does not start with http, wrap it in asset
                $imageUrl = str_starts_with($imageUrl, 'http') ? $imageUrl : asset($imageUrl);
            }

            return [
                'category_name' => $category->name,
                'image_url' => $imageUrl,
                'products' => $groupedProducts->get($category->name, collect())->values()
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $grouped
        ]);
    }
}