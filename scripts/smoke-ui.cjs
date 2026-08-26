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
    process.stdout.write('Smoke connected to packaged app.\n');
    const initialWindow = await poll(() => windowPosition());
    dragNativeWindow(initialWindow);
    await delay(350);
    const movedWindow = windowPosition();
    assert.notEqual(movedWindow, initialWindow, 'The draggable title bar did not move the native window.');
    process.stdout.write('Native window drag passed.\n');
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
    await evaluate(`(() => { const input = document.querySelector('[data-style="color"]'); input.value = '#ff0000'; input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('color')`));
    await evaluate(`document.querySelector('[data-reset-style="font-size"]').click()`);
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('Reset only font-size')`));
    assert.equal(await evaluate(`document.querySelector('[data-style="color"]').value`), '#ff0000');
    assert.deepEqual(await evaluate(`document.querySelector('#page').executeJavaScript("[...document.querySelectorAll('h1')].map((element) => [getComputedStyle(element).fontSize, getComputedStyle(element).color])")`), [['22px', 'rgb(255, 0, 0)'], ['22px', 'rgb(255, 0, 0)']]);
    await evaluate(`(() => { const input = document.querySelector('[data-style="font-size"]'); input.value = '30'; input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('font-size')`));

    await evaluate(`document.querySelector('[data-breakpoint="mobile"]').click()`);
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('Mobile preview')`));
    assert.equal(await evaluate(`Math.round(document.querySelector('#page').getBoundingClientRect().width)`), 390);
    assert.deepEqual(await evaluate(`document.querySelector('#page').executeJavaScript("[...document.querySelectorAll('h1')].map((element) => getComputedStyle(element).fontSize)")`), ['22px', '22px']);
    await evaluate(`document.querySelector('[data-breakpoint="desktop"]').click()`);
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('Desktop preview')`));
    assert.equal(await evaluate(`document.querySelector('#status').dataset.captureError || ''`), '');
    assert.deepEqual(await evaluate(`document.querySelector('#page').executeJavaScript("[...document.querySelectorAll('h1')].map((element) => getComputedStyle(element).fontSize)")`), ['30px', '30px']);

    await evaluate(`window.confirm = () => true; document.querySelector('#reload').click()`);
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('Click an element') && document.querySelector('#selectorBar').hidden`));
    assert.deepEqual(await evaluate(`document.querySelector('#page').executeJavaScript("[...document.querySelectorAll('h1')].map((element) => getComputedStyle(element).fontSize)")`), ['22px', '22px']);
    await evaluate(`document.querySelector('[data-breakpoint="mobile"]').click()`);
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('Mobile preview')`));
    await evaluate(`document.querySelector('#page').executeJavaScript("document.querySelector('h1').click(); true")`);
    await poll(() => evaluate(`!document.querySelector('#selectorBar').hidden`));
    await evaluate(`(() => { const input = document.querySelector('[data-style="font-size"]'); input.value = '27'; input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('font-size')`));
    await evaluate(`document.querySelector('[data-breakpoint="desktop"]').click()`);
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('Desktop preview')`));
    assert.deepEqual(await evaluate(`document.querySelector('#page').executeJavaScript("[...document.querySelectorAll('h1')].map((element) => getComputedStyle(element).fontSize)")`), ['22px', '22px']);
    await evaluate(`document.querySelector('[data-breakpoint="mobile"]').click()`);
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('Mobile preview')`));
    assert.deepEqual(await evaluate(`document.querySelector('#page').executeJavaScript("[...document.querySelectorAll('h1')].map((element) => getComputedStyle(element).fontSize)")`), ['27px', '22px']);
    await evaluate(`document.querySelector('[data-breakpoint="desktop"]').click()`);
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('Desktop preview')`));

    await evaluate(`document.querySelector('#markupTab').click()`);
    await evaluate(`(() => { const input = document.querySelector('#markupExplanation'); input.value = 'Move the marked block closer to the heading.'; input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    assert.match(await evaluate(`document.querySelector('#markupSaved').textContent`), /Ready to attach/);
    const box = await evaluate(`(() => { const box = document.querySelector('#markup').getBoundingClientRect(); return { x: box.x, y: box.y }; })()`);
    await command('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x + 100, y: box.y + 100, button: 'left', buttons: 1, clickCount: 1 });
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x + 150, y: box.y + 140, button: 'left', buttons: 1 });
    await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x + 150, y: box.y + 140, button: 'left', buttons: 0, clickCount: 1 });
    await poll(() => evaluate(`document.querySelector('#strokeList').textContent.includes('Mark 1')`));
    assert.equal(await evaluate(`document.querySelector('#strokeList textarea').value`), 'Move the marked block closer to the heading.');
    const markedPixels = await evaluate(`(() => { const context = document.querySelector('#markup').getContext('2d'); const scale = devicePixelRatio; return [...context.getImageData(80 * scale, 80 * scale, 100 * scale, 90 * scale).data].filter((value, index) => index % 4 === 3 && value > 0).length; })()`);
    assert.ok(markedPixels > 0);
    await evaluate(`document.querySelector('#page').executeJavaScript('scrollTo(0, 300)')`);
    await delay(250);
    const stalePixels = await evaluate(`(() => { const context = document.querySelector('#markup').getContext('2d'); const scale = devicePixelRatio; return [...context.getImageData(80 * scale, 80 * scale, 100 * scale, 90 * scale).data].filter((value, index) => index % 4 === 3 && value > 0).length; })()`);
    assert.equal(stalePixels, 0, 'Markup stayed fixed to the screen instead of moving with the page scroll.');
    await evaluate(`document.querySelector('#page').executeJavaScript('scrollTo(0, 0)')`);
    await delay(200);
    await evaluate(`document.querySelector('#helpTab').click()`);
    assert.equal(await evaluate(`document.querySelector('#helpPanel').hidden`), false);
    assert.match(await evaluate(`document.querySelector('#helpPanel').textContent`), /A handoff is simply one file/);

    await evaluate(`document.querySelector('#export').click()`);
    process.stdout.write('Creating AI handoff file.\n');
    await poll(() => evaluate(`!document.querySelector('#handoffReady').hidden`), 20000);
    const handoffPath = await evaluate(`document.querySelector('#handoffPath').value`);
    assert.equal(fs.existsSync(handoffPath), true, 'The handoff ZIP was not created.');
    const archiveContents = execFileSync('/usr/bin/unzip', ['-Z1', handoffPath], { encoding: 'utf8' });
    assert.match(archiveContents, /START-HERE\.md/);
    assert.match(archiveContents, /handoff\.json/);
    assert.match(archiveContents, /desktop-annotated\.png/);
    assert.match(archiveContents, /mobile-annotated\.png/);
    const annotatedImage = execFileSync('/usr/bin/unzip', ['-p', handoffPath, '*/desktop-annotated.png']);
    assert.ok(annotatedImage.length > 10000, 'The annotated image does not contain meaningful page context.');
    const handoffJson = execFileSync('/usr/bin/unzip', ['-p', handoffPath, '*/handoff.json'], { encoding: 'utf8' });
    assert.match(handoffJson, /Move the marked block closer to the heading/);
    assert.match(handoffJson, /"breakpoint": "desktop"/);
    const startHere = execFileSync('/usr/bin/unzip', ['-p', handoffPath, '*/START-HERE.md'], { encoding: 'utf8' });
    assert.match(startHere, /Do not blindly paste selectors/);
    assert.equal(await evaluate(`document.querySelector('#handoffName').textContent.endsWith('.zip')`), true);
    await evaluate(`document.querySelector('#copyHandoffPath').click()`);
    await poll(() => evaluate(`document.querySelector('#status').textContent.includes('path copied')`));
    process.stdout.write('AI handoff archive and path controls passed.\n');

    await evaluate(`(() => { const address = document.querySelector('#address'); address.value = 'https://example.com'; address.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); })()`);
    await poll(() => evaluate(`document.querySelector('#page').getURL().startsWith('https://example.com')`));
    const fileUrl = pathToFileURL(fixture).href;
    await evaluate(`(() => { const transfer = new DataTransfer(); transfer.setData('text/uri-list', ${JSON.stringify(fileUrl)}); document.body.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true })); })()`);
    await poll(() => evaluate(`document.querySelector('#page').getURL() === ${JSON.stringify(fileUrl)}`));
    process.stdout.write('Packaged UI smoke passed: native window drag, responsive breakpoint isolation, local/public/file loading, live edit, clean reload, per-mark explanation, beginner Help, and goal-focused AI handoff.\n');
  } finally {
    client?.socket.close();
    app.kill('SIGTERM');
    await delay(500);
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
