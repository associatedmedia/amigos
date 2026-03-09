<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Yajra\DataTables\Facades\DataTables;

class DriverController extends Controller
{
    public function index()
    {
        return view('webadmin.drivers.index');
    }

    public function create()
    {
        return view('webadmin.drivers.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'mobile_no' => 'required|string|max:15|unique:users,mobile_no',
            'password' => 'required|string|min:6',
        ]);

        $driver = new User();
        $driver->name = $request->input('name');
        $driver->mobile_no = $request->input('mobile_no');
        $driver->password = Hash::make($request->input('password'));
        $driver->role = 'driver'; // Force role to driver
        $driver->save();

        return redirect()->route('admin.drivers.index')->with('success', 'Delivery boy added successfully.');
    }

    public function data()
    {
        $query = User::where('role', 'driver');

        return DataTables::of($query)
            ->addColumn('action', function ($driver) {
                $editUrl = route('admin.drivers.edit', $driver->id);
                $deleteUrl = route('admin.drivers.destroy', $driver->id);
                
                return '
                    <div class="d-flex gap-1 justify-content-center">
                        <a href="'.$editUrl.'" class="btn btn-sm btn-outline-secondary" title="Edit"><i class="bi bi-pencil"></i></a>
                        <button type="button" class="btn btn-sm btn-outline-danger" title="Delete" onclick="confirmDelete(\''.$deleteUrl.'\')"><i class="bi bi-trash"></i></button>
                    </div>
                ';
            })
            ->rawColumns(['action'])
            ->make(true);
    }

    public function edit($id)
    {
        $driver = User::where('role', 'driver')->findOrFail($id);
        return view('webadmin.drivers.edit', compact('driver'));
    }

    public function update(Request $request, $id)
    {
        $driver = User::where('role', 'driver')->findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'mobile_no' => 'required|string|max:15|unique:users,mobile_no,'.$id,
            'password' => 'nullable|string|min:6',
        ]);

        $driver->name = $request->input('name');
        $driver->mobile_no = $request->input('mobile_no');
        
        if ($request->filled('password')) {
            $driver->password = Hash::make($request->input('password'));
        }
        
        $driver->save();

        return redirect()->route('admin.drivers.index')->with('success', 'Delivery boy updated successfully.');
    }

    public function destroy($id)
    {
        $driver = User::where('role', 'driver')->findOrFail($id);
        $driver->delete();
        
        return response()->json(['success' => true, 'message' => 'Delivery boy deleted successfully']);
    }
}
