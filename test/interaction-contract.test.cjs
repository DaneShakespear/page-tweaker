const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('selector scope defaults to exact and supports repeated class and tag matches', () => {
  const bridge = read('src/page-preload.cjs');
  const renderer = read('src/renderer.js');
  assert.match(bridge, /kind: 'exact'/);
  assert.match(bridge, /candidates\.push\(tag\)/);
  assert.match(bridge, /document\.querySelectorAll\(request\.scope\.selector\)/);
  assert.match(renderer, /setScope\(selected\.scopes\[0\]\)/);
});

test('clean reload forces a new webview document and clears session state', () => {
  const renderer = read('src/renderer.js');
  assert.match(renderer, /clearSession\(\)/);
  assert.match(renderer, /page\.reloadIgnoringCache\(\)/);
});

test('selected reset, markup explanation, help, and removal controls are wired', () => {
  const html = read('src/index.html');
  const renderer = read('src/renderer.js');
  assert.match(html, /id="reset"/);
  assert.match(html, /id="undoStroke"/);
  assert.match(html, /id="clearStrokes"/);
  assert.match(html, /id="markupExplanation"/);
  assert.match(html, /id="helpTab"/);
  assert.match(renderer, /markupExplanation: state\.markupExplanation\.trim\(\)/);
  assert.match(renderer, /data-remove-stroke/);
});

test('the title bar is draggable and interactive header controls opt out', () => {
  const css = read('src/shell.css');
  assert.match(css, /header\{[^}]*-webkit-app-region:drag/);
  assert.match(css, /header input,header button\{[^}]*-webkit-app-region:no-drag/);
});

test('browser-style header relies on Enter and does not repeat tab actions', () => {
  const html = read('src/index.html');
  assert.doesNotMatch(html, /id="open"/);
  assert.doesNotMatch(html, /id="annotate"/);
  assert.match(html, /id="reload"[\s\S]*id="address"/);
});

test('AI handoff is a draggable archive with a selectable and copyable path', () => {
  const html = read('src/index.html');
  const renderer = read('src/renderer.js');
  const main = read('src/main.cjs');
  assert.match(html, /id="handoffFile"[^>]*draggable="true"/);
  assert.match(html, /id="handoffPath"[^>]*readonly/);
  assert.match(html, /id="copyHandoffPath"/);
  assert.match(renderer, /desktopBridge\.startDrag/);
  assert.match(main, /const name = `page-tweaker-handoff-\$\{stamp\}`/);
  assert.match(main, /const archive = `\$\{folder\}\.zip`/);
  assert.match(main, /START-HERE\.md/);
});
