<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Category; // Ensure you have this Model
use App\Models\Banner;   // Ensure you have this Model

class ContentController extends Controller
{
    // --- GETTERS ---
    public function getAll()
    {
        return response()->json([
            'products' => Product::orderBy('created_at', 'desc')->get(),
            'categories' => Category::all(),
            'banners' => Banner::all()
        ]);
    }

    // --- PRODUCTS ---
    public function storeProduct(Request $request)
    {
        $data = $request->validate([
            'name' => 'required',
            'price' => 'required|numeric',
            'category' => 'required',
            'description' => 'nullable',
            'image_url' => 'nullable|url'
        ]);

        $product = Product::create($data);
        return response()->json($product);
    }

    public function deleteProduct($id)
    {
        Product::destroy($id);
        return response()->json(['success' => true]);
    }

    // --- BANNERS ---
    public function storeBanner(Request $request)
    {
        $data = $request->validate([
            'image_url' => 'required|url',
            'title' => 'nullable'
        ]);
        
        $banner = Banner::create($data);
        return response()->json($banner);
    }

    public function deleteBanner($id)
    {
        Banner::destroy($id);
        return response()->json(['success' => true]);
    }
    
    // You can add similar logic for Categories...
}