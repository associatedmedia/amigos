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

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'mobile_no' => 'required|string|max:20|unique:users',
            'email' => 'nullable|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'address' => 'nullable|string'
        ]);

        $customer = new User();
        $customer->name = $request->name;
        $customer->mobile_no = $request->mobile_no;
        $customer->email = $request->email;
        $customer->password = bcrypt($request->password);
        $customer->role = 'customer';
        $customer->address = $request->address;
        $customer->save();

        return redirect()->route('admin.customers.index')->with('success', 'Customer created successfully.');
    }

    public function storeAjax(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'mobile_no' => 'required|string|max:20|unique:users',
            'email' => 'nullable|email|max:255|unique:users',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ]);
        }

        $customer = new User();
        $customer->name = $request->name;
        $customer->mobile_no = $request->mobile_no;
        $customer->email = $request->email;
        $customer->password = bcrypt($request->password);
        $customer->role = 'user'; // OrderController expects 'user'
        $customer->save();

        return response()->json([
            'success' => true,
            'customer' => $customer
        ]);
    }

    public function show($id)
    {
        $customer = User::where('role', 'customer')->findOrFail($id);
        return view('webadmin.customers.show', compact('customer'));
    }

    public function edit($id)
    {
        $customer = User::where('role', 'customer')->findOrFail($id);
        return view('webadmin.customers.edit', compact('customer'));
    }

    public function update(Request $request, $id)
    {
        $customer = User::where('role', 'customer')->findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'mobile_no' => 'required|string|max:20|unique:users,mobile_no,'.$customer->id,
            'email' => 'nullable|email|max:255|unique:users,email,'.$customer->id,
            'address' => 'nullable|string',
            'password' => 'nullable|string|min:6'
        ]);

        $customer->name = $request->name;
        $customer->mobile_no = $request->mobile_no;
        $customer->email = $request->email;
        $customer->address = $request->address;
        if ($request->filled('password')) {
            $customer->password = bcrypt($request->password);
        }
        $customer->save();

        return redirect()->route('admin.customers.index')->with('success', 'Customer updated successfully.');
    }

    public function toggleStatus($id)
    {
        $customer = User::where('role', 'customer')->findOrFail($id);
        $customer->is_active = !$customer->is_active;
        $customer->save();
        return response()->json([
            'success' => true, 
            'message' => 'Customer status updated successfully', 
            'is_active' => $customer->is_active
        ]);
    }

    public function data()
    {
        $query = User::where('role', 'customer');

        return DataTables::of($query)
            ->addColumn('address', function ($user) {
                return $user->address ?? 'Not Available';
            })
            ->filterColumn('address', function($query, $keyword) {
                $query->whereRaw("address like ?", ["%{$keyword}%"]);
            })
            ->addColumn('action', function ($user) {
                $viewUrl = route('admin.customers.show', $user->id);
                $editUrl = route('admin.customers.edit', $user->id);
                $toggleUrl = route('admin.customers.toggleStatus', $user->id);
                
                $statusBtnClass = $user->is_active ? 'btn-danger' : 'btn-success';
                $statusIcon = $user->is_active ? 'bi-x-circle' : 'bi-check-circle';
                $statusText = $user->is_active ? 'Disable' : 'Enable';
                
                return '<a href="' . $viewUrl . '" class="btn btn-sm btn-outline-info me-1"><i class="bi bi-eye"></i> View</a>' .
                       '<a href="' . $editUrl . '" class="btn btn-sm btn-outline-primary me-1"><i class="bi bi-pencil"></i> Edit</a>' .
                       '<button onclick="toggleStatus(\'' . $toggleUrl . '\')" class="btn btn-sm ' . $statusBtnClass . '"><i class="bi ' . $statusIcon . '"></i> ' . $statusText . '</button>';
            })
            ->rawColumns(['action'])
            ->make(true);
    }
}
