const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

let window;
let pendingSource = process.argv.find((arg) => arg.startsWith('http://') || arg.startsWith('https://') || arg.endsWith('.html') || arg.endsWith('.htm'));

function openSource(source) {
  pendingSource = source;
  if (window?.webContents) window.webContents.send('open-source', source);
}

function createWindow() {
  window = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: '#111318',
    titleBarStyle: 'hiddenInset',
    webPreferences: { preload: path.join(__dirname, 'shell-preload.cjs'), contextIsolation: true, webviewTag: true }
  });
  window.loadFile(path.join(__dirname, 'index.html'), { query: pendingSource ? { source: pendingSource } : {} });
}

app.whenReady().then(() => {
  ipcMain.handle('choose-source', async () => {
    const result = await dialog.showOpenDialog(window, { properties: ['openFile'], filters: [{ name: 'HTML', extensions: ['html', 'htm'] }] });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle('export-bundle', async (_event, bundle) => {
    const destination = await dialog.showOpenDialog(window, { title: 'Choose export folder', properties: ['openDirectory', 'createDirectory'] });
    if (destination.canceled) return null;
    const name = `page-tweaker-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const folder = path.join(destination.filePaths[0], name);
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, 'handoff.json'), JSON.stringify(bundle.handoff, null, 2));
    await fs.writeFile(path.join(folder, 'prompt.md'), bundle.prompt);
    if (bundle.screenshot) await fs.writeFile(path.join(folder, 'annotated.png'), Buffer.from(bundle.screenshot.split(',')[1], 'base64'));
    return folder;
  });
  ipcMain.handle('show-in-folder', (_event, target) => shell.showItemInFolder(target));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('open-file', (event, filePath) => { event.preventDefault(); openSource(filePath); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
