<?php

namespace App\Services;

use App\Models\Order;
use App\Models\PrintJob;
use App\Models\PrinterSetup;

class PrinterService
{
    /**
     * Create print jobs for an order.
     * This includes kitchen tickets (KOT) and billing tickets.
     */
    public function queuePrintJobs(Order $order)
    {
        \Log::info("Starting queuePrintJobs for order ID: {$order->id}");
        $order->load(['items.product']);
        
        // 1. Queue Kitchen Jobs (KOT - Category grouped)
        $this->queueKitchenJobs($order);
        
        // 2. Queue Full Order Print (Order As Inputted)
        $this->queueFullOrderJob($order);

        // 3. Queue Billing Job
        $this->queueBillingJob($order);
    }

    /**
     * Group items by their printer based on product category.
     */
    protected function queueKitchenJobs(Order $order)
    {
        $itemsByOperation = [];
        \Log::info("Queueing kitchen jobs for order: {$order->id}");

        foreach ($order->items as $item) {
            if (!$item->product) {
                \Log::warning("Order item {$item->id} has no associated product.");
                continue;
            }

            // Normalize category name to uppercase for comparison
            $categoryName = trim($item->product->category);
            $operationType = strtoupper($categoryName);

            // Check if a printer setup explicitly maps to the category
            $setup = PrinterSetup::whereRaw('UPPER(operation_type) = ?', [$operationType])->first();
            
            // If it doesn't map literally to a category, check the explicit print assignment on the category first
            if (!$setup) {
                $categoryModel = \App\Models\Category::where('name', $item->product->category)->first();
                
                // Prioritize category's print assignment
                if ($categoryModel && !empty($categoryModel->print_assign)) {
                    $operationType = strtoupper(trim($categoryModel->print_assign));
                } 
                // Fallback to product's print assignment
                elseif (!empty($item->product->print_assign)) {
                    $operationType = strtoupper(trim($item->product->print_assign));
                }
            }
            
            \Log::info("Item: {$item->product->name}, Category: '$categoryName' -> Matching as: '$operationType'");
            
            if (!isset($itemsByOperation[$operationType])) {
                $itemsByOperation[$operationType] = [];
            }
            
            $itemsByOperation[$operationType][] = [
                'name' => $item->product->name,
                'quantity' => $item->quantity,
                'variety' => $item->variety_name ?? 'Regular',
            ];
        }

        if (empty($itemsByOperation)) {
            \Log::warning("No items found to group for kitchen printing in order: {$order->id}");
            return;
        }

        foreach ($itemsByOperation as $operation => $items) {
            // Check if a printer setup exists for this operation (CASE INSENSITIVE)
            $setup = PrinterSetup::whereRaw('UPPER(operation_type) = ?', [$operation])->first();
            
            if (!$setup) {
                \Log::error("CRITICAL: No Printer Setup found for operation type: '$operation'. Please create a Printer Setup with Operation Type '$operation' in the admin panel.");
                continue;
            }

            // Check if kitchen printing is enabled for this category
            if ($setup->kitchen_printing_yes_no || $setup->order_kitchen) {
                // Determine number of copies
                $copies = 1;
                if ($setup->kitchen_triplicate) {
                    $copies = 3;
                } elseif ($setup->kitchen_duplicate) {
                    $copies = 2;
                }
                
                \Log::info("Creating $copies KOT PrintJob(s) for order {$order->id}, printer: $operation");
                
                for ($i = 1; $i <= $copies; $i++) {
                    PrintJob::create([
                        'order_id' => $order->id,
                        'printer_type' => $operation,
                        'print_data' => [
                            'type' => 'KOT',
                            'order_number' => $order->order_number ?? $order->id,
                            'customer' => $order->user ? $order->user->name : ($order->customer_name ?? 'Guest'),
                            'address' => $order->address,
                            'phone' => $order->mobile_no ?? ($order->user ? $order->user->mobile_no : ''),
                            'items' => $items,
                            'copy_number' => $i,
                            'total_copies' => $copies,
                            'timestamp' => now()->toDateTimeString(),
                        ],
                        'status' => 'pending'
                    ]);
                }
            }
        }
    }

