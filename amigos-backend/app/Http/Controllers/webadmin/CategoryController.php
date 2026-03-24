<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    public function index()
    {
        return view('webadmin.categories.index');
    }

    public function create()
    {
        $printers = \App\Models\PrinterSetup::all();
        return view('webadmin.categories.create', compact('printers'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'image_url' => 'nullable|url',
            'image' => 'nullable|image|max:2048',
            'print_assign' => 'nullable|string'
        ]);

        $category = new Category();
        $category->name = $request->name;
        $category->is_active = $request->has('is_active') ? true : false;
        $category->print_assign = $request->print_assign;

        if ($request->filled('image_url')) {
            $category->image_url = $request->image_url;
        } elseif ($request->hasFile('image')) {
            // Store the relative path, the model accessor will create the full URL
            $path = $request->file('image')->store('categories', 'public');
            $category->image_url = 'storage/' . $path;
        }

        $category->save();
        Cache::forget('app_menu_data');

        return redirect()->route('admin.categories.index')->with('success', 'Category created successfully.');
    }

    public function show($id)
    {
        $category = Category::findOrFail($id);
        return view('webadmin.categories.show', compact('category'));
    }

    public function edit($id)
    {
        $category = Category::findOrFail($id);
        $printers = \App\Models\PrinterSetup::all();
        return view('webadmin.categories.edit', compact('category', 'printers'));
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'image_url' => 'nullable|url',
            'image' => 'nullable|image|max:2048',
            'print_assign' => 'nullable|string'
        ]);

        $category->name = $request->name;
        $category->is_active = $request->has('is_active') ? true : false;
        $category->print_assign = $request->print_assign;

        if ($request->filled('image_url')) {
            // Delete old image if it was a stored file
            if ($category->image_url && !str_starts_with($category->image_url, 'http')) {
                Storage::disk('public')->delete(str_replace('storage/', '', $category->image_url));
            }
            $category->image_url = $request->image_url;
        } elseif ($request->hasFile('image')) {
            // Delete old image if it was a stored file
            if ($category->image_url && !str_starts_with($category->image_url, 'http')) {
                Storage::disk('public')->delete(str_replace('storage/', '', $category->image_url));
            }
            $path = $request->file('image')->store('categories', 'public');
            $category->image_url = 'storage/' . $path;
        }

        $category->save();
        Cache::forget('app_menu_data');

        return redirect()->route('admin.categories.index')->with('success', 'Category updated successfully.');
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        
        if ($category->image_url && !str_starts_with($category->image_url, 'http')) {
            Storage::disk('public')->delete(str_replace('storage/', '', $category->image_url));
        }
        
        $category->delete();
        Cache::forget('app_menu_data');

        return response()->json(['success' => true]);
    }

    public function data()
    {
        $query = Category::query();

        return DataTables::of($query)
            ->editColumn('image_url', function ($category) {
                if ($category->image_url) { // The accessor in the model handles the full URL
                    return '<img src="' . $category->image_url . '" style="height:40px; border-radius:4px;" />';
                }
                return '<span class="text-muted">No Image</span>';
            })
            ->editColumn('is_active', function ($category) {
                return $category->is_active 
                    ? '<span class="badge bg-success">Active</span>' 
                    : '<span class="badge bg-danger">Disabled</span>';
            })
            ->addColumn('action', function ($category) {
                $viewUrl = route('admin.categories.show', $category->id);
                $editUrl = route('admin.categories.edit', $category->id);
                $deleteUrl = route('admin.categories.destroy', $category->id);
                
                return '<a href="' . $viewUrl . '" class="btn btn-sm btn-outline-info me-1"><i class="bi bi-eye"></i> View</a>' .
                       '<a href="' . $editUrl . '" class="btn btn-sm btn-outline-primary me-1"><i class="bi bi-pencil"></i> Edit</a>' .
                       '<button onclick="confirmDelete(\'' . $deleteUrl . '\')" class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i> Delete</button>';
            })
            ->rawColumns(['image_url', 'is_active', 'action'])
            ->make(true);
    }
}
