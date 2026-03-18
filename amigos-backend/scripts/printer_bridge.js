/**
 * Amigos Pizza - Local Printer Bridge
 * This script runs locally on the system connected to the printers.
 * It polls the backend API for pending print jobs and sends them to local printers.
 */

import fs from 'fs';
import path from 'path';
import net from 'net';

let ThermalPrinter, PrinterTypes, CharacterSet, BreakLine;

// Dynamically load node-thermal-printer for ESC/POS generation
try {
    const thermalPrinterModule = await import('node-thermal-printer');
    const tp = thermalPrinterModule.default || thermalPrinterModule;
    ThermalPrinter = tp.printer;
    PrinterTypes = tp.types;
    CharacterSet = tp.CharacterSet;
    BreakLine = tp.BreakLine;
} catch (e) {
    console.warn("[WARNING] 'node-thermal-printer' module is not installed. We will try to fall back to raw buffers if missing, but formatting will be very poor. Run: npm install node-thermal-printer");
}

// Global configs cache
let printerConfigs = [];

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

        // Fetch configs to map operation_type to actual hardware printer_id
        try {
            const configRes = await fetch(`${CONFIG.API_URL}/configs`);
            if (configRes.ok) {
                const configData = await configRes.json();
                printerConfigs = configData.data || [];
            }
        } catch (e) {
            log('Could not fetch printer configs', 'DEBUG');
        }

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
 * Network printing logic (No C++ drivers needed)
 */
async function simulatePrint(job) {
    if (!ThermalPrinter) {
        throw new Error("'node-thermal-printer' missing. Cannot format receipts. Run: npm install node-thermal-printer");
    }

    // Map the database printer_type to physical config
    const config = printerConfigs.find(c => c.operation_type === job.printer_type);
    
    if (!config || !config.printer_id) {
        throw new Error(`No hardware printer_id configured in Admin Panel for operation type: ${job.printer_type}`);
    }

    // The user's legacy system used "PRINTER_NAME, winspool, COM1:" or similar.
    // For raw networking, the printer_id in the admin panel MUST BE SET TO THE PRINTER'S IP ADDRESS (e.g. "192.168.1.100")
    const printerIp = config.printer_id.split(',')[0].trim();
    
    // Basic IP validation just to be safe it's not a legacy spooler string
    if (!/^[0-9\.]+$/.test(printerIp)) {
        throw new Error(`CRITICAL: For Raw IP Printing, the Printer ID must be an IP Address (e.g., 192.168.1.100). Found: '${printerIp}'`);
    }

    log(`Generating ESC/POS for IP: ${printerIp}`, 'DEBUG');

    // Create the receipt payload
    let printer = new ThermalPrinter({
        type: PrinterTypes?.EPSON,
        interface: 'tcp://' + printerIp, // Dummy interface to satisfy library validation
        characterSet: CharacterSet?.PC852_LATIN2,
        removeSpecialCharacters: false,
        lineCharacter: "-",
        breakLine: BreakLine?.WORD,
    }); // No driver attached, we just want the Buffer

    const data = job.print_data;

    printer.alignCenter();
    printer.println("AMIGOS PIZZA");
    printer.drawLine();
    
    printer.alignLeft();
    printer.println(`Order #: ${data.order_number}`);
    printer.println(`Customer: ${data.customer}`);
    printer.println(`Date: ${data.timestamp}`);
    
    if (data.type === 'KOT' || data.type === 'FULL_ORDER') {
        printer.println(`Ticket Type: ${data.type}`);
        if (data.total_copies > 1) {
            printer.println(`Copy: ${data.copy_number} of ${data.total_copies}`);
        }
        printer.drawLine();
        
        printer.tableCustom([
            { text: "Qty", align: "LEFT", width: 0.15 },
            { text: "Item", align: "LEFT", width: 0.85 }
        ]);
        printer.drawLine();
        
        for (const item of data.items) {
            printer.tableCustom([
                { text: String(item.quantity), align: "LEFT", width: 0.15 },
                { text: `${item.name} (${item.variety || ''})`, align: "LEFT", width: 0.85 }
            ]);
        }
    } else if (data.type === 'BILL') {
        printer.println(`Ticket Type: RECEIPT / BILL`);
        if (data.total_copies > 1) {
            printer.println(`Copy: ${data.copy_number} of ${data.total_copies}`);
        }
        printer.drawLine();
        
        printer.tableCustom([
            { text: "Qty", align: "LEFT", width: 0.15 },
            { text: "Item", align: "LEFT", width: 0.55 },
            { text: "Price", align: "RIGHT", width: 0.30 }
        ]);
        printer.drawLine();
        
        for (const item of data.items) {
            printer.tableCustom([
                { text: String(item.quantity), align: "LEFT", width: 0.15 },
                { text: item.name, align: "LEFT", width: 0.55 },
                { text: String(item.price), align: "RIGHT", width: 0.30 }
            ]);
        }
        printer.drawLine();
        printer.alignRight();
        printer.println(`TOTAL: Rs ${data.total}`);
    }

    printer.drawLine();
    printer.alignCenter();
    printer.println("Thank you!");
    printer.cut();
    
    // Get the raw ESC/POS Buffer
    const buffer = printer.getBuffer();

    return new Promise((resolve, reject) => {
        log(`Connecting to ${printerIp}:9100...`, 'DEBUG');
        
        // Connect over raw TCP socket (Port 9100 is standard for receipt printers)
        const client = new net.Socket();
        
        client.on('error', (err) => {
            log(`Network socket failed: TCP Connection error to ${printerIp}:9100 -> ${err.message}`, 'ERROR');
            reject(new Error(`TCP Error: ${err.message}`));
        });

        client.connect(9100, printerIp, () => {
            log(`Connected to TCP Socket. Pushing Buffer...`, 'DEBUG');
            
            client.write(buffer, () => {
                log(`Buffer successfully sent. Closing TCP Port...`, 'DEBUG');
                client.destroy(); // kill client after server's response
                resolve(true);
            });
        });
        
        // Timeout safeguard
        setTimeout(() => {
            client.destroy();
            reject(new Error(`Connection to ${printerIp} timed out after 5 seconds.`));
        }, 5000);
    });
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
