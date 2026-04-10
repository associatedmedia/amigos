<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;


class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with('variants')->orderBy('name')->get();
        return view('webadmin.products.index', compact('products'));
    }

    public function create()
    {
        $categories = \App\Models\Category::all();
        $printers = \App\Models\PrinterSetup::all();
        return view('webadmin.products.create', compact('categories', 'printers'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'print_assign' => 'nullable|string|max:255',
            'price' => 'required|numeric|min:0',
            'gst' => 'nullable|string|max:255',
            'tax_percentage' => 'nullable|numeric|min:0|max:100',
            'old_db_code' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_veg' => 'boolean',
            'is_available' => 'boolean',
            'is_best_seller' => 'boolean',
            'is_upsell' => 'boolean',
            'image_url' => 'nullable|url',
            'image' => 'nullable|image|max:2048'
        ]);

        $product = new Product();
        $product->name = $request->name;
        $product->category = $request->category;
        $product->print_assign = $request->print_assign;
        $product->price = $request->price;
        $product->gst = $request->gst;
        $product->tax_percentage = $request->tax_percentage ?? 0;
        $product->old_db_code = $request->old_db_code;
        $product->description = $request->description;
        $product->is_veg = $request->has('is_veg');
        $product->is_available = $request->has('is_available');
        $product->is_best_seller = $request->has('is_best_seller');
        $product->is_upsell = $request->has('is_upsell');

        if ($request->filled('image_url')) {
            $product->image_url = $request->image_url;
        } elseif ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
            
            // Forcefully read APP_URL directly from the .env to bypass NGINX reverse-proxy URI stripping
            $baseUrl = rtrim(env('APP_URL', url('/')), '/');
            $product->image_url =  asset('storage/' . $imagePath); //$baseUrl . '/storage/' . $imagePath;
        }

        $product->save();
        Cache::forget('app_menu_data');

        return redirect()->route('admin.products.index')->with('success', 'Product created successfully.');
    }

    public function show($id)
    {
        $product = Product::findOrFail($id);
        return view('webadmin.products.show', compact('product'));
    }

    public function edit($id)
    {
        $product = Product::findOrFail($id);
        $categories = \App\Models\Category::all();
        $printers = \App\Models\PrinterSetup::all();
        return view('webadmin.products.edit', compact('product', 'categories', 'printers'));
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'print_assign' => 'nullable|string|max:255',
            'price' => 'required|numeric|min:0',
            'gst' => 'nullable|string|max:255',
            'tax_percentage' => 'nullable|numeric|min:0|max:100',
            'old_db_code' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_veg' => 'boolean',
            'is_available' => 'boolean',
            'is_best_seller' => 'boolean',
            'is_upsell' => 'boolean',
            'image_url' => 'nullable|url',
            'image' => 'nullable|image|max:2048'
        ]);

        $product->name = $request->name;
        $product->category = $request->category;
        $product->print_assign = $request->print_assign;
        $product->price = $request->price;
        $product->gst = $request->gst;
        $product->tax_percentage = $request->tax_percentage ?? 0;
        $product->old_db_code = $request->old_db_code;
        $product->description = $request->description;
        $product->is_veg = $request->has('is_veg');
        $product->is_available = $request->has('is_available');
        $product->is_best_seller = $request->has('is_best_seller');
        $product->is_upsell = $request->has('is_upsell');

        if ($request->filled('image_url')) {
            if ($product->image_url && preg_match('/storage\/(products\/.*)$/', $product->image_url, $matches)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($matches[1]);
            }
            $product->image_url = $request->image_url;
        } elseif ($request->hasFile('image')) {
            // store using disk
            $path = Storage::disk('public')->put('products', $request->file('image'));
            // generate url
            $product->image_url = Storage::disk('public')->url($path);
        }

        $product->save();
        Cache::forget('app_menu_data');

        return redirect()->route('admin.products.index')->with('success', 'Product updated successfully.');
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        
        if ($product->image_url && preg_match('/storage\/(products\/.*)$/', $product->image_url, $matches)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($matches[1]);
        }
        
        $product->delete();
        Cache::forget('app_menu_data');

        return response()->json(['success' => true]);
    }

    // public function data()
    // {
    //     $query = Product::select('products.*');

    //     return DataTables::of($query)
    //         ->editColumn('image_url', function ($product) {
    //             if ($product->image_url) {
    //                 $url = str_starts_with($product->image_url, 'http') ? $product->image_url : asset($product->image_url);
    //                 return '<img src="' . $url . '" style="height:40px; width:40px; object-fit:cover; border-radius:4px;" />';
    //             }
    //             return '<span class="text-muted">None</span>';
    //         })
    //         ->editColumn('category', function ($product) {
    //             return $product->category ? $product->category : 'Uncategorized';
    //         })
    //         ->editColumn('price', function ($product) {
    //             return '₹' . number_format($product->price, 2);
    //         })
    //         ->editColumn('type', function ($product) {
    //             $color = $product->is_veg ? 'success' : 'danger';
    //             $text = $product->is_veg ? 'VEG' : 'NON-VEG';
    //             $html = '<span class="badge bg-' . $color . '">' . $text . '</span>';
    //             if ($product->is_best_seller) {
    //                 $html .= ' <span class="badge bg-warning text-dark"><i class="bi bi-star-fill"></i> Best Seller</span>';
    //             }
    //             return $html;
    //         })
    //         ->editColumn('is_available', function ($product) {
    //             $color = $product->is_available ? 'primary' : 'secondary';
    //             $text = $product->is_available ? 'Available' : 'Unavailable';
    //             return '<span class="badge bg-' . $color . '">' . $text . '</span>';
    //         })
    //         ->addColumn('action', function ($product) {
    //             $viewUrl = route('admin.products.show', $product->id);
    //             $editUrl = route('admin.products.edit', $product->id);
    //             $deleteUrl = route('admin.products.destroy', $product->id);
                
    //             return '<a href="' . $viewUrl . '" class="btn btn-sm btn-outline-info me-1"><i class="bi bi-eye"></i> View</a>' .
    //                    '<a href="' . $editUrl . '" class="btn btn-sm btn-outline-primary me-1"><i class="bi bi-pencil"></i> Edit</a>' .
    //                    '<button onclick="confirmDelete(\'' . $deleteUrl . '\')" class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i> Delete</button>';
    //         })
    //         ->rawColumns(['image_url', 'type', 'is_available', 'action'])
    //         ->make(true);
    // }

    public function data()
    {
        $products = Product::with('variants')->select('products.*');

        return DataTables::of($products)
            ->addColumn('image_url', function ($product) {
                $url = $product->image_url ? asset($product->image_url) : asset('assets/images/no-image.png');
                return '<img src="'.$url.'" class="rounded" width="50" height="50" style="object-fit: cover;">';
            })
            ->editColumn('price', function ($product) {
                // If the product has variants, list them as badges
                if ($product->variants->count() > 0) {
                    $html = '<div class="d-flex flex-wrap gap-1">';
                    foreach ($product->variants as $variant) {
                        $html .= '<span class="badge bg-light text-dark border" style="font-size: 0.75rem;">' . 
                                $variant->variant_name . ': ₹' . number_format($variant->price, 0) . 
                                '</span>';
                    }
                    
                    // Add Takeaway price if it exists
                    if($product->takeaway_price > 0) {
                        $html .= '<span class="badge bg-info-subtle text-info border" style="font-size: 0.75rem;">TA: ₹' . 
                                number_format($product->takeaway_price, 0) . '</span>';
                    }
                    
                    $html .= '</div>';
                    return $html;
                }
                
                // Fallback for products without variants
                return '<strong>₹' . number_format($product->price, 2) . '</strong>';
            })
            ->addColumn('type', function ($product) {
                return $product->is_veg 
                    ? '<span class="badge bg-success">Veg</span>' 
                    : '<span class="badge bg-danger">Non-Veg</span>';
            })
            ->editColumn('is_available', function ($product) {
                $checked = $product->is_available ? 'checked' : '';
                return '<div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" role="switch" '.$checked.' disabled>
                        </div>';
            })
            ->addColumn('action', function ($product) {
                return '
                    <div class="btn-group">
                        <a href="'.route('admin.products.edit', $product->id).'" class="btn btn-sm btn-outline-primary"><i class="bi bi-pencil"></i></a>
                        <button onclick="confirmDelete(\''.route('admin.products.destroy', $product->id).'\')" class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>
                    </div>';
            })
            ->rawColumns(['image_url', 'price', 'type', 'is_available', 'action'])
            ->make(true);
    }
}
