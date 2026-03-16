/**
 * Amigos Pizza - Local Printer Bridge
 * This script runs locally on the system connected to the printers.
 * It polls the backend API for pending print jobs and sends them to local printers.
 */

import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
    API_URL: 'https://api.amigospizza.co/api/printer', // Update to your backend URL
    POLL_INTERVAL: 5000, // 5 seconds
    DEBUG: true
};

/**
 * Log message with timestamp
 */
function log(message, type = 'INFO') {
    if (!CONFIG.DEBUG && type === 'DEBUG') return;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
}

/**
 * Main polling loop
 */
async function poll() {
    try {
        log('Polling for pending print jobs...', 'DEBUG');
        
        const response = await fetch(`${CONFIG.API_URL}/pending-jobs`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        const jobs = result.data;

        if (jobs && jobs.length > 0) {
            log(`Found ${jobs.length} pending print jobs.`);
            
            for (const job of jobs) {
                await processJob(job);
            }
        }
    } catch (error) {
        log(`Polling error: ${error.message}`, 'ERROR');
    } finally {
        setTimeout(poll, CONFIG.POLL_INTERVAL);
    }
}

/**
 * Process an individual print job
 */
async function processJob(job) {
    log(`Processing job ID: ${job.id} for Order #${job.order_id} (${job.printer_type})`);
    
    try {
        // 1. Mark as processing
        await updateJobStatus(job.id, 'processing');

        // 2. Perform printing logic
        // Note: In a real implementation, you would use a library like 'node-thermal-printer'
        // and 'printer' to send raw ESC/POS commands to the specific printer ID.
        
        const success = await simulatePrint(job);

        if (success) {
            log(`Successfully printed job ID: ${job.id}`);
            await updateJobStatus(job.id, 'completed');
        } else {
            throw new Error('Printing failed on hardware level');
        }

    } catch (error) {
        log(`Failed to process job ID: ${job.id}. Error: ${error.message}`, 'ERROR');
        await updateJobStatus(job.id, 'failed', error.message);
    }
}

/**
 * Mock printing logic
 */
async function simulatePrint(job) {
    // This is where you would interface with the OS printers.
    return true; 
}

/**
 * Update job status on backend
 */
async function updateJobStatus(id, status, errorMessage = null) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/jobs/${id}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status,
                error_message: errorMessage
            })
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
        log(`Failed to update status for job ${id}: ${error.message}`, 'ERROR');
    }
}

// Start polling
log('Printer Bridge started.');
poll();
