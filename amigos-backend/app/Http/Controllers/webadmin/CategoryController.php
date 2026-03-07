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

    public function data()
    {
        $query = Category::query();

        return DataTables::of($query)
            ->editColumn('image_url', function ($category) {
                if ($category->image_url) {
                    return '<img src="' . $category->image_url . '" style="height:40px; border-radius:4px;" />';
                }
                return '<span class="text-muted">No Image</span>';
            })
            ->addColumn('action', function ($category) {
                return '<a href="#" class="btn btn-sm btn-outline-primary"><i class="bi bi-eye"></i> View</a>';
            })
            ->rawColumns(['image_url', 'action'])
            ->make(true);
    }
}
