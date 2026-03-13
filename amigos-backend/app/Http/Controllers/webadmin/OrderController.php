<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;

// Import the ESC/POS classes
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector; // Use this instead if USB shared on Windows
use Mike42\Escpos\Printer;

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
        $order->status = 'assigned'; 
        $order->save();

        return redirect()->route('admin.orders.show', $order->id)->with('success', 'Delivery boy assigned successfully.');
    }

    // ==========================================
    // NEW DIRECT PRINT METHOD FOR 80mm PRINTER
    // ==========================================
    public function printKOT($id)
    {
        $order = Order::with(['items.product', 'user'])->findOrFail($id);

        try {
            // 1. Connect to the printer. 
            // Replace with your printer's Local IP Address and Port (Default is 9100).
            $connector = new NetworkPrintConnector("192.168.1.100", 9100);
            
            // If using a USB printer shared on Windows, use this instead:
            // $connector = new WindowsPrintConnector("smb://computer-name/printer-share-name");
            
            $printer = new Printer($connector);

            // 2. Print Header
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->setTextSize(2, 2);
            $printer->text("AMIGOS PIZZA\n");
            $printer->setTextSize(1, 1);
            $printer->text("KITCHEN ORDER TICKET\n");
            $printer->text("------------------------------------------\n");
            
            // 3. Print Order Info
            $printer->setJustification(Printer::JUSTIFY_LEFT);
            $printer->text("Order No: " . ($order->order_number ?? $order->id) . "\n");
            $printer->text("Date: " . $order->created_at->format('M d, Y h:i A') . "\n");
            $printer->text("Type: " . ($order->platform ? ucfirst($order->platform) : 'Walk-in') . "\n");
            $printer->text("------------------------------------------\n");

            // 4. Print Items (Formatted for 80mm / 42-48 characters wide)
            $printer->setEmphasis(true);
            // %-22s = left align 22 chars, %3s = 3 chars qty, %12s = right align 12 chars
            $printer->text(sprintf("%-22s %3s %12s\n", "Item", "Qty", "Total"));
            $printer->setEmphasis(false);
            $printer->text("------------------------------------------\n");

            foreach ($order->items as $item) {
                // Truncate long names so it doesn't break layout
                $name = substr($item->product ? $item->product->name : 'Unknown', 0, 22);
                $qty = $item->quantity;
                $price = "Rs." . number_format($item->price * $item->quantity, 2);
                
                $printer->text(sprintf("%-22s %3s %12s\n", $name, $qty, $price));
                
                // Add variety on the next line if applicable
                if ($item->variety_name) {
                    $printer->text("  -> " . $item->variety_name . "\n");
                }
            }

            $printer->text("------------------------------------------\n");

            // 5. Print Totals
            $printer->setJustification(Printer::JUSTIFY_RIGHT);
            $printer->text("Subtotal: Rs." . number_format($order->total_amount, 2) . "\n");
            $printer->setEmphasis(true);
            $printer->text("Grand Total: Rs." . number_format($order->total_amount, 2) . "\n");
            $printer->setEmphasis(false);

            // 6. Footer and Cut
            $printer->feed(2);
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->text("*** End of Ticket ***\n");
            $printer->feed(3);
            
            // Automatically cut the paper
            $printer->cut();
            
            // Close the connection
            $printer->close();

            return redirect()->back()->with('success', 'KOT sent to printer successfully!');

        } catch (\Exception $e) {
            // If the printer is off or unreachable, catch the error
            return redirect()->back()->with('error', 'Could not print: ' . $e->getMessage());
        }
    }

    public function data()
    {
        $query = Order::with('user')->select('orders.*');

        return DataTables::of($query)
            ->addColumn('customer_name', function ($order) {
                return $order->user ? $order->user->name : 'Guest';
            })
            // ... (rest of your DataTables logic remains exactly the same)
            ->addColumn('action', function ($order) {
                $url = route('admin.orders.show', $order->id);
                return '<a href="' . $url . '" class="btn btn-sm btn-outline-info"><i class="bi bi-eye"></i> View</a>';
            })
            ->rawColumns(['platform', 'payment_status', 'status', 'action'])
            ->make(true);
    }
}