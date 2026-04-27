const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bridgeAPI', {
    getStatus: () => ipcRenderer.invoke('get-status'),
    startService: () => ipcRenderer.invoke('start-service'),
    stopService: () => ipcRenderer.invoke('stop-service'),
    testPrint: (printerId) => ipcRenderer.invoke('test-print', printerId),
    fetchConfigs: () => ipcRenderer.invoke('fetch-configs'),
    saveConfig: (data) => ipcRenderer.invoke('save-config', data),
    deleteConfig: (id) => ipcRenderer.invoke('delete-config', id),
    onLog: (callback) => ipcRenderer.on('bridge-log', (event, data) => callback(data)),
    onStatusChange: (callback) => ipcRenderer.on('bridge-status', (event, status) => callback(status))
});
