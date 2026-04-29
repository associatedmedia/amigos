const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bridgeAPI', {
    // Methods for UI to call Main Process
    getStatus: () => ipcRenderer.invoke('get-status'),
    startService: () => ipcRenderer.invoke('start-service'),
    stopService: () => ipcRenderer.invoke('stop-service'),
    testPrint: (printerId) => ipcRenderer.invoke('test-print', printerId),
    fetchConfigs: () => ipcRenderer.invoke('fetch-configs'),
    saveConfig: (data) => ipcRenderer.invoke('save-config', data),
    deleteConfig: (id) => ipcRenderer.invoke('delete-config', id),
    fetchLabelConfig: () => ipcRenderer.invoke('fetch-label-config'),
    saveLabelConfig: (data) => ipcRenderer.invoke('save-label-config', data),
    testLabelPrint: (printerId, config) => ipcRenderer.invoke('test-label-print', printerId, config),

    // Listeners for UI to receive data from Main Process
    onLog: (callback) => ipcRenderer.on('bridge-log', (event, data) => callback(data)),
    onStatusChange: (callback) => ipcRenderer.on('bridge-status', (event, status) => callback(status))
});
