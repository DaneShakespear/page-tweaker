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

test('selected reset and markup removal controls are wired', () => {
  const html = read('src/index.html');
  const renderer = read('src/renderer.js');
  assert.match(html, /id="resetSelectedTop"/);
  assert.match(html, /id="undoStroke"/);
  assert.match(html, /id="clearStrokes"/);
  assert.match(renderer, /data-remove-stroke/);
});
