const { app, BrowserWindow, clipboard, dialog, ipcMain, Menu, session, shell, webContents } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const execFileAsync = promisify(execFile);

let window;
let pendingSource = sourceFromArgs(process.argv);

function sourceFromProtocol(value) { try { const url = new URL(value); if (['http:', 'https:', 'file:'].includes(url.protocol)) return value; return url.protocol === 'page-tweaker:' ? url.searchParams.get('url') : null; } catch { return null; } }
function sourceFromArgs(args) { for (const arg of args) { if (/^https?:\/\//i.test(arg) || /^file:\/\//i.test(arg)) return arg; if (/^page-tweaker:\/\//i.test(arg)) return sourceFromProtocol(arg); if (/\.(html?|webloc)$/i.test(arg)) return arg; } return null; }
async function resolveSource(source) { if (!source || !/\.webloc$/i.test(source)) return source; try { const contents = await fs.readFile(source, 'utf8'); return contents.match(/<string>(.*?)<\/string>/s)?.[1]?.replace(/&amp;/g, '&') || source; } catch { return source; } }
async function openSource(source) { pendingSource = await resolveSource(source); if (window?.webContents) window.webContents.send('open-source', pendingSource); }
function createWindow() { window = new BrowserWindow({ width: 1440, height: 940, minWidth: 980, minHeight: 680, backgroundColor: '#111318', titleBarStyle: 'hiddenInset', webPreferences: { preload: path.join(__dirname, 'shell-preload.cjs'), contextIsolation: true, webviewTag: true } }); window.loadFile(path.join(__dirname, 'index.html'), { query: pendingSource ? { source: pendingSource } : {} }); }
function installContextMenu(contents) { contents.on('context-menu', (_event, details) => { const template = []; if (details.selectionText) template.push({ role: 'copy', label: 'Copy' }); if (details.isEditable) template.push({ role: 'cut', label: 'Cut' }, { role: 'paste', label: 'Paste' }); template.push({ role: 'selectAll', label: 'Select All' }); Menu.buildFromTemplate(template).popup({ window }); }); }

const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) app.quit();
else {
  app.on('second-instance', (_event, argv) => { const source = sourceFromArgs(argv); if (source) openSource(source); if (window) { if (window.isMinimized()) window.restore(); window.focus(); } });
  app.whenReady().then(() => {
    app.on('web-contents-created', (_event, contents) => installContextMenu(contents));
    session.fromPartition('persist:page-tweaker-public').webRequest.onErrorOccurred({ urls: ['http://*/*', 'https://*/*'] }, (details) => { if (details.resourceType !== 'xhr' || !window?.webContents) return; let origin = 'the page service'; try { origin = new URL(details.url).origin; } catch {} window.webContents.send('preview-request-error', { origin, error: details.error }); });
    app.dock?.setIcon(path.join(__dirname, 'app-icon.png'));
    ipcMain.handle('choose-source', async () => { const result = await dialog.showOpenDialog(window, { properties: ['openFile'], filters: [{ name: 'HTML or web link', extensions: ['html', 'htm', 'webloc'] }] }); return result.canceled ? null : resolveSource(result.filePaths[0]); });
    ipcMain.handle('app-version', () => app.getVersion());
    ipcMain.handle('export-bundle', async (_event, bundle) => { const destination = path.join(app.getPath('downloads'), 'PageTweaker Handoffs'); const stamp = new Date().toISOString().replace(/[:.]/g, '-'); const name = `page-tweaker-handoff-${stamp}`; const folder = path.join(destination, name); const archive = `${folder}.zip`; await fs.mkdir(folder, { recursive: true }); await fs.writeFile(path.join(folder, 'handoff.json'), JSON.stringify(bundle.handoff, null, 2)); await fs.writeFile(path.join(folder, 'START-HERE.md'), bundle.prompt); for (const [breakpoint, image] of Object.entries(bundle.annotatedImages || {})) await fs.writeFile(path.join(folder, `${breakpoint}-annotated.png`), Buffer.from(image.split(',')[1], 'base64')); await execFileAsync('/usr/bin/ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', folder, archive]); await fs.rm(folder, { recursive: true, force: true }); return { path: archive, name: path.basename(archive) }; });
    ipcMain.handle('copy-text', (_event, text) => { clipboard.writeText(String(text)); return true; });
    ipcMain.handle('capture-page', async (_event, webContentsId) => { const guest = webContents.fromId(Number(webContentsId)); if (!guest) throw new Error('The preview is not available for capture.'); return (await guest.capturePage()).toDataURL(); });
    ipcMain.on('start-drag', async (event, target) => { if (typeof target !== 'string' || !target.endsWith('.zip')) return; try { await fs.access(target); event.sender.startDrag({ file: target, icon: path.join(__dirname, 'app-icon.png') }); } catch {} });
    ipcMain.handle('show-in-folder', (_event, target) => shell.showItemInFolder(target));
    createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
  app.on('open-file', (event, filePath) => { event.preventDefault(); openSource(filePath); });
  app.on('open-url', (event, url) => { event.preventDefault(); const source = sourceFromProtocol(url); if (source) openSource(source); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
