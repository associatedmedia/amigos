<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;

class BannerController extends Controller
{
    public function index()
    {
        return view('webadmin.banners.index');
    }

    public function create()
    {
        return view('webadmin.banners.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'target_screen' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'image_url' => 'nullable|url',
        ]);

        $banner = new Banner();
        $banner->title = $request->input('title');
        $banner->subtitle = $request->input('subtitle');
        $banner->target_screen = $request->input('target_screen');
        $banner->is_active = $request->has('is_active');
        
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('banners', 'public');
            
            // Forcefully read APP_URL directly from the .env to bypass NGINX reverse-proxy URI stripping
            $baseUrl = rtrim(env('APP_URL', url('/')), '/');
            $banner->image_url = $baseUrl . '/storage/' . $path;
        } elseif ($request->filled('image_url')) {
            $banner->image_url = $request->input('image_url');
        } else {
            return back()->withErrors(['image' => 'Please provide an image file or an image URL'])->withInput();
        }

        $banner->save();

        return redirect()->route('admin.banners.index')->with('success', 'Banner created successfully.');
    }

    public function data()
    {
        $query = Banner::query();

        return DataTables::of($query)
            ->editColumn('image_url', function ($banner) {
                if ($banner->image_url) {
                    return '<img src="' . $banner->image_url . '" style="height:40px; border-radius:4px; max-width: 150px; object-fit: cover;" />';
                }
                return '<span class="text-muted">No Image</span>';
            })
            ->editColumn('is_active', function ($banner) {
                $color = $banner->is_active ? 'success' : 'secondary';
                $text = $banner->is_active ? 'Active' : 'Inactive';
                return '<span class="badge bg-' . $color . '">' . $text . '</span>';
            })
            ->addColumn('action', function ($banner) {
                $viewUrl = route('admin.banners.show', $banner->id);
                $editUrl = route('admin.banners.edit', $banner->id);
                $deleteUrl = route('admin.banners.destroy', $banner->id);
                
                return '
                    <div class="d-flex gap-1 justify-content-center">
                        <a href="' . $viewUrl . '" class="btn btn-sm btn-outline-info me-1"><i class="bi bi-eye"></i> View</a>
                        <a href="' . $editUrl . '" class="btn btn-sm btn-outline-primary me-1"><i class="bi bi-pencil"></i> Edit</a>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="confirmDelete(\'' . $deleteUrl . '\')"><i class="bi bi-trash"></i> Delete</button>
                    </div>
                ';
            })
            ->rawColumns(['image_url', 'is_active', 'action'])
            ->make(true);
    }

    public function show($id)
    {
        $banner = Banner::findOrFail($id);
        return view('webadmin.banners.show', compact('banner'));
    }

    public function edit($id)
    {
        $banner = Banner::findOrFail($id);
        return view('webadmin.banners.edit', compact('banner'));
    }

    public function update(Request $request, $id)
    {
        $banner = Banner::findOrFail($id);
        
        $request->validate([
            'title' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'target_screen' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $banner->title = $request->input('title');
        $banner->subtitle = $request->input('subtitle');
        $banner->target_screen = $request->input('target_screen');
        $banner->is_active = $request->has('is_active');
        $banner->save();

        return redirect()->route('admin.banners.index')->with('success', 'Banner updated successfully.');
    }

    public function destroy($id)
    {
        $banner = Banner::findOrFail($id);
        $banner->delete();
        
        return response()->json(['success' => true, 'message' => 'Banner deleted successfully']);
    }
}
