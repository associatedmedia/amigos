// -- Dashboard Elements --
const statusBadge = document.getElementById('statusBadge');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const terminal = document.getElementById('terminal');
const printerIpInput = document.getElementById('printerIpInput');
const testPrintBtn = document.getElementById('testPrintBtn');

// -- Tabs Elements --
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// -- Printer Setup Elements --
const configsTableBody = document.getElementById('configsTableBody');
const opTypeInput = document.getElementById('opTypeInput');
const printerIdInput = document.getElementById('printerIdInput');
const printerModelInput = document.getElementById('printerModelInput');
const editConfigId = document.getElementById('editConfigId');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

let currentConfigs = [];

// ==========================================
// TABS LOGIC
// ==========================================
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab
        btn.classList.add('active');
        const target = btn.getAttribute('data-target');
        document.getElementById(target).classList.add('active');

        // If switching to setup tab, refresh configs
        if (target === 'setup') {
            loadConfigs();
        }
    });
});

// ==========================================
// DASHBOARD LOGIC
// ==========================================
function appendLog(message, type = 'INFO') {
    const el = document.createElement('div');
    el.className = `log-line log-${type.toLowerCase()}`;
    let logStr = message;
    if (!message.startsWith('[')) {
        const time = new Date().toLocaleTimeString();
        logStr = `[${time}] [${type}] ${message}`;
    }
    el.textContent = logStr;
    terminal.appendChild(el);
    while (terminal.childElementCount > 500) {
        terminal.removeChild(terminal.firstChild);
    }
    terminal.scrollTop = terminal.scrollHeight;
}

function updateStatusUI(status) {
    if (status === 'Running') {
        statusBadge.className = 'status-badge status-running';
        statusIcon.textContent = '🟢';
        statusText.textContent = 'Running';
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } else {
        statusBadge.className = 'status-badge status-stopped';
        statusIcon.textContent = '🔴';
        statusText.textContent = 'Stopped';
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

// Initial status check
window.bridgeAPI.getStatus().then(status => {
    updateStatusUI(status);
});

// Event Listeners from Main Process
window.bridgeAPI.onLog((data) => {
    appendLog(data.message, data.type);
});

window.bridgeAPI.onStatusChange((status) => {
    updateStatusUI(status);
});

startBtn.addEventListener('click', () => window.bridgeAPI.startService());
stopBtn.addEventListener('click', () => window.bridgeAPI.stopService());
clearLogsBtn.addEventListener('click', () => terminal.innerHTML = '<div class="log-line log-info">Logs cleared.</div>');

testPrintBtn.addEventListener('click', async () => {
    const ip = printerIpInput.value.trim();
    if (!ip) {
        alert("Please enter a valid Printer IP address.");
        return;
    }
    testPrintBtn.disabled = true;
    testPrintBtn.textContent = "⏳ Printing...";
    appendLog(`Initiating test print to ${ip}...`, 'INFO');

    try {
        const result = await window.bridgeAPI.testPrint(ip);
        if (result.success) {
            appendLog(`Test print to ${ip} completed successfully.`, 'SUCCESS');
            alert(`Success! Test print sent to ${ip}.`);
        } else {
            appendLog(`Test print failed: ${result.error}`, 'ERROR');
            alert(`Failed: ${result.error}`);
        }
    } catch (e) {
        appendLog(`Test print error: ${e.message}`, 'ERROR');
    } finally {
        testPrintBtn.disabled = false;
        testPrintBtn.textContent = "🖨️ Send Test Print";
    }
});

// ==========================================
// PRINTER SETUP LOGIC
// ==========================================
async function loadConfigs() {
    configsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading...</td></tr>';
    try {
        const res = await window.bridgeAPI.fetchConfigs();
        if (res.success) {
            currentConfigs = res.data;
            renderConfigsTable();
        } else {
            configsTableBody.innerHTML = `<tr><td colspan="5" style="color:red;">Error loading configs: ${res.error}</td></tr>`;
        }
    } catch (e) {
        configsTableBody.innerHTML = `<tr><td colspan="5" style="color:red;">Error: ${e.message}</td></tr>`;
    }
}

function renderConfigsTable() {
    configsTableBody.innerHTML = '';
    if (currentConfigs.length === 0) {
        configsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No printer configurations found.</td></tr>';
        return;
    }

    currentConfigs.forEach(config => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${config.id}</td>
            <td><strong>${config.operation_type || 'N/A'}</strong></td>
            <td>${config.printer_id || 'N/A'}</td>
            <td>${config.printer_model || '-'}</td>
            <td class="action-btns">
                <button class="edit-btn" data-id="${config.id}">✏️ Edit</button>
                <button class="delete-btn danger" data-id="${config.id}">🗑️ Del</button>
            </td>
        `;
        configsTableBody.appendChild(tr);
    });

    // Attach event listeners for edit and delete
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => editConfig(parseInt(e.target.getAttribute('data-id'))));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteConfig(parseInt(e.target.getAttribute('data-id'))));
    });
}

function editConfig(id) {
    const config = currentConfigs.find(c => c.id === id);
    if (!config) return;
    
    editConfigId.value = config.id;
    opTypeInput.value = config.operation_type || '';
    printerIdInput.value = config.printer_id || '';
    printerModelInput.value = config.printer_model || '';
    
    cancelEditBtn.style.display = 'inline-block';
    saveConfigBtn.textContent = '💾 Update Config';
}

function resetForm() {
    editConfigId.value = '';
    opTypeInput.value = '';
    printerIdInput.value = '';
    printerModelInput.value = '';
    cancelEditBtn.style.display = 'none';
    saveConfigBtn.textContent = '💾 Save New';
}

cancelEditBtn.addEventListener('click', resetForm);

saveConfigBtn.addEventListener('click', async () => {
    const opType = opTypeInput.value.trim();
    const pId = printerIdInput.value.trim();
    const pModel = printerModelInput.value.trim();
    const id = editConfigId.value;

    if (!opType || !pId) {
        alert("Operation Type and Printer IP are required.");
        return;
    }

    saveConfigBtn.disabled = true;
    saveConfigBtn.textContent = 'Saving...';

    const payload = {
        operation_type: opType,
        printer_id: pId,
        printer_model: pModel
    };
    if (id) payload.id = id;

    try {
        const res = await window.bridgeAPI.saveConfig(payload);
        if (res.success) {
            resetForm();
            await loadConfigs();
        } else {
            alert(`Error saving: ${res.error || res.message}`);
        }
    } catch (e) {
        alert(`Error: ${e.message}`);
    } finally {
        saveConfigBtn.disabled = false;
        saveConfigBtn.textContent = id ? '💾 Update Config' : '💾 Save New';
    }
});

async function deleteConfig(id) {
    if (!confirm(`Are you sure you want to delete configuration #${id}?`)) return;

    try {
        const res = await window.bridgeAPI.deleteConfig(id);
        if (res.success) {
            await loadConfigs();
        } else {
            alert(`Error deleting: ${res.error || res.message}`);
        }
    } catch (e) {
        alert(`Error: ${e.message}`);
    }
}

// ==========================================
// LABEL SETUP LOGIC
// ==========================================
const labelFontSize = document.getElementById('labelFontSize');
const labelShowCustomer = document.getElementById('labelShowCustomer');
const labelShowOrder = document.getElementById('labelShowOrder');
const labelShowTime = document.getElementById('labelShowTime');
const labelFooterText = document.getElementById('labelFooterText');
const labelWidthSelect = document.getElementById('labelWidthSelect');
const saveLabelBtn = document.getElementById('saveLabelBtn');
const labelPreviewBox = document.getElementById('labelPreviewBox');
const testLabelIp = document.getElementById('testLabelIp');
const testLabelBtn = document.getElementById('testLabelBtn');

function updateLabelPreview() {
    let width = parseInt(labelWidthSelect.value) || 32;
    let fs = parseInt(labelFontSize.value) || 1;
    let fontSizeCss = fs === 1 ? '14px' : fs === 2 ? '18px' : '22px';
    
    let html = `<div style="font-size: ${fontSizeCss}; font-weight: bold; text-align: center; margin-bottom: 10px;">Pizza L (Cheese Burst)</div>`;
    
    html += `<div style="font-size: 14px; display: flex; flex-direction: column; gap: 5px;">`;
    if (labelShowOrder.checked) html += `<div>Order #1042</div>`;
    if (labelShowCustomer.checked) html += `<div>Customer: John Doe</div>`;
    if (labelShowTime.checked) html += `<div>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>`;
    if (labelFooterText.value.trim()) html += `<div style="margin-top: 10px; text-align: center;">${labelFooterText.value}</div>`;
    html += `</div>`;
    
    labelPreviewBox.style.width = width === 32 ? '220px' : '300px';
    labelPreviewBox.innerHTML = html;
}

[labelFontSize, labelShowCustomer, labelShowOrder, labelShowTime, labelFooterText, labelWidthSelect].forEach(el => {
    el.addEventListener('input', updateLabelPreview);
    el.addEventListener('change', updateLabelPreview);
});

async function loadLabelConfig() {
    try {
        const res = await window.bridgeAPI.fetchLabelConfig();
        if (res.success && res.data) {
            labelFontSize.value = res.data.fontSize || "1";
            labelShowCustomer.checked = res.data.showCustomerName ?? true;
            labelShowOrder.checked = res.data.showOrderNumber ?? true;
            labelShowTime.checked = res.data.showDateTime ?? true;
            labelFooterText.value = res.data.footerText || "";
            labelWidthSelect.value = res.data.labelWidth || "32";
        }
        updateLabelPreview();
    } catch (e) {
        console.error("Failed to load label config", e);
        updateLabelPreview();
    }
}

saveLabelBtn.addEventListener('click', async () => {
    const payload = {
        fontSize: parseInt(labelFontSize.value),
        showCustomerName: labelShowCustomer.checked,
        showOrderNumber: labelShowOrder.checked,
        showDateTime: labelShowTime.checked,
        footerText: labelFooterText.value.trim(),
        labelWidth: parseInt(labelWidthSelect.value)
    };
    
    saveLabelBtn.disabled = true;
    saveLabelBtn.textContent = 'Saving...';
    try {
        const res = await window.bridgeAPI.saveLabelConfig(payload);
        if (res.success) {
            alert('Label configuration saved successfully.');
        } else {
            alert(`Error saving: ${res.error || res.message}`);
        }
    } catch (e) {
        alert(`Error: ${e.message}`);
    } finally {
        saveLabelBtn.disabled = false;
        saveLabelBtn.textContent = '💾 Save Template';
    }
});

testLabelBtn.addEventListener('click', async () => {
    const ip = testLabelIp.value.trim();
    if (!ip) {
        alert("Please enter a valid Printer IP address for label testing.");
        return;
    }
    
    testLabelBtn.disabled = true;
    testLabelBtn.textContent = "⏳ Testing...";
    
    const payload = {
        fontSize: parseInt(labelFontSize.value),
        showCustomerName: labelShowCustomer.checked,
        showOrderNumber: labelShowOrder.checked,
        showDateTime: labelShowTime.checked,
        footerText: labelFooterText.value.trim(),
        labelWidth: parseInt(labelWidthSelect.value)
    };

    try {
        const result = await window.bridgeAPI.testLabelPrint(ip, payload);
        if (result.success) {
            alert(`Success! Test label sent to ${ip}.`);
        } else {
            alert(`Failed: ${result.error}`);
        }
    } catch (e) {
        alert(`Error: ${e.message}`);
    } finally {
        testLabelBtn.disabled = false;
        testLabelBtn.textContent = "🖨️ Test Print";
    }
});

// Load label config on start
loadLabelConfig();
