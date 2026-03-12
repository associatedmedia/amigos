<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\OfferBanner;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;
use Illuminate\Support\Facades\Storage;

class OfferBannerController extends Controller
{
    public function index()
    {
        return view('webadmin.offer_banners.index');
    }

    public function create()
    {
        return view('webadmin.offer_banners.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
            'image_url' => 'nullable|url',
            'image' => 'nullable|image|max:2048'
        ]);

        $banner = new OfferBanner();
        $banner->title = $request->title;
        $banner->is_active = $request->has('is_active');

        if ($request->filled('image_url')) {
            $banner->image_url = $request->image_url;
        } elseif ($request->hasFile('image')) {
            $path = $request->file('image')->store('offer_banners', 'public');
            $banner->image_url = 'storage/' . $path;
        }

        $banner->save();

        return redirect()->route('admin.offer-banners.index')->with('success', 'Offer Banner created successfully.');
    }

    public function edit($id)
    {
        $banner = OfferBanner::findOrFail($id);
        return view('webadmin.offer_banners.edit', compact('banner'));
    }

    public function update(Request $request, $id)
    {
        $banner = OfferBanner::findOrFail($id);
        
        $request->validate([
            'title' => 'nullable|string|max:255',
            'image_url' => 'nullable|url',
            'image' => 'nullable|image|max:2048'
        ]);

        $banner->title = $request->title;
        $banner->is_active = $request->has('is_active');

        if ($request->filled('image_url')) {
            if ($banner->image_url && !str_starts_with($banner->image_url, 'http')) {
                Storage::disk('public')->delete(str_replace('storage/', '', $banner->image_url));
            }
            $banner->image_url = $request->image_url;
        } elseif ($request->hasFile('image')) {
            if ($banner->image_url && !str_starts_with($banner->image_url, 'http')) {
                Storage::disk('public')->delete(str_replace('storage/', '', $banner->image_url));
            }
            $path = $request->file('image')->store('offer_banners', 'public');
            $banner->image_url = 'storage/' . $path;
        }

        $banner->save();

        return redirect()->route('admin.offer-banners.index')->with('success', 'Offer Banner updated successfully.');
    }

    public function destroy($id)
    {
        $banner = OfferBanner::findOrFail($id);
        
        if ($banner->image_url && !str_starts_with($banner->image_url, 'http')) {
            Storage::disk('public')->delete(str_replace('storage/', '', $banner->image_url));
        }
        
        $banner->delete();

        return response()->json(['success' => true]);
    }

    public function data()
    {
        $query = OfferBanner::query();

        return DataTables::of($query)
            ->editColumn('image_url', function ($banner) {
                if ($banner->image_url) { // The accessor in the model handles the full URL
                    return '<img src="' . $banner->image_url . '" style="height:40px; border-radius:4px;" />';
                }
                return '<span class="text-muted">No Image</span>';
            })
            ->editColumn('is_active', function ($banner) {
                return $banner->is_active 
                    ? '<span class="badge bg-success">Active</span>' 
                    : '<span class="badge bg-danger">Disabled</span>';
            })
            ->addColumn('action', function ($banner) {
                $editUrl = route('admin.offer-banners.edit', $banner->id);
                $deleteUrl = route('admin.offer-banners.destroy', $banner->id);
                
                return '<a href="' . $editUrl . '" class="btn btn-sm btn-outline-primary me-1"><i class="bi bi-pencil"></i> Edit</a>' .
                       '<button onclick="confirmDelete(\'' . $deleteUrl . '\')" class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i> Delete</button>';
            })
            ->rawColumns(['image_url', 'is_active', 'action'])
            ->make(true);
    }
}
