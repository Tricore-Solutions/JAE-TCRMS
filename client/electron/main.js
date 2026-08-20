const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const store = require('./db/store');
const dbRouter = require('./db');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let bootstrapPromise = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 650,
    title: 'JAE TRMS — Training Records Management System',
    // In dev the asset lives in public/; in a packaged build Vite copies it into dist/.
    icon: path.join(__dirname, '..', isDev ? 'public' : 'dist', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    show: false,
    backgroundColor: '#0f172a',
  });

  // Graceful show: prevents flash of blank window
  win.once('ready-to-show', () => {
    win.show();
    if (isDev) win.webContents.openDevTools();
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  win.on('page-title-updated', (e) => e.preventDefault());
}

app.whenReady().then(() => {
  createWindow();

  // Connect to the saved MySQL server (if any) in the background so the UI
  // can render immediately. db:call awaits this before dispatching.
  bootstrapPromise = dbRouter.bootstrap().catch((e) => {
    console.error('DB bootstrap failed:', e && e.message);
    return false;
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Single data channel: the renderer's api layer calls window.electron.db.call(op, payload)
ipcMain.handle('db:call', async (_event, { op, payload } = {}) => {
  if (bootstrapPromise) {
    try { await bootstrapPromise; } catch (_) { /* ignore */ }
  }
  try {
    const data = await dbRouter.call(op, payload);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: (e && e.message) || 'Request failed', status: (e && e.status) || 500 };
  }
});

// Legacy generic config bridge (kept for compatibility)
ipcMain.handle('config:get', () => store.load());
ipcMain.handle('config:set', (_event, data) => {
  const current = store.load();
  return store.save({ ...current, ...data });
});

// --- Auto-updater IPC ---

function sendUpdateStatus(event, data) {
  const wins = BrowserWindow.getAllWindows();
  if (wins.length > 0) {
    wins[0].webContents.send('update-status', { event, ...data });
  }
}

autoUpdater.on('update-available', (info) => {
  sendUpdateStatus('update-available', {
    version: info.version,
    releaseNotes: info.releaseNotes || '',
    releaseDate: info.releaseDate || '',
  });
});

autoUpdater.on('update-not-available', () => {
  sendUpdateStatus('update-not-available', {});
});

autoUpdater.on('download-progress', (progress) => {
  sendUpdateStatus('download-progress', { percent: progress.percent });
});

autoUpdater.on('update-downloaded', () => {
  sendUpdateStatus('update-downloaded', {});
});

autoUpdater.on('error', (err) => {
  sendUpdateStatus('error', { message: err?.message || 'Update error' });
});

ipcMain.handle('updater:check', () => {
  if (isDev) return { event: 'error', message: 'Cannot check for updates in dev mode' };
  autoUpdater.checkForUpdates();
  return { event: 'checking' };
});

ipcMain.handle('updater:download', () => {
  autoUpdater.downloadUpdate();
  return { event: 'downloading' };
});

ipcMain.handle('updater:install', () => {
  // Silent install + reopen the app. Without this, NSIS (oneClick: false)
  // opens the full Setup wizard after download, so users think they must
  // reinstall from scratch.
  autoUpdater.quitAndInstall(true, true);
});
