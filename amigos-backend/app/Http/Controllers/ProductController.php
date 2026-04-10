<?php

namespace App\Http\Controllers;

use App\Models\Product; // Make sure this Model exists
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        // Return all products. 
        // Optional: You can optimize this later to only send needed columns
        $products = Product::with('variants')->get();
        return response()->json($products);
    }
}