const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

let window;
let pendingSource = sourceFromArgs(process.argv);

function sourceFromProtocol(value) { try { const url = new URL(value); return url.protocol === 'page-tweaker:' ? url.searchParams.get('url') : null; } catch { return null; } }
function sourceFromArgs(args) { for (const arg of args) { if (/^https?:\/\//i.test(arg) || /^file:\/\//i.test(arg)) return arg; if (/^page-tweaker:\/\//i.test(arg)) return sourceFromProtocol(arg); if (/\.(html?|webloc)$/i.test(arg)) return arg; } return null; }
async function resolveSource(source) { if (!source || !/\.webloc$/i.test(source)) return source; try { const contents = await fs.readFile(source, 'utf8'); return contents.match(/<string>(.*?)<\/string>/s)?.[1]?.replace(/&amp;/g, '&') || source; } catch { return source; } }
async function openSource(source) { pendingSource = await resolveSource(source); if (window?.webContents) window.webContents.send('open-source', pendingSource); }
function createWindow() { window = new BrowserWindow({ width: 1440, height: 940, minWidth: 980, minHeight: 680, backgroundColor: '#111318', titleBarStyle: 'hiddenInset', webPreferences: { preload: path.join(__dirname, 'shell-preload.cjs'), contextIsolation: true, webviewTag: true } }); window.loadFile(path.join(__dirname, 'index.html'), { query: pendingSource ? { source: pendingSource } : {} }); }

const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) app.quit();
else {
  app.on('second-instance', (_event, argv) => { const source = sourceFromArgs(argv); if (source) openSource(source); if (window) { if (window.isMinimized()) window.restore(); window.focus(); } });
  app.whenReady().then(() => {
    ipcMain.handle('choose-source', async () => { const result = await dialog.showOpenDialog(window, { properties: ['openFile'], filters: [{ name: 'HTML or web link', extensions: ['html', 'htm', 'webloc'] }] }); return result.canceled ? null : resolveSource(result.filePaths[0]); });
    ipcMain.handle('app-version', () => app.getVersion());
    ipcMain.handle('export-bundle', async (_event, bundle) => { const destination = await dialog.showOpenDialog(window, { title: 'Choose export folder', properties: ['openDirectory', 'createDirectory'] }); if (destination.canceled) return null; const name = `page-tweaker-${new Date().toISOString().replace(/[:.]/g, '-')}`; const folder = path.join(destination.filePaths[0], name); await fs.mkdir(folder, { recursive: true }); await fs.writeFile(path.join(folder, 'handoff.json'), JSON.stringify(bundle.handoff, null, 2)); await fs.writeFile(path.join(folder, 'prompt.md'), bundle.prompt); if (bundle.screenshot) await fs.writeFile(path.join(folder, 'annotated.png'), Buffer.from(bundle.screenshot.split(',')[1], 'base64')); return folder; });
    ipcMain.handle('show-in-folder', (_event, target) => shell.showItemInFolder(target));
    createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
  app.on('open-file', (event, filePath) => { event.preventDefault(); openSource(filePath); });
  app.on('open-url', (event, url) => { event.preventDefault(); const source = sourceFromProtocol(url); if (source) openSource(source); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
