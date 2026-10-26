'use strict';
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { app, BrowserWindow, ipcMain, net, protocol, session, shell } = require('electron');
const { resolveAsset } = require('./asset-routing');

const HOME = 'rupeerush://game/index.html';
const RELEASES = 'https://github.com/mrcalzon02/Rupee-rush/releases';

// Standard, secure origin keeps localStorage isolated and persistent.
protocol.registerSchemesAsPrivileged([
  { scheme: 'rupeerush', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
]);
app.setName('Rupee Rush');

// Do not share the Android app's local save folder or signature/update channel.
const openReleases = () => shell.openExternal(RELEASES);
ipcMain.on('rupeerush:open-releases', event => {
  if (event.senderFrame?.url.startsWith('rupeerush://game/')) openReleases();
});

function createGameWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 780,
    minHeight: 550,
    backgroundColor: '#111023',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url === RELEASES) openReleases();
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('rupeerush://game/')) event.preventDefault();
  });
  win.loadURL(HOME);
}

app.whenReady().then(() => {
  const root = app.isPackaged
    ? path.join(process.resourcesPath, 'game')
    : path.resolve(__dirname, '../web');
  protocol.handle('rupeerush', request => {
    if (request.method !== 'GET' && request.method !== 'HEAD')
      return new Response('Method not allowed', { status: 405 });
    const file = resolveAsset(root, request.url);
    if (!file) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });

  // Assets are bundled. No game resources should require external network access.
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['http://*/*', 'https://*/*'] },
    (_details, callback) => callback({ cancel: true })
  );
  createGameWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createGameWindow();
  });
});
app.on('window-all-closed', () => app.quit());
