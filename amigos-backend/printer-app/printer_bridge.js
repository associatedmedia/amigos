/**
 * Amigos Pizza - Local Printer Bridge
 * Electron Main Process Module
 */

const net = require('net');

let ThermalPrinter, PrinterTypes, CharacterSet, BreakLine;

try {
    const tp = require('node-thermal-printer');
    ThermalPrinter = tp.printer;
    PrinterTypes = tp.types;
    CharacterSet = tp.CharacterSet;
    BreakLine = tp.BreakLine;
} catch (e) {
    console.warn("[WARNING] 'node-thermal-printer' module is not installed.");
}

const CONFIG = {
    API_URL: 'https://api.amigospizza.co/api/printer', 
    POLL_INTERVAL: 5000, 
    DEBUG: true
};

let printerConfigs = [];
let isPolling = false;
let currentStatus = 'Stopped';
let pollTimer = null;

let logCallback = null;
let statusCallback = null;

function setLogCallback(cb) {
    logCallback = cb;
}

function setStatusCallback(cb) {
    statusCallback = cb;
}

function updateStatus(status) {
    currentStatus = status;
    if (statusCallback) statusCallback(status);
}

function getStatus() {
    return currentStatus;
}

function log(message, type = 'INFO') {
    if (!CONFIG.DEBUG && type === 'DEBUG') return;
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${type}] ${message}`;
    console.log(formattedMessage);
    if (logCallback) logCallback(message, type);
}

function startPolling() {
    if (isPolling) return;
    isPolling = true;
    updateStatus('Running');
    log('Printer Bridge started.');
    poll();
}

function stopPolling() {
    if (!isPolling) return;
    isPolling = false;
    if (pollTimer) clearTimeout(pollTimer);
    updateStatus('Stopped');
    log('Printer Bridge stopped.', 'WARNING');
}

async function poll() {
    if (!isPolling) return;

    try {
        log('Polling for pending print jobs...', 'DEBUG');

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
                if (!isPolling) break; // Break if stopped during processing
                await processJob(job);
            }
        }
    } catch (error) {
        log(`Polling error: ${error.message}`, 'ERROR');
    } finally {
        if (isPolling) {
            pollTimer = setTimeout(poll, CONFIG.POLL_INTERVAL);
        }
    }
}

async function processJob(job) {
    log(`Processing job ID: ${job.id} for Order #${job.order_id} (${job.printer_type})`);

    try {
        await updateJobStatus(job.id, 'processing');
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

async function simulatePrint(job) {
    if (!ThermalPrinter) {
        throw new Error("'node-thermal-printer' missing.");
    }

    const normalizedJobType = job.printer_type?.toString().trim().toUpperCase();
    const config = printerConfigs.find(c => c.operation_type?.trim().toUpperCase() === normalizedJobType);

    if (!config || !config.printer_id) {
        throw new Error(`No hardware printer_id configured in Admin Panel for operation type: ${job.printer_type}`);
    }

    const printerIp = config.printer_id.split(',')[0].trim();

    if (!/^[0-9\.]+$/.test(printerIp)) {
        throw new Error(`CRITICAL: For Raw IP Printing, the Printer ID must be an IP Address. Found: '${printerIp}'`);
    }

    log(`Generating ESC/POS for IP: ${printerIp}`, 'DEBUG');

    let printer = new ThermalPrinter({
        type: PrinterTypes?.EPSON,
        interface: 'tcp://' + printerIp,
        characterSet: CharacterSet?.PC852_LATIN2,
        removeSpecialCharacters: false,
        lineCharacter: "-",
        breakLine: BreakLine?.WORD,
    });

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

    const buffer = printer.getBuffer();

    return new Promise((resolve, reject) => {
        log(`Connecting to ${printerIp}:9100...`, 'DEBUG');

        const client = new net.Socket();

        client.on('error', (err) => {
            log(`Network socket failed: TCP Connection error to ${printerIp}:9100 -> ${err.message}`, 'ERROR');
            reject(new Error(`TCP Error: ${err.message}`));
        });

        client.connect(9100, printerIp, () => {
            log(`Connected to TCP Socket. Pushing Buffer...`, 'DEBUG');

            client.write(buffer, () => {
                log(`Buffer successfully sent. Closing TCP Port...`, 'DEBUG');
                client.destroy(); 
                resolve(true);
            });
        });

        setTimeout(() => {
            client.destroy();
            reject(new Error(`Connection to ${printerIp} timed out after 5 seconds.`));
        }, 5000);
    });
}

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

async function testPrint(printerIp) {
    if (!ThermalPrinter) {
        log("'node-thermal-printer' missing. Cannot run test print.", "ERROR");
        return { success: false, error: "'node-thermal-printer' module missing." };
    }
    
    log(`Running test print on IP: ${printerIp}`, 'INFO');

    try {
        let printer = new ThermalPrinter({
            type: PrinterTypes?.EPSON,
            interface: 'tcp://' + printerIp,
            characterSet: CharacterSet?.PC852_LATIN2,
            removeSpecialCharacters: false,
            lineCharacter: "-",
            breakLine: BreakLine?.WORD,
        });

        printer.alignCenter();
        printer.println("AMIGOS PIZZA");
        printer.println("TEST PRINT SUCCESSFUL");
        printer.drawLine();
        printer.println("If you can read this, the");
        printer.println("connection is working fine.");
        printer.drawLine();
        printer.cut();

        const buffer = printer.getBuffer();

        return await new Promise((resolve, reject) => {
            const client = new net.Socket();
            client.on('error', (err) => {
                log(`Test print failed to connect to ${printerIp}:9100`, 'ERROR');
                resolve({ success: false, error: err.message });
            });
            client.connect(9100, printerIp, () => {
                client.write(buffer, () => {
                    log(`Test print buffer successfully sent to ${printerIp}`, 'INFO');
                    client.destroy(); 
                    resolve({ success: true });
                });
            });
            setTimeout(() => {
                client.destroy();
                resolve({ success: false, error: "Connection timed out" });
            }, 5000);
        });
    } catch(err) {
        log(`Test print error: ${err.message}`, 'ERROR');
        return { success: false, error: err.message };
    }
}

async function fetchConfigs() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/configs`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        printerConfigs = result.data || [];
        return { success: true, data: printerConfigs };
    } catch (error) {
        log(`Failed to fetch configs: ${error.message}`, 'ERROR');
        return { success: false, error: error.message };
    }
}

async function saveConfig(data) {
    try {
        const url = data.id ? `${CONFIG.API_URL}/configs/${data.id}` : `${CONFIG.API_URL}/configs`;
        const method = data.id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        
        // Refresh local cache
        await fetchConfigs();
        return result;
    } catch (error) {
        log(`Failed to save config: ${error.message}`, 'ERROR');
        return { success: false, error: error.message };
    }
}

async function deleteConfig(id) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/configs/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        
        // Refresh local cache
        await fetchConfigs();
        return result;
    } catch (error) {
        log(`Failed to delete config: ${error.message}`, 'ERROR');
        return { success: false, error: error.message };
    }
}

module.exports = {
    setLogCallback,
    setStatusCallback,
    getStatus,
    startPolling,
    stopPolling,
    testPrint,
    fetchConfigs,
    saveConfig,
    deleteConfig
};
