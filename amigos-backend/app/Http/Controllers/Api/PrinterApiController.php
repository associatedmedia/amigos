<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrintJob;
use App\Models\PrinterSetup;
use Illuminate\Http\Request;

class PrinterApiController extends Controller
{
    /**
     * Get all printer configurations.
     */
    public function getConfigs()
    {
        $configs = PrinterSetup::all();
        return response()->json([
            'success' => true,
            'data' => $configs
        ]);
    }

    /**
     * Store a new printer configuration.
     */
    public function storeConfig(Request $request)
    {
        $validated = $request->validate([
            'operation_type' => 'required|string|max:255',
            'printer_id' => 'required|string|max:255',
            'printer_model' => 'nullable|string|max:255',
        ]);

        $config = PrinterSetup::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Printer setup created successfully.',
            'data' => $config
        ]);
    }

    /**
     * Update an existing printer configuration.
     */
    public function updateConfig(Request $request, $id)
    {
        $config = PrinterSetup::findOrFail($id);

        $validated = $request->validate([
            'operation_type' => 'sometimes|required|string|max:255',
            'printer_id' => 'sometimes|required|string|max:255',
            'printer_model' => 'nullable|string|max:255',
        ]);

        $config->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Printer setup updated successfully.',
            'data' => $config
        ]);
    }

    /**
     * Delete a printer configuration.
     */
    public function deleteConfig($id)
    {
        $config = PrinterSetup::findOrFail($id);
        $config->delete();

        return response()->json([
            'success' => true,
            'message' => 'Printer setup deleted successfully.'
        ]);
    }

    /**
     * Get pending print jobs.
     */
    public function getPendingJobs()
    {
        $jobs = PrintJob::with('order.items.product', 'order.user')
            ->where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $jobs
        ]);
    }

    /**
     * Update print job status.
     */
    public function updateJobStatus(Request $request, $id)
    {
        $job = PrintJob::with('order')->findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'required|in:processing,completed,failed',
            'error_message' => 'nullable|string',
        ]);

        $job->update($validated);

        // If job is completed and it's a kitchen-related job, move order to 'cooking'
        if ($validated['status'] === 'completed' && in_array($job->print_data['type'] ?? '', ['KOT', 'FULL_ORDER'])) {
            if ($job->order && $job->order->status === 'accepted') {
                $job->order->update(['status' => 'cooking']);
                \Log::info("Order #{$job->order_id} status updated to 'cooking' via Printer Bridge.");
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Job status updated successfully.'
        ]);
    }
}
