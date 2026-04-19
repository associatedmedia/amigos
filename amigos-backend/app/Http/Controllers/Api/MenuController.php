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
        // 🛑 NEW CACHE KEY: Bypasses the old data
        $grouped = Cache::remember('app_menu_data_v2', 300, function () {
            
            $categories = \App\Models\Category::where('is_active', true)->orderBy('sort_order', 'asc')->get();
            
            $products = Product::with('variants')
                ->where('is_available', true)
                ->get()
                ->map(function ($product) {
                    
                    // Force the Laravel Model to become a standard array
                    $data = $product->toArray();
                    
                    // Fix Image URL
                    if (!empty($data['image_url'])) {
                        $data['image_url'] = str_starts_with($data['image_url'], 'http') 
                            ? $data['image_url'] 
                            : rtrim(url('/'), '/') . '/' . ltrim($data['image_url'], '/');
                    }
                    
                    // Explicitly cast booleans for React Native
                    $data['is_upsell'] = (bool)($data['is_upsell'] ?? false);
                    $data['is_best_seller'] = (bool)($data['is_best_seller'] ?? false);
                    
                    // 🛑 THE ULTIMATE FIX: Forcefully inject the variants as an array
                    $data['variants'] = $product->variants ? $product->variants->toArray() : [];
                    
                    return $data;
                });

            // Group products by category string
            $groupedProducts = collect($products)->groupBy('category');

            return $categories->map(function ($category) use ($groupedProducts) {
                $imageUrl = $category->image_url;
                if ($imageUrl) {
                    $imageUrl = str_starts_with($imageUrl, 'http') ? $imageUrl : rtrim(url('/'), '/') . '/' . ltrim($imageUrl, '/');
                }

                return [
                    'category_name' => $category->name,
                    'image_url' => $imageUrl,
                    'is_upsell_enabled' => (bool)$category->is_upsell_enabled,
                    'upsell_product_ids' => $category->upsell_product_ids ?? [],
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