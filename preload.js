const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('storage', {
  get: (key) => ipcRenderer.invoke('storage:get', key),
  set: (key, value) => ipcRenderer.invoke('storage:set', key, value)
});

contextBridge.exposeInMainWorld('winOps', {
  minimize: () => ipcRenderer.invoke('win:minimize'),
  maximize: () => ipcRenderer.invoke('win:maximize'),
  close: () => ipcRenderer.invoke('win:close')
});

contextBridge.exposeInMainWorld('fileOps', {
  exportData: (json) => ipcRenderer.invoke('dialog:export', json),
  importData: () => ipcRenderer.invoke('dialog:import')
});

contextBridge.exposeInMainWorld('updater', {
  onAvailable: (cb) => ipcRenderer.on('update:available', (_, v) => cb(v)),
  onDownloaded: (cb) => ipcRenderer.on('update:downloaded', () => cb()),
  install: () => ipcRenderer.invoke('update:install')
});
