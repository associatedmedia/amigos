<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;

class CategoryController extends Controller
{
    public function index()
    {
        return view('webadmin.categories.index');
    }

    public function create()
    {
        return view('webadmin.categories.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'image_url' => 'nullable|url',
            'image' => 'nullable|image|max:2048'
        ]);

        $category = new Category();
        $category->name = $request->name;
        $category->is_active = $request->has('is_active') ? true : false;

        if ($request->filled('image_url')) {
            $category->image_url = $request->image_url;
        } elseif ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('categories', 'public');
            $category->image_url = asset('storage/' . $imagePath);
        }

        $category->save();

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
        return view('webadmin.categories.edit', compact('category'));
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'image_url' => 'nullable|url',
            'image' => 'nullable|image|max:2048'
        ]);

        $category->name = $request->name;
        $category->is_active = $request->has('is_active') ? true : false;

        if ($request->filled('image_url')) {
            // Delete old image if it exists securely via Storage Regex
            if ($category->image_url && preg_match('/storage\/(categories\/.*)$/', $category->image_url, $matches)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($matches[1]);
            }
            $category->image_url = $request->image_url;
        } elseif ($request->hasFile('image')) {
            // Delete old image if it exists securely via Storage Regex
            if ($category->image_url && preg_match('/storage\/(categories\/.*)$/', $category->image_url, $matches)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($matches[1]);
            }
            
            $imagePath = $request->file('image')->store('categories', 'public');
            $category->image_url = asset('storage/' . $imagePath);
        }

        $category->save();

        return redirect()->route('admin.categories.index')->with('success', 'Category updated successfully.');
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        
        if ($category->image_url && preg_match('/storage\/(categories\/.*)$/', $category->image_url, $matches)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($matches[1]);
        }
        
        $category->delete();

        return response()->json(['success' => true]);
    }

    public function data()
    {
        $query = Category::query();

        return DataTables::of($query)
            ->editColumn('image_url', function ($category) {
                if ($category->image_url) {
                    $url = str_starts_with($category->image_url, 'http') ? $category->image_url : asset($category->image_url);
                    return '<img src="' . $url . '" style="height:40px; border-radius:4px;" />';
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
