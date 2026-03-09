<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;

class OrderController extends Controller
{
    public function index()
    {
        return view('webadmin.orders.index');
    }

    public function create()
    {
        return view('webadmin.orders.create');
    }

    public function latestOrderId()
    {
        $latestOrder = Order::orderBy('id', 'desc')->first();
        return response()->json([
            'latest_id' => $latestOrder ? $latestOrder->id : 0
        ]);
    }

    public function show($id)
    {
        $order = Order::with(['user', 'items.product', 'driver'])->findOrFail($id);
        $drivers = \App\Models\User::where('role', 'driver')->get();
        return view('webadmin.orders.show', compact('order', 'drivers'));
    }

    public function updateStatus(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        
        $request->validate([
            'status' => 'required|string|in:pending,accepted,assigned,picked_up,delivered,cancelled,refunded',
        ]);

        $order->status = $request->input('status');
        $order->save();

        return redirect()->route('admin.orders.show', $order->id)->with('success', 'Order status updated successfully.');
    }

    public function assignDriver(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $request->validate([
            'driver_id' => 'required|exists:users,id',
        ]);

        $order->driver_id = $request->input('driver_id');
        // Optionally update status to 'assigned' automatically when a driver is picked
        $order->status = 'assigned'; 
        $order->save();

        return redirect()->route('admin.orders.show', $order->id)->with('success', 'Delivery boy assigned successfully.');
    }

    public function data()
    {
        $query = Order::with('user')->select('orders.*');

        return DataTables::of($query)
            ->addColumn('customer_name', function ($order) {
                return $order->user ? $order->user->name : 'Guest';
            })
            ->addColumn('customer_phone', function ($order) {
                return $order->user ? $order->user->mobile_no : 'N/A';
            })
            ->editColumn('total_amount', function ($order) {
                return '₹' . number_format($order->total_amount, 2);
            })
            ->editColumn('payment_status', function ($order) {
                $color = $order->payment_status === 'paid' ? 'success' : 'warning';
                return '<span class="badge bg-' . $color . '">' . ucfirst(str_replace('_', ' ', $order->payment_status)) . '</span>';
            })
            ->editColumn('status', function ($order) {
                $color = $order->status === 'completed' ? 'success' : ($order->status === 'pending' ? 'warning' : 'secondary');
                return '<span class="badge bg-' . $color . '">' . ucfirst($order->status) . '</span>';
            })
            ->editColumn('created_at', function ($order) {
                return $order->created_at->format('M d, Y h:i A');
            })
            ->addColumn('action', function ($order) {
                $url = route('admin.orders.show', $order->id);
                return '<a href="' . $url . '" class="btn btn-sm btn-outline-primary">View</a>';
            })
            ->rawColumns(['payment_status', 'status', 'action'])
            ->make(true);
    }
}
