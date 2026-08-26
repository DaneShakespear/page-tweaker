const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('pageTweaker', {
  chooseSource: () => ipcRenderer.invoke('choose-source'),
  version: () => ipcRenderer.invoke('app-version'),
  exportBundle: (bundle) => ipcRenderer.invoke('export-bundle', bundle),
  showInFolder: (target) => ipcRenderer.invoke('show-in-folder', target),
  onOpenSource: (callback) => ipcRenderer.on('open-source', (_event, source) => callback(source))
});
