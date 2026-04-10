<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MenuController extends Controller
{
    public function index()
    {
        // Cache menu for 5 minutes to reduce DB queries on every app open
        $grouped = Cache::remember('app_menu_data', 300, function () {
            // Get all active categories
            $categories = \App\Models\Category::where('is_active', true)->orderBy('sort_order', 'asc')->get();
            
            // 🛑 THE FIX: Fetch available products, load variants, and hide duplicates!
            $products = Product::with('variants')
                ->where('is_available', true)
                ->whereIn('id', function($query) {
                    $query->selectRaw('MIN(id)')
                          ->from('products')
                          ->groupBy('name');
                })
                ->get()
                ->map(function ($product) {
                    if ($product->image_url) {
                        $product->image_url = str_starts_with($product->image_url, 'http') ? $product->image_url : rtrim(url('/'), '/') . '/' . ltrim($product->image_url, '/');
                    }
                    // Ensure boolean flags are explicitly present for SQLite/MySQL consistency
                    $product->is_upsell = (bool)$product->is_upsell;
                    $product->is_best_seller = (bool)$product->is_best_seller;
                    return $product;
                });

            // Group products by category string
            $groupedProducts = $products->groupBy('category');

            return $categories->map(function ($category) use ($groupedProducts) {
                $imageUrl = $category->image_url;
                if ($imageUrl) {
                    $imageUrl = str_starts_with($imageUrl, 'http') ? $imageUrl : rtrim(url('/'), '/') . '/' . ltrim($imageUrl, '/');
                }

                return [
                    'category_name' => $category->name,
                    'image_url' => $imageUrl,
                    'products' => $groupedProducts->get($category->name, collect())->values()
                ];
            })->values();
        });

        return response()->json([
            'success' => true,
            'data' => $grouped
        ])->header('Cache-Control', 'public, max-age=300');
    }
}