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
