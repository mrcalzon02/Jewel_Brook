'use strict';
const { contextBridge, ipcRenderer } = require('electron');

// Tiny, explicit API: no Node.js or filesystem access from gameplay scripts.
contextBridge.exposeInMainWorld('RUPEE_DESKTOP_BRIDGE', Object.freeze({
  platform: process.platform,
  openReleases: () => ipcRenderer.send('rupeerush:open-releases')
}));
