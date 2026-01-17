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
    public function storeBanner(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // Validate as File
            'title' => 'nullable|string',
            'sub' => 'nullable|string',
            'target_screen' => 'nullable|string',
            'target_params' => 'nullable|json' // Expecting JSON string from App
        ]);

        $path = null;
        if ($request->hasFile('image')) {
            // Save to 'storage/app/public/banners'
            $path = $request->file('image')->store('banners', 'public');
        }

        $banner = Banner::create([
            // Create full public URL: https://api.amigospizza.co/storage/banners/xyz.jpg
            'image' => asset('storage/' . $path), 
            'title' => $request->title,
            'sub' => $request->sub,
            'target_screen' => $request->target_screen,
            'target_params' => json_decode($request->target_params, true) ?? [],
        ]);
        
        return response()->json($banner);
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