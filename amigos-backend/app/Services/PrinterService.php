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
        $order->load(['items.product']);
        
        // 1. Queue Kitchen Jobs (KOT)
        $this->queueKitchenJobs($order);
        
        // 2. Queue Billing Job
        $this->queueBillingJob($order);
    }

    /**
     * Group items by their printer based on product category.
     */
    protected function queueKitchenJobs(Order $order)
    {
        $itemsByOperation = [];

        foreach ($order->items as $item) {
            if (!$item->product) continue;

            $operationType = strtoupper($item->product->category);
            
            if (!isset($itemsByOperation[$operationType])) {
                $itemsByOperation[$operationType] = [];
            }
            
            $itemsByOperation[$operationType][] = [
                'name' => $item->product->name,
                'quantity' => $item->quantity,
                'variety' => $item->variety_name ?? 'Regular',
            ];
        }

        foreach ($itemsByOperation as $operation => $items) {
            // Check if a printer setup exists for this operation
            $setup = PrinterSetup::where('operation_type', $operation)->first();
            
            if ($setup && $setup->kitchen_printing_yes_no) {
                PrintJob::create([
                    'order_id' => $order->id,
                    'printer_type' => $operation,
                    'print_data' => [
                        'type' => 'KOT',
                        'order_number' => $order->id,
                        'customer' => $order->user ? $order->user->name : 'Guest',
                        'items' => $items,
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
        // Find a billing printer (defaulting to operation_type 'BILLING' or similar)
        // You can refine this logic to pick a specific printer marked for billing
        $setup = PrinterSetup::where('operation_type', 'BILLING')->first();
        
        if (!$setup) {
            // Fallback: search for any printer with bill_print_through_printer_object enabled
            $setup = PrinterSetup::where('bill_print_through_printer_object', true)->first();
        }

        if ($setup) {
            PrintJob::create([
                'order_id' => $order->id,
                'printer_type' => $setup->operation_type,
                'print_data' => [
                    'type' => 'BILL',
                    'order_number' => $order->id,
                    'customer' => $order->user ? $order->user->name : 'Guest',
                    'total' => $order->total_amount,
                    'items' => $order->items->map(fn($i) => [
                        'name' => $i->product ? $i->product->name : 'Unknown',
                        'quantity' => $i->quantity,
                        'price' => $i->price,
                    ]),
                    'timestamp' => now()->toDateTimeString(),
                ],
                'status' => 'pending'
            ]);
        }
    }
}
