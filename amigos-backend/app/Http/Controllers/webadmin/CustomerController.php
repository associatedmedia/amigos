<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;

class CustomerController extends Controller
{
    public function index()
    {
        return view('webadmin.customers.index');
    }

    public function create()
    {
        return view('webadmin.customers.create');
    }

    public function data()
    {
        $query = User::where('role', 'customer');

        return DataTables::of($query)
            ->addColumn('address', function ($user) {
                // If address is stored directly on user, use it. Otherwise, fetch from a relation if it exists.
                // Fallback to 'Not Available'
                return $user->address ?? 'Not Available';
            })
            ->addColumn('action', function ($user) {
                return '<a href="#" class="btn btn-sm btn-outline-primary"><i class="bi bi-eye"></i> View</a>';
            })
            ->rawColumns(['action'])
            ->make(true);
    }
}
