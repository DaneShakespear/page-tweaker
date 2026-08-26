#!/usr/bin/env node
const assert = require('node:assert/strict');
const { execFileSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.join(__dirname, '..');
const binary = path.join(root, 'dist', 'mac-arm64', 'Page Tweaker.app', 'Contents', 'MacOS', 'Page Tweaker');
const fixture = path.join(root, 'test', 'fixtures', 'selector-scope.html');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'page-tweaker-smoke-'));
const port = 9338;
const app = spawn(binary, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, fixture], { stdio: 'ignore' });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const windowPosition = () => {
  const script = `import CoreGraphics\nimport Foundation\nlet windows = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as! [[String: Any]]\nfor window in windows {\n  if (window[kCGWindowOwnerName as String] as? String) == "Page Tweaker", let bounds = window[kCGWindowBounds as String] as? [String: Any], let x = bounds["X"], let y = bounds["Y"] { print("\\(x),\\(y)"); break }\n}`;
  const output = execFileSync('/usr/bin/swift', ['-e', script], { encoding: 'utf8' }).trim();
  return output || null;
};
const dragNativeWindow = (position) => {
  const [windowX, windowY] = position.split(',').map(Number);
  const startX = windowX + 120;
  const startY = windowY + 30;
  const script = `import CoreGraphics\nimport Foundation\nlet start = CGPoint(x: ${startX}, y: ${startY})\nlet end = CGPoint(x: ${startX + 100}, y: ${startY + 80})\nCGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: start, mouseButton: .left)?.post(tap: .cghidEventTap)\nThread.sleep(forTimeInterval: 0.1)\nCGEvent(mouseEventSource: nil, mouseType: .leftMouseDown, mouseCursorPosition: start, mouseButton: .left)?.post(tap: .cghidEventTap)\nThread.sleep(forTimeInterval: 0.1)\nCGEvent(mouseEventSource: nil, mouseType: .leftMouseDragged, mouseCursorPosition: end, mouseButton: .left)?.post(tap: .cghidEventTap)\nThread.sleep(forTimeInterval: 0.2)\nCGEvent(mouseEventSource: nil, mouseType: .leftMouseUp, mouseCursorPosition: end, mouseButton: .left)?.post(tap: .cghidEventTap)`;
  execFileSync('/usr/bin/swift', ['-e', script]);
};

async function poll(check, timeout = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeout) { try { const value = await check(); if (value) return value; } catch {} await delay(150); }
  throw new Error('Timed out waiting for packaged app state.');
}

async function connect() {
  const target = await poll(async () => (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((item) => item.type === 'page' && item.url.includes('/src/index.html')));
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); const request = pending.get(message.id); if (!request) return; pending.delete(message.id); message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result); });
  const command = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
  const evaluate = async (expression) => { const response = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (response.exceptionDetails) throw new Error(response.exceptionDetails.text); return response.result.value; };
  return { socket, command, evaluate };
}

(async () => {
  let client;
  try {
    client = await connect();
    const { command, evaluate } = client;
    const initialWindow = await poll(() => windowPosition());
    dragNativeWindow(initialWindow);
    await delay(350);
    const movedWindow = windowPosition();
    assert.notEqual(movedWindow, initialWindow, 'The draggable title bar did not move the native window.');
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('Click an element')`));
    await evaluate(`document.querySelector('#page').executeJavaScript("document.querySelector('h1').click(); true")`);
    await poll(() => evaluate(`!document.querySelector('#selectorBar').hidden`));
    const choices = await evaluate(`[...document.querySelectorAll('[data-scope-key]')].map((button) => button.textContent)`);
    assert.equal(choices[0], 'This element');
    assert.ok(choices.some((label) => label.startsWith('All h1')));
    assert.match(await evaluate(`document.querySelector('#scopeSummary').textContent`), /only this element/);

    await evaluate(`[...document.querySelectorAll('[data-scope-key]')].find((button) => button.textContent.startsWith('All h1')).click()`);
    await evaluate(`(() => { const input = document.querySelector('[data-style="font-size"]'); input.value = '30'; input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('2 elements')`));
    assert.deepEqual(await evaluate(`document.querySelector('#page').executeJavaScript("[...document.querySelectorAll('h1')].map((element) => getComputedStyle(element).fontSize)")`), ['30px', '30px']);

    await evaluate(`document.querySelector('#reset').click()`);
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('Reset 2 selected elements')`));
    assert.deepEqual(await evaluate(`document.querySelector('#page').executeJavaScript("[...document.querySelectorAll('h1')].map((element) => getComputedStyle(element).fontSize)")`), ['22px', '22px']);

    await evaluate(`(() => { const input = document.querySelector('[data-style="font-size"]'); input.value = '34'; input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('2 elements')`));
    await evaluate(`window.confirm = () => true; document.querySelector('#reload').click()`);
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('Click an element') && document.querySelector('#selectorBar').hidden`));
    assert.deepEqual(await evaluate(`document.querySelector('#page').executeJavaScript("[...document.querySelectorAll('h1')].map((element) => getComputedStyle(element).fontSize)")`), ['22px', '22px']);

    await evaluate(`document.querySelector('#markupTab').click()`);
    const box = await evaluate(`(() => { const box = document.querySelector('#markup').getBoundingClientRect(); return { x: box.x, y: box.y }; })()`);
    await command('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x + 100, y: box.y + 100, button: 'left', buttons: 1, clickCount: 1 });
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x + 150, y: box.y + 140, button: 'left', buttons: 1 });
    await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x + 150, y: box.y + 140, button: 'left', buttons: 0, clickCount: 1 });
    await poll(() => evaluate(`document.querySelector('#strokeList').textContent.includes('Stroke 1')`));
    await evaluate(`(() => { const input = document.querySelector('#markupExplanation'); input.value = 'Move the marked block closer to the heading.'; input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    assert.match(await evaluate(`document.querySelector('#markupSaved').textContent`), /Explanation saved/);
    await evaluate(`document.querySelector('[data-remove-stroke="0"]').click()`);
    assert.equal(await evaluate(`document.querySelector('#strokeList').textContent.includes('Stroke 1')`), false);
    await evaluate(`document.querySelector('#helpTab').click()`);
    assert.equal(await evaluate(`document.querySelector('#helpPanel').hidden`), false);
    assert.match(await evaluate(`document.querySelector('#helpPanel').textContent`), /Open from another app/);

    await evaluate(`(() => { const address = document.querySelector('#address'); address.value = 'https://example.com'; address.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); })()`);
    await poll(() => evaluate(`document.querySelector('#page').getURL().startsWith('https://example.com')`));
    const fileUrl = pathToFileURL(fixture).href;
    await evaluate(`(() => { const transfer = new DataTransfer(); transfer.setData('text/uri-list', ${JSON.stringify(fileUrl)}); document.body.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true })); })()`);
    await poll(() => evaluate(`document.querySelector('#page').getURL() === ${JSON.stringify(fileUrl)}`));
    process.stdout.write('Packaged UI smoke passed: native window drag, local path, HTTP Enter, file URL drop, exact/all scope, live edit, scoped reset, clean reload, markup explanation/removal, and Help tab.\n');
  } finally {
    client?.socket.close();
    app.kill('SIGTERM');
    await delay(500);
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
