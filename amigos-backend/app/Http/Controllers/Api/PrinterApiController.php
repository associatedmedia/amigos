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
        $job = PrintJob::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'required|in:processing,completed,failed',
            'error_message' => 'nullable|string',
        ]);

        $job->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Job status updated successfully.'
        ]);
    }
}
