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

    public function destroy($id)
    {
        $customer = User::where('role', 'customer')->findOrFail($id);
        $customer->delete();
        return response()->json(['success' => true]);
    }

    public function data()
    {
        $query = User::where('role', 'customer');

        return DataTables::of($query)
            ->addColumn('address', function ($user) {
                return $user->address ?? 'Not Available';
            })
            ->addColumn('action', function ($user) {
                $viewUrl = route('admin.customers.show', $user->id);
                $editUrl = route('admin.customers.edit', $user->id);
                $deleteUrl = route('admin.customers.destroy', $user->id);
                
                return '<a href="' . $viewUrl . '" class="btn btn-sm btn-outline-info me-1"><i class="bi bi-eye"></i></a>' .
                       '<a href="' . $editUrl . '" class="btn btn-sm btn-outline-primary me-1"><i class="bi bi-pencil"></i></a>' .
                       '<button onclick="confirmDelete(\'' . $deleteUrl . '\')" class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>';
            })
            ->rawColumns(['action'])
            ->make(true);
    }
}
