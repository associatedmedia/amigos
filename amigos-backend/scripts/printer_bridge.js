/**
 * Amigos Pizza - Local Printer Bridge
 * This script runs locally on the system connected to the printers.
 * It polls the backend API for pending print jobs and sends them to local printers.
*. DATED : 25/MAR/2026  
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

    // Map the database printer_type to physical config (Case-insensitive matching)
    const normalizedJobType = job.printer_type?.toString().trim().toUpperCase();
    const config = printerConfigs.find(c => c.operation_type?.trim().toUpperCase() === normalizedJobType);

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

    const dateObj = new Date(data.timestamp);
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const orderType = data.address ? "HOME DELIVERY" : "TAKEAWAY";

    let cleanAddr = data.address;
    if (cleanAddr) {
        try {
            let parsed = JSON.parse(data.address);
            if (Array.isArray(parsed)) cleanAddr = parsed.join(", ");
            else if (typeof parsed === 'object') cleanAddr = Object.values(parsed).join(", ");
        } catch (e) { }
    }

    if (data.type === 'KOT' || data.type === 'FULL_ORDER') {
        printer.alignCenter();
        printer.println("AMIGOS PIZZA | WEB ORDER");
        printer.println("KITCHEN ORDER TICKET");
        if (data.total_copies > 1) {
            printer.println(`Copy: ${data.copy_number} of ${data.total_copies}`);
        }
        printer.drawLine();

        printer.alignLeft();
        printer.println(orderType);
        printer.println(`KOT No. : ${data.order_number}`);
        printer.println(`Date: ${dateStr}   Time: ${timeStr}`);
        printer.println(`Customer: ${data.customer_name || data.customer || 'Guest'}`);
        if (data.phone) printer.println(`Phone: ${data.phone}`);
        if (cleanAddr) printer.println(`Address: ${cleanAddr}`);
        printer.drawLine();

        printer.tableCustom([
            { text: "Qty", align: "LEFT", width: 0.15 },
            { text: "Item", align: "LEFT", width: 0.85 }
        ]);
        printer.drawLine();

        for (const item of data.items) {
            printer.tableCustom([
                { text: String(item.quantity), align: "LEFT", width: 0.15 },
                { text: `${item.name} ${item.variety ? '(' + item.variety + ')' : ''}`, align: "LEFT", width: 0.85 }
            ]);
            // Print the kitchen station assigned to this item
            if (item.kitchen) {
                printer.tableCustom([
                    { text: "", align: "LEFT", width: 0.15 },
                    { text: ` Kitchen -- [${item.kitchen}]`, align: "LEFT", width: 0.85 }
                ]);
            }
        }
        printer.drawLine();
        printer.alignCenter();
        printer.println("*** END OF TICKET ***");
    } else if (data.type === 'BILL') {
        printer.alignCenter();
        printer.println("Office Copy | Web Order");
        printer.println("");
        printer.println("Amigo's Foods & Hospitalities");
        printer.println("Gogji Bagh , Opp. Amar Singh College");
        printer.println("Main Gate , Srinagar, J & K");
        printer.println("Phone : 9797798505,9906667444");
        printer.println("        9070145454,8716988621");
        printer.println("GST NO.- 01ABIFA7518C1ZZ");
        printer.println("(All Taxes are Inclusive)");
        printer.drawLine();

        printer.println(orderType);
        printer.alignLeft();
        printer.tableCustom([
            { text: `Bill : ${data.order_number}`, align: "LEFT", width: 0.50 },
            { text: `Time : ${timeStr}`, align: "RIGHT", width: 0.50 }
        ]);

        // Match 10 chars of customer name max for UID
        // let uid = (data.customer_name || data.customer || 'Guest').substring(0, 10).toLowerCase();
        // printer.tableCustom([
        //     { text: dateStr, align: "LEFT", width: 0.25 },
        //     { text: "000 0", align: "CENTER", width: 0.40 },
        //     { text: uid, align: "RIGHT", width: 0.35 }
        // ]);
        printer.drawLine();

        printer.tableCustom([
            { text: "Item Name", align: "LEFT", width: 0.50 },
            { text: "Qty.Rate", align: "RIGHT", width: 0.25 },
            { text: "Amount", align: "RIGHT", width: 0.25 }
        ]);
        printer.drawLine();

        let subTotal = 0;
        let totalQty = 0;
        let taxes = {};

        for (const item of data.items) {
            const taxPercent = parseFloat(item.tax_percentage) || 0;
            const baseRate = parseFloat(item.price) / (1 + (taxPercent / 100));
            const amount = baseRate * parseInt(item.quantity, 10);
            const taxAmount = (parseFloat(item.price) - baseRate) * parseInt(item.quantity, 10);

            subTotal += amount;
            totalQty += parseInt(item.quantity, 10);

            if (taxPercent > 0) {
                if (!taxes[taxPercent]) taxes[taxPercent] = 0;
                taxes[taxPercent] += taxAmount;
            }

            printer.tableCustom([
                { text: item.name.substring(0, 25), align: "LEFT", width: 0.50 },
                { text: `${item.quantity} ${baseRate.toFixed(2)}`, align: "RIGHT", width: 0.25 },
                { text: amount.toFixed(2), align: "RIGHT", width: 0.25 }
            ]);
        }

        printer.drawLine();

        printer.tableCustom([
            { text: "Sub Total", align: "LEFT", width: 0.50 },
            { text: String(totalQty), align: "CENTER", width: 0.25 },
            { text: subTotal.toFixed(2), align: "RIGHT", width: 0.25 }
        ]);

        for (const [percent, taxAmt] of Object.entries(taxes)) {
            const halfTax = taxAmt / 2;
            const halfPercent = parseFloat(percent) / 2;
            if (taxAmt > 0.01) {
                printer.tableCustom([
                    { text: `CGST ${halfPercent}%`, align: "LEFT", width: 0.50 },
                    { text: "", align: "CENTER", width: 0.25 },
                    { text: halfTax.toFixed(2), align: "RIGHT", width: 0.25 }
                ]);
                printer.tableCustom([
                    { text: `SGST ${halfPercent}%`, align: "LEFT", width: 0.50 },
                    { text: "", align: "CENTER", width: 0.25 },
                    { text: halfTax.toFixed(2), align: "RIGHT", width: 0.25 }
                ]);
            }
        }

        printer.drawLine();
        printer.tableCustom([
            { text: "Gross Amount", align: "LEFT", width: 0.50 },
            { text: "", align: "CENTER", width: 0.25 },
            { text: parseFloat(data.total).toFixed(2), align: "RIGHT", width: 0.25 }
        ]);
        printer.drawLine();

        printer.alignLeft();
        if (data.customer_name) {
            printer.println(`G. Name : ${data.customer_name.toUpperCase()}`);
        } else if (data.customer) {
            printer.println(`G. Name : ${data.customer.toUpperCase()}`);
        }

        if (cleanAddr) {
            // ">>>>>" style address prefix like in image
            printer.println(`Address : >>>>>${cleanAddr}`);
        }

        if (data.phone) {
            printer.println(`phone   : ${data.phone}`);
        }

        printer.println(`KOT No. : ${data.order_number}`);
        printer.println("Thanks for Your Shopping Online !");
        printer.println("Rate Our Apps On Play Store and App Store");
    }

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
