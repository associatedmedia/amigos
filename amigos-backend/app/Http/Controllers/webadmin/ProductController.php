<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;

class ProductController extends Controller
{
    public function index()
    {
        return view('webadmin.products.index');
    }

    public function create()
    {
        return view('webadmin.products.create');
    }

    public function show($id)
    {
        $product = Product::with('category')->findOrFail($id);
        return view('webadmin.products.show', compact('product'));
    }

    public function data()
    {
        $query = Product::with('category')->select('products.*');

        return DataTables::of($query)
            ->editColumn('image_url', function ($product) {
                if ($product->image_url) {
                    return '<img src="' . $product->image_url . '" style="height:40px; width:40px; object-fit:cover; border-radius:4px;" />';
                }
                return '<span class="text-muted">None</span>';
            })
            ->addColumn('category_name', function ($product) {
                return $product->category ? $product->category->name : 'Uncategorized';
            })
            ->editColumn('price', function ($product) {
                return '₹' . number_format($product->price, 2);
            })
            ->editColumn('type', function ($product) {
                $color = $product->type === 'veg' ? 'success' : 'danger';
                return '<span class="badge bg-' . $color . '">' . strtoupper($product->type) . '</span>';
            })
            ->editColumn('is_available', function ($product) {
                $color = $product->is_available ? 'primary' : 'secondary';
                $text = $product->is_available ? 'Available' : 'Unavailable';
                return '<span class="badge bg-' . $color . '">' . $text . '</span>';
            })
            ->addColumn('action', function ($product) {
                $url = route('admin.products.show', $product->id);
                return '<a href="' . $url . '" class="btn btn-sm btn-outline-primary">View</a>';
            })
            ->rawColumns(['image_url', 'type', 'is_available', 'action'])
            ->make(true);
    }
}
