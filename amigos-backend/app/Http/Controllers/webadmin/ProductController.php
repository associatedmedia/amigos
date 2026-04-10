<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant; // <-- Added the Variant Model
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
            $product->image_url = asset('storage/' . $imagePath); 
        }

        $product->save();
        Cache::forget('app_menu_data');

        return redirect()->route('admin.products.index')->with('success', 'Product created successfully.');
    }

    public function show($id)
    {
        // Eager load variants for the view page
        $product = Product::with('variants')->findOrFail($id);
        return view('webadmin.products.show', compact('product'));
    }

    public function edit($id)
    {
        $product = Product::with('variants')->findOrFail($id);
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

        // Image Handling
        if ($request->filled('image_url')) {
            if ($product->image_url && preg_match('/storage\/(products\/.*)$/', $product->image_url, $matches)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($matches[1]);
            }
            $product->image_url = $request->image_url;
        } elseif ($request->hasFile('image')) {
            $path = Storage::disk('public')->put('products', $request->file('image'));
            $product->image_url = Storage::disk('public')->url($path);
        }

        $product->save();

        // --- HANDLE DYNAMIC VARIANTS ---
        $keptVariantIds = [];

        if ($request->has('variants')) {
            foreach ($request->variants as $variantData) {
                // Ignore empty rows if admin clicked add but didn't type anything
                if (empty($variantData['variant_name']) || empty($variantData['price'])) {
                    continue; 
                }

                if (!empty($variantData['id'])) {
                    // Update existing variant
                    $variant = ProductVariant::find($variantData['id']);
                    if ($variant && $variant->product_id == $product->id) {
                        $variant->update([
                            'variant_name' => strtoupper($variantData['variant_name']),
                            'price' => $variantData['price']
                        ]);
                        $keptVariantIds[] = $variant->id;
                    }
                } else {
                    // Create new variant
                    $newVariant = $product->variants()->create([
                        'variant_name' => strtoupper($variantData['variant_name']),
                        'price' => $variantData['price']
                    ]);
                    $keptVariantIds[] = $newVariant->id;
                }
            }
        }

        // Delete any variants that the admin removed from the UI
        $product->variants()->whereNotIn('id', $keptVariantIds)->delete();

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

    public function data()
    {
        // 🛑 Sub-query groups by name, hiding old database duplicates
        $products = Product::with('variants')
            ->whereIn('id', function($query) {
                $query->selectRaw('MIN(id)')
                      ->from('products')
                      ->groupBy('name');
            })
            ->select('products.*');

        return DataTables::of($products)
            ->addColumn('image_url', function ($product) {
                $url = $product->image_url ? asset($product->image_url) : asset('assets/images/no-image.png');
                return '<img src="'.$url.'" class="rounded" width="50" height="50" style="object-fit: cover;">';
            })
            ->editColumn('price', function ($product) {
                // Display variants as nice badges
                if ($product->variants->count() > 0) {
                    $html = '<div class="d-flex flex-wrap gap-1">';
                    foreach ($product->variants as $variant) {
                        $html .= '<span class="badge bg-light text-dark border" style="font-size: 0.75rem;">' . 
                                 $variant->variant_name . ': ₹' . number_format($variant->price, 0) . 
                                 '</span>';
                    }
                    
                    if($product->takeaway_price > 0) {
                        $html .= '<span class="badge bg-info-subtle text-info border" style="font-size: 0.75rem;">TA: ₹' . 
                                 number_format($product->takeaway_price, 0) . '</span>';
                    }
                    
                    $html .= '</div>';
                    return $html;
                }
                
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
                // Restored the View button here!
                return '
                    <div class="btn-group">
                        <a href="'.route('admin.products.show', $product->id).'" class="btn btn-sm btn-outline-info"><i class="bi bi-eye"></i></a>
                        <a href="'.route('admin.products.edit', $product->id).'" class="btn btn-sm btn-outline-primary"><i class="bi bi-pencil"></i></a>
                        <button onclick="confirmDelete(\''.route('admin.products.destroy', $product->id).'\')" class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>
                    </div>';
            })
            ->rawColumns(['image_url', 'price', 'type', 'is_available', 'action'])
            ->make(true);
    }
}