const { contextBridge, ipcRenderer, webUtils } = require('electron');
contextBridge.exposeInMainWorld('pageTweaker', {
  chooseSource: () => ipcRenderer.invoke('choose-source'),
  chooseImage: () => ipcRenderer.invoke('choose-image'),
  readImage: (source) => ipcRenderer.invoke('read-image', source),
  clipboardImage: () => ipcRenderer.invoke('clipboard-image'),
  pathForFile: (file) => webUtils.getPathForFile(file),
  version: () => ipcRenderer.invoke('app-version'),
  exportBundle: (bundle) => ipcRenderer.invoke('export-bundle', bundle),
  saveMergedImage: (image) => ipcRenderer.invoke('save-merged-image', image),
  startDrag: (target) => ipcRenderer.send('start-drag', target),
  copyText: (text) => ipcRenderer.invoke('copy-text', text),
  capturePage: (webContentsId) => ipcRenderer.invoke('capture-page', webContentsId),
  showInFolder: (target) => ipcRenderer.invoke('show-in-folder', target),
  onOpenSource: (callback) => ipcRenderer.on('open-source', (_event, source) => callback(source)),
  onPreviewRequestError: (callback) => ipcRenderer.on('preview-request-error', (_event, details) => callback(details))
});
