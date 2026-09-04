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
  assert.match(bridge, /if \(tag === 'html'\) \{ parts\.unshift\('html'\); break; \}/);
  assert.doesNotMatch(bridge, /html:nth-of-type\(0\)/);
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
  assert.match(renderer, /explanation: state\.markupExplanation\.trim\(\)/);
  assert.match(renderer, /stroke\.explanation = explanation\.value/);
});

test('responsive previews scope evidence and markup by breakpoint', () => {
  const html = read('src/index.html');
  const renderer = read('src/renderer.js');
  const bridge = read('src/page-preload.cjs');
  assert.match(html, /data-breakpoint="desktop"/);
  assert.match(html, /data-breakpoint="tablet"/);
  assert.match(html, /data-breakpoint="mobile"/);
  assert.match(renderer, /function scopedKey/);
  assert.match(renderer, /breakpoint: state\.breakpoint/);
  assert.match(renderer, /point\.y - state\.pageScroll\.y/);
  assert.match(bridge, /'page-scroll'/);
  assert.match(bridge, /'identify-point'/);
  assert.match(renderer, /applyCurrentBreakpoint\(\{ reset: true \}\)/);
  assert.match(bridge, /restoreAllEdits\(\)/);
});

test('handoff tells the receiving AI to infer intent rather than paste preview code', () => {
  const renderer = read('src/renderer.js');
  assert.match(renderer, /evidence describing the user's desired outcome/);
  assert.match(renderer, /Do not blindly paste selectors/);
  assert.match(renderer, /previewStyleEvidence/);
});

test('reset controls have explicit property labels and native context copy is available', () => {
  const html = read('src/index.html');
  const main = read('src/main.cjs');
  const renderer = read('src/renderer.js');
  assert.match(html, />Reset font size</);
  assert.match(html, />Reset text color</);
  assert.match(main, /role: 'copy'/);
  assert.match(renderer, /setOneControl\(property, state\.selected\.style\)/);
});

test('breakpoint controls use standard device SVGs and handoff images include page context', () => {
  const html = read('src/index.html');
  const renderer = read('src/renderer.js');
  const main = read('src/main.cjs');
  assert.equal((html.match(/class="viewport-button/g) || []).length, 3);
  assert.match(html, /class="viewport-button[^>]*>[\s\S]*?<svg/);
  assert.match(renderer, /captureCurrentVisual/);
  assert.match(renderer, /desktopBridge\.capturePage/);
  assert.match(main, /\$\{breakpoint\}-annotated\.png/);
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

test('PageTweaker branding, live text, and synchronized hex color fields are wired', () => {
  const html = read('src/index.html');
  const renderer = read('src/renderer.js');
  const manifest = JSON.parse(read('package.json'));
  assert.match(html, /<strong>PageTweaker <small id="version">/);
  assert.equal(manifest.build.productName, 'PageTweaker');
  assert.match(html, /data-hex-for="color"/);
  assert.match(html, /data-hex-for="background-color"/);
  assert.doesNotMatch(html, /id="applyText"/);
  assert.match(renderer, /function normalizeHex/);
  assert.match(renderer, /querySelector\('#text'\)\.addEventListener\('input'/);
  assert.match(renderer, /picker\.dispatchEvent\(new Event\('input'/);
});

test('web pages keep a persistent login session and login controls are pass-through', () => {
  const html = read('src/index.html');
  const bridge = read('src/page-preload.cjs');
  const renderer = read('src/renderer.js');
  assert.match(html, /partition="persist:page-tweaker-public"/);
  assert.match(html, /<kbd>⌥ Option<\/kbd>/);
  assert.match(bridge, /interactiveSelector/);
  assert.match(bridge, /function shouldPassThrough\(event\)/);
  assert.match(bridge, /event\.target\?\.closest\?\.\(interactiveSelector\) && !event\.altKey/);
  assert.match(bridge, /if \(shouldPassThrough\(event\)\)/);
  assert.match(bridge, /'interactive-guidance'/);
  assert.match(renderer, /Hold Option \(⌥\)/);
});

test('help includes a draggable Chrome bookmarklet for opening the current tab', () => {
  const html = read('src/index.html');
  const css = read('src/shell.css');
  const main = read('src/main.cjs');
  const renderer = read('src/renderer.js');
  assert.match(html, /id="bookmarklet"/);
  assert.match(html, /chrome-bookmarklet-guide\.svg/);
  assert.match(html, /Drag this shortcut to Chrome/);
  assert.match(html, /draggable="true"/);
  assert.match(html, /javascript:location\.href='page-tweaker:\/\/open\?url='\+encodeURIComponent\(location\.href\)/);
  assert.match(css, /\.bookmarklet\{/);
  assert.match(main, /url\.searchParams\.get\('url'\)/);
  assert.match(renderer, /querySelector\('#bookmarklet'\)\.addEventListener\('click'/);
  assert.match(renderer, /desktopBridge\.copyText\(code\)/);
});

test('failed login requests report privacy-safe network diagnostics', () => {
  const main = read('src/main.cjs');
  const shell = read('src/shell-preload.cjs');
  const renderer = read('src/renderer.js');
  assert.match(main, /webRequest\.onErrorOccurred/);
  assert.match(main, /new URL\(details\.url\)\.origin/);
  assert.match(main, /preview-request-error/);
  assert.match(shell, /onPreviewRequestError/);
  assert.match(renderer, /No password or request contents were recorded/);
});