    /**
     * Create a full order print job if "Order As Inputted" is enabled.
     */
    protected function queueFullOrderJob(Order $order)
    {
        // Find any printer configured to print the full order
        $setups = PrinterSetup::where('order_as_inputted', true)
            ->orWhere('order_print_through_printer_object', true)
            ->get();
            
        if ($setups->isEmpty()) {
            \Log::info("No printer configured for 'Order As Inputted' full order printing.");
            return;
        }
        
        // Prepare all items
        $allItems = [];
        foreach ($order->items as $item) {
            $allItems[] = [
                'name' => $item->product ? $item->product->name : 'Unknown',
                'quantity' => $item->quantity,
                'variety' => $item->variety_name ?? 'Regular',
            ];
        }

        foreach ($setups as $setup) {
            $copies = $setup->order_duplicate ? 2 : 1;
            \Log::info("Creating $copies Full Order PrintJob(s) for order {$order->id}, printer: {$setup->operation_type}");
            
            for ($i = 1; $i <= $copies; $i++) {
                PrintJob::create([
                    'order_id' => $order->id,
                    'printer_type' => $setup->operation_type,
                    'print_data' => [
                        'type' => 'FULL_ORDER',
                        'order_number' => $order->order_number ?? $order->id,
                        'customer' => $order->user ? $order->user->name : ($order->customer_name ?? 'Guest'),
                        'address' => $order->address,
                        'phone' => $order->mobile_no ?? ($order->user ? $order->user->mobile_no : ''),
                        'items' => $allItems,
                        'copy_number' => $i,
                        'total_copies' => $copies,
                        'timestamp' => now()->toDateTimeString(),
                    ],
                    'status' => 'pending'
                ]);
            }
        }
    }

    /**
     * Create a bill print job.
     */
    protected function queueBillingJob(Order $order)
    {
        // Find a billing printer
        $setup = PrinterSetup::whereRaw('UPPER(operation_type) = ?', ['BILLING'])->first();
        
        if (!$setup) {
            \Log::info("No specific 'BILLING' setup found, looking for fallback billing printer.");
            $setup = PrinterSetup::where('bill_print_through_printer_object', true)->first();
        }

        if ($setup) {
            $copies = $setup->bill_duplicate ? 2 : 1;
            \Log::info("Found billing printer: {$setup->operation_type}. Creating $copies billing job(s) for order {$order->id}");
            
            for ($i = 1; $i <= $copies; $i++) {
                PrintJob::create([
                    'order_id' => $order->id,
                    'printer_type' => $setup->operation_type,
                    'print_data' => [
                        'type' => 'BILL',
                        'order_number' => $order->order_number ?? $order->id,
                        'customer_name' => $order->customer_name,
                        'customer' => $order->user ? $order->user->name : ($order->customer_name ?? 'Guest'),
                        'address' => $order->address,
                        'phone' => $order->mobile_no ?? ($order->user ? $order->user->mobile_no : ''),
                        'total' => $order->total_amount,
                        'items' => $order->items->map(fn($i) => [
                            'name' => $i->product ? $i->product->name : 'Unknown',
                            'quantity' => $i->quantity,
                            'price' => $i->price,
                            'tax_percentage' => $i->product ? $i->product->tax_percentage : 0,
                        ]),
                        'copy_number' => $i,
                        'total_copies' => $copies,
                        'timestamp' => now()->toDateTimeString(),
                    ],
                    'status' => 'pending'
                ]);
            }
        } else {
            \Log::error("CRITICAL: No Billing Printer found for order {$order->id}. Please mark at least one printer for 'Bill Print' in Printer Setup.");
        }
    }
}
