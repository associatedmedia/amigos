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
                return '<a href="#" class="btn btn-sm btn-outline-primary"><i class="bi bi-eye"></i> View</a>';
            })
            ->rawColumns(['image_url', 'is_active', 'action'])
            ->make(true);
    }
}
