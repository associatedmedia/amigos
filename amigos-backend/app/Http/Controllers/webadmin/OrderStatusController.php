<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\OrderStatus;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;

class OrderStatusController extends Controller
{
    public function index()
    {
        return view('webadmin.order_statuses.index');
    }

    public function create()
    {
        return view('webadmin.order_statuses.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'status_code' => 'required|string|unique:order_statuses,status_code|max:255',
            'label' => 'required|string|max:255',
            'step_index' => 'required|integer',
        ]);

        OrderStatus::create($request->all());

        return redirect()->route('admin.order-statuses.index')->with('success', 'Order Status created successfully.');
    }

    public function edit($id)
    {
        $orderStatus = OrderStatus::findOrFail($id);
        return view('webadmin.order_statuses.edit', compact('orderStatus'));
    }

    public function update(Request $request, $id)
    {
        $orderStatus = OrderStatus::findOrFail($id);
        
        $request->validate([
            'status_code' => 'required|string|max:255|unique:order_statuses,status_code,'.$orderStatus->id,
            'label' => 'required|string|max:255',
            'step_index' => 'required|integer',
        ]);

        $orderStatus->update($request->all());

        return redirect()->route('admin.order-statuses.index')->with('success', 'Order Status updated successfully.');
    }

    public function destroy($id)
    {
        $orderStatus = OrderStatus::findOrFail($id);
        $orderStatus->delete();

        return response()->json(['success' => true]);
    }

    public function data()
    {
        $query = OrderStatus::select('order_statuses.*');

        return DataTables::of($query)
            ->addColumn('action', function ($orderStatus) {
                $editUrl = route('admin.order-statuses.edit', $orderStatus->id);
                $deleteUrl = route('admin.order-statuses.destroy', $orderStatus->id);
                
                return '<a href="' . $editUrl . '" class="btn btn-sm btn-outline-primary me-1"><i class="bi bi-pencil"></i> Edit</a>' .
                       '<button onclick="confirmDelete(\'' . $deleteUrl . '\')" class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i> Delete</button>';
            })
            ->rawColumns(['action'])
            ->make(true);
    }
}
