const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

let cache = {};
let dataFilePath = '';
let win;

function loadCache() {
  try {
    cache = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
  } catch (e) {
    cache = {};
  }
}

function saveCache() {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(cache), 'utf-8');
  } catch (e) {}
}

app.whenReady().then(() => {
  dataFilePath = path.join(app.getPath('userData'), 'data.json');
  loadCache();

  ipcMain.handle('storage:get', (_, key) => {
    const val = cache[key];
    return val !== undefined ? { value: val } : null;
  });

  ipcMain.handle('storage:set', (_, key, value) => {
    cache[key] = value;
    saveCache();
    return true;
  });

  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    },
    title: 'CpaCN',
    backgroundColor: '#09090a',
    show: false
  });

  ipcMain.handle('win:minimize', () => win.minimize());
  ipcMain.handle('win:maximize', () => { if (win.isMaximized()) win.unmaximize(); else win.maximize(); });
  ipcMain.handle('win:close', () => win.close());

  ipcMain.handle('dialog:export', async (_, json) => {
    const result = await dialog.showSaveDialog(win, {
      title: 'Exportar dados CpaCN',
      defaultPath: 'cpacn-backup.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, json, 'utf-8');
      return true;
    }
    return false;
  });

  ipcMain.handle('dialog:import', async () => {
    const result = await dialog.showOpenDialog(win, {
      title: 'Importar dados CpaCN',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return fs.readFileSync(result.filePaths[0], 'utf-8');
    }
    return null;
  });

  win.once('ready-to-show', () => {
    win.show();
    if (app.isPackaged) {
      autoUpdater.autoDownload = true;
      autoUpdater.autoInstallOnAppQuit = true;
      autoUpdater.checkForUpdates().catch(() => {});
      autoUpdater.on('update-available', (info) => {
        win.webContents.send('update:available', info.version);
      });
      autoUpdater.on('update-downloaded', () => {
        win.webContents.send('update:downloaded');
      });
      autoUpdater.on('error', () => {});
    }
  });
  ipcMain.handle('update:install', () => autoUpdater.quitAndInstall());
  win.loadFile(path.join(__dirname, 'CPA.html'));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
