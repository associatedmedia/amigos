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
            if (!$item->product) {
                \Log::warning("Order item {$item->id} has no associated product.");
                continue;
            }

            $operationType = strtoupper($item->product->category);
            \Log::info("Processing item: {$item->product->name}, Category: {$item->product->category} -> Operation Type: $operationType");
            
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
            
            if (!$setup) {
                \Log::warning("No PrinterSetup found for operation_type: '$operation'");
                continue;
            }

            if ($setup && $setup->kitchen_printing_yes_no) {
                \Log::info("Creating PrintJob for order {$order->id}, printer: $operation");
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
            \Log::info("No specific 'BILLING' setup found, looking for fallback billing printer.");
            // Fallback: search for any printer with bill_print_through_printer_object enabled
            $setup = PrinterSetup::where('bill_print_through_printer_object', true)->first();
        }

        if ($setup) {
            \Log::info("Found billing printer: {$setup->operation_type}. Creating billing job for order {$order->id}");
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
