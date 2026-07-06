const { app, BrowserWindow } = require('electron');
const path = require('path');
const ModuleManager = require('./module-manager');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1360, height: 900,
        backgroundColor: '#0d1117',
        webPreferences: {
            nodeIntegration: true, // Para facilitar o dev inicial
            contextIsolation: false
        }
    });
    
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
    createWindow();
    // Injeta a janela nos módulos para eles poderem comunicar com o front
    ModuleManager.loadModules(mainWindow);
});