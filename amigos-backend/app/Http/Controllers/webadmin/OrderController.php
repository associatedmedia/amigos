<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;
use Illuminate\Support\Facades\DB;

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
            'latest_id' => $latestOrder ? $latestOrder->id : 0,
            'order_number' => $latestOrder ? $latestOrder->order_number : null
        ]);
    }

    public function show($id)
    {
        $order = Order::with(['user', 'items.product', 'driver'])->findOrFail($id);
        $drivers = \App\Models\User::where('role', 'driver')->get();
        $orderStatuses = \App\Models\OrderStatus::orderBy('step_index')->get();
        return view('webadmin.orders.show', compact('order', 'drivers', 'orderStatuses'));
    }

    public function update(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $request->validate([
            'user_id' => 'required',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
        ]);

        DB::beginTransaction();
        try {
            // 1. Update Main Order details
            $order->user_id = $request->user_id;
            $order->status = $request->status;
            $order->payment_status = $request->payment_status;
            $order->payment_method = $request->payment_method;
            $order->delivery_fee = $request->delivery_fee ?? 0;
            
            // 2. Delete old items and save new ones
            $order->items()->delete();
            
            $subtotal = 0;
            foreach ($request->items as $itemData) {
                $order->items()->create([
                    'product_id' => $itemData['product_id'],
                    'variety_name' => $itemData['variety_name'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'price' => $itemData['price'],
                ]);
                $subtotal += ($itemData['price'] * $itemData['quantity']);
            }

            // 3. Recalculate Totals
            $order->gst_amount = $subtotal * 0.05; // Assuming 5% GST, adjust as needed
            $order->total_amount = $subtotal + $order->gst_amount + $order->delivery_fee;
            $order->save();

            DB::commit();
            return redirect()->route('admin.orders.show', $order->id)->with('success', 'Order updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to update order: ' . $e->getMessage());
        }
    }

    public function updateStatus(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        
        $request->validate([
            'status' => 'required|string|exists:order_statuses,status_code',
        ]);

        $order->status = $request->input('status');
        $order->save();

        // Auto queue print jobs if accepted
        if ($order->status === 'accepted') {
            app(\App\Services\PrinterService::class)->queuePrintJobs($order);
        }

        return redirect()->route('admin.orders.show', $order->id)->with('success', 'Order status updated successfully.');
    }

    public function printKOT($id)
    {
        $order = Order::findOrFail($id);
        app(\App\Services\PrinterService::class)->queuePrintJobs($order);
        return redirect()->route('admin.orders.show', $order->id)->with('success', 'Order sent to print queue.');
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
            ->addColumn('platform', function ($order) {
                if (strtolower($order->platform) === 'ios') {
                    return '<i class="bi bi-apple fs-5" title="iOS App"></i>';
                } elseif (strtolower($order->platform) === 'android') {
                    return '<i class="bi bi-android2 fs-5 text-success" title="Android App"></i>';
                }
                return '<i class="bi bi-globe fs-5 text-secondary" title="Web/Unknown"></i>';
            })
            ->editColumn('status', function ($order) {
                $color = $order->status === 'completed' ? 'success' : ($order->status === 'pending' ? 'warning' : 'secondary');
                return '<span class="badge bg-' . $color . '">' . ucfirst($order->status) . '</span>';
            })
            ->editColumn('created_at', function ($order) {
                return $order->created_at->format('M d, Y h:i A');
            })
            ->addColumn('action', function ($order) {
            $viewUrl = route('admin.orders.show', $order->id);
            $editUrl = route('admin.orders.edit', $order->id); // NEW Route
            
            return '
                <div class="btn-group" role="group">
                    <a href="' . $viewUrl . '" class="btn btn-sm btn-outline-info" title="View KOT"><i class="bi bi-eye"></i></a>
                    <a href="' . $editUrl . '" class="btn btn-sm btn-outline-primary" title="Edit Order"><i class="bi bi-pencil"></i></a>
                </div>
            ';
        })
        ->rawColumns(['platform', 'payment_status', 'status', 'action'])
        ->make(true);
    }
}
