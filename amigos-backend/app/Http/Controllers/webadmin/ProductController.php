<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with('category')->orderBy('created_at', 'desc')->paginate(15);
        return view('webadmin.products.index', compact('products'));
    }

    public function show($id)
    {
        $product = Product::with('category')->findOrFail($id);
        return view('webadmin.products.show', compact('product'));
    }
}
