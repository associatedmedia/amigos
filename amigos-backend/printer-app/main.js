const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const { startPolling, stopPolling, getStatus, setStatusCallback, setLogCallback, testPrint, fetchConfigs, saveConfig, deleteConfig } = require('./printer_bridge.js');

let mainWindow = null;
let tray = null;
let isQuitting = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 600,
        minHeight: 400,
        title: "Amigos Printer Bridge",
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        autoHideMenuBar: true,
        show: false
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            if (tray) {
                tray.displayBalloon({
                    title: "Amigos Printer Bridge",
                    content: "App is still running in the system tray."
                });
            }
        }
        return false;
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}

async function createTray() {
    try {
        const { nativeImage } = require('electron');
        tray = new Tray(path.join(__dirname, 'icon.png')); 
    } catch(e) {
        console.error("Tray error:", e);
    }

    if (!tray) return;

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open', click: () => {
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            }
        }},
        { type: 'separator' },
        { label: 'Start Service', click: () => {
            startPolling();
        }},
        { label: 'Stop Service', click: () => {
            stopPolling();
        }},
        { type: 'separator' },
        { label: 'Exit', click: () => {
            isQuitting = true;
            app.quit();
        }}
    ]);

    tray.setToolTip('Amigos Printer Bridge');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (!mainWindow.isVisible()) mainWindow.show();
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        createWindow();
        createTray();

        setLogCallback((message, type) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('bridge-log', { message, type });
            }
        });

        setStatusCallback((status) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('bridge-status', status);
            }
            if (tray) {
                tray.setToolTip(`Amigos Printer Bridge: ${status}`);
            }
        });

        ipcMain.handle('get-status', () => getStatus());
        ipcMain.handle('start-service', () => startPolling());
        ipcMain.handle('stop-service', () => stopPolling());
        ipcMain.handle('test-print', async (event, printerId) => {
            return await testPrint(printerId);
        });
        ipcMain.handle('fetch-configs', async () => await fetchConfigs());
        ipcMain.handle('save-config', async (event, data) => await saveConfig(data));
        ipcMain.handle('delete-config', async (event, id) => await deleteConfig(id));

        // Auto-start on system boot
        app.setLoginItemSettings({
            openAtLogin: true,
            openAsHidden: true
        });

        startPolling();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
}
