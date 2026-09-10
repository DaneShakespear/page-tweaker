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
  assert.match(html, /id="finishMarkup"/);
  assert.match(html, /id="helpTab"/);
  assert.match(renderer, /groupId: state\.currentMarkupGroupId/);
  assert.match(renderer, /function finishCurrentMarkup/);
  assert.match(renderer, /group\.strokes\.forEach/);
  assert.match(renderer, /color !== state\.annotationColor/);
  assert.match(renderer, /Color changed\. The previous markup item was saved/);
});

test('font weight is a live property with an isolated reset', () => {
  const html = read('src/index.html');
  const bridge = read('src/page-preload.cjs');
  const utils = read('src/browser-utils.js');
  assert.match(html, /data-style="font-weight"/);
  assert.match(html, /data-reset-style="font-weight"/);
  assert.match(bridge, /fontWeight: style\.fontWeight/);
  assert.match(utils, /property === 'font-weight'/);
  assert.match(utils, /'font-weight'.*String\(raw\)/);
});

test('the empty state teaches fast opening and AI handoff without leaving the workspace', () => {
  const html = read('src/index.html');
  const css = read('src/shell.css');
  const renderer = read('src/renderer.js');
  assert.match(html, /DROP A PAGE OR IMAGE HERE/);
  assert.match(html, /Stop explaining\. Show your AI\./);
  assert.match(html, /paste a screenshot from your clipboard/i);
  assert.match(renderer, /desktopBridge\.clipboardImage/);
  assert.match(renderer, /desktopBridge\.pathForFile/);
  assert.match(html, /id="emptyChooseFile"/);
  assert.match(html, /Open from Chrome/);
  assert.match(html, /Drag ZIP into AI chat/);
  assert.match(html, /class="bookmarklet empty-bookmarklet"/);
  assert.match(css, /\.empty-drop-mark/);
  assert.match(css, /linear-gradient\(145deg,#1c232c/);
  assert.match(renderer, /querySelector\('#emptyChooseFile'\)/);
  assert.match(renderer, /querySelectorAll\('\.bookmarklet'\)/);
});

test('image mode replaces irrelevant element controls with overall AI notes', () => {
  const html = read('src/index.html');
  const renderer = read('src/renderer.js');
  const css = read('src/shell.css');
  assert.match(html, /id="imageNotes"/);
  assert.match(html, /id="imageNote"/);
  assert.match(html, /id="addImageNote"/);
  assert.match(renderer, /function imageMode\(\)/);
  assert.match(renderer, /function configureInspectorForSource\(\)/);
  assert.match(renderer, /tag: 'image'/);
  assert.match(renderer, /set-inspector', state\.activeTab === 'inspect' && !imageMode\(\)/);
  assert.match(renderer, /style\.setProperty\('cursor','default','important'\)/);
  assert.match(css, /\.image-notes/);
});

test('markup explanations are drawn as visible preview callouts', () => {
  const renderer = read('src/renderer.js');
  assert.match(renderer, /ctx\.roundRect/);
  assert.match(renderer, /item\.explanation\.trim\(\)/);
  assert.match(renderer, /querySelector\('#strokeList'\)\.addEventListener\('input', drawMarkup\)/);
});

test('formatted replacement content is safely previewed, exported, restored, and clearable', () => {
  const html = read('src/index.html');
  const bridge = read('src/page-preload.cjs');
  const renderer = read('src/renderer.js');
  assert.match(html, /id="clearPage"/);
  assert.match(html, /Replace text/);
  assert.match(html, /simple tags such as/);
  assert.match(bridge, /function editableText/);
  assert.match(bridge, /editableText: editableText\(element\)/);
  assert.match(bridge, /allowedContentTags/);
  assert.match(bridge, /function applySafeContent/);
  assert.match(bridge, /element\.innerHTML = original\.html/);
  assert.match(bridge, /applySafeContent\(element, request\.text\)/);
  assert.match(renderer, /state\.originalTexts\.set\(scopedKey\(message\.selector\), message\.editableText\)/);
  assert.match(renderer, /\?\? message\.editableText/);
  assert.doesNotMatch(renderer, /\?\? message\.html/);
  assert.match(renderer, /querySelector\('#clearPage'\)\.addEventListener/);
  assert.match(renderer, /page\.src = 'about:blank'/);
});

test('modified Inspector properties highlight their own reset controls', () => {
  const css = read('src/shell.css');
  const renderer = read('src/renderer.js');
  assert.match(css, /\.reset-control\.modified/);
  assert.match(renderer, /function markControlModified/);
  assert.match(renderer, /Object\.hasOwn\(changes, property\)/);
  assert.match(renderer, /button\.classList\.remove\('modified'\)/);
});

test('navigation keeps feedback isolated by page URL and exports page records', () => {
  const html = read('src/index.html');
  const renderer = read('src/renderer.js');
  assert.match(html, /id="back"[\s\S]*disabled/);
  assert.match(renderer, /function updateNavigationControls/);
  assert.match(renderer, /navigationTrail/);
  assert.match(renderer, /navigationIndex/);
  assert.match(renderer, /executeJavaScript\('history\.back\(\)'\)/);
  assert.match(renderer, /pageOrder: \[\]/);
  assert.match(renderer, /function activateNavigatedPage/);
  assert.match(renderer, /addEventListener\('did-navigate'/);
  assert.match(renderer, /addEventListener\('did-navigate-in-page'/);
  assert.match(renderer, /JSON\.stringify\(\[state\.source, state\.breakpoint, key\]\)/);
  assert.match(renderer, /pageUrl: state\.source/);
  assert.match(renderer, /version: 6/);
  assert.match(renderer, /pages = state\.pageOrder\.map/);
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

test('public branding and stable technical identifiers are wired', () => {
  const html = read('src/index.html');
  const renderer = read('src/renderer.js');
  const manifest = JSON.parse(read('package.json'));
  assert.match(html, /<strong>AI PagePolish <span class="brand-by">by PageTweaker<\/span> <small id="version">/);
  assert.equal(manifest.build.productName, 'AI PagePolish by PageTweaker');
  assert.equal(manifest.name, 'page-tweaker');
  assert.equal(manifest.repository.url, 'https://github.com/DaneShakespear/page-tweaker.git');
  assert.ok(manifest.build.protocols[0].schemes.includes('page-tweaker'));
  assert.match(html, /page-tweaker:\/\/open\?url=/);
  assert.match(html, /data-hex-for="color"/);
  assert.match(html, /data-hex-for="background-color"/);
  assert.doesNotMatch(html, /id="applyText"/);
  assert.match(renderer, /function normalizeHex/);
  assert.match(renderer, /querySelector\('#text'\)\.addEventListener\('input'/);
  assert.match(renderer, /picker\.dispatchEvent\(new Event\('input'/);
});

test('markup supports freehand, line, arrow, rectangle, and circle tools', () => {
  const html = read('src/index.html');
  const renderer = read('src/renderer.js');
  for (const tool of ['freehand', 'line', 'arrow', 'rectangle', 'circle']) assert.match(html, new RegExp(`data-markup-tool="${tool}"`));
  assert.match(renderer, /annotationTool: 'freehand'/);
  assert.match(renderer, /function drawStroke/);
  assert.match(renderer, /mark\.tool === 'rectangle'/);
  assert.match(renderer, /mark\.tool === 'circle'/);
  assert.match(renderer, /mark\.tool === 'arrow'/);
  assert.match(renderer, /tool: stroke\.tool \|\| 'freehand'/);
});

test('spacing controls are independent and wide previews remain horizontally scrollable', () => {
  const html = read('src/index.html');
  const css = read('src/shell.css');
  const bridge = read('src/page-preload.cjs');
  const main = read('src/main.cjs');
  for (const side of ['top', 'right', 'bottom', 'left']) {
    assert.match(html, new RegExp(`data-style="margin-${side}"`));
    assert.match(html, new RegExp(`data-style="padding-${side}"`));
    assert.match(bridge, new RegExp(`margin${side[0].toUpperCase()}${side.slice(1)}: style\\.margin${side[0].toUpperCase()}${side.slice(1)}`));
    assert.match(bridge, new RegExp(`padding${side[0].toUpperCase()}${side.slice(1)}: style\\.padding${side[0].toUpperCase()}${side.slice(1)}`));
  }
  assert.match(css, /#stage\{[^}]*overflow:auto/);
  assert.match(css, /width:var\(--preview-width,1440px\)/);
  assert.doesNotMatch(css, /width:min\(100%,var\(--preview-width/);
  assert.match(main, /resizable: true, maximizable: true, fullscreenable: true/);
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
  assert.match(renderer, /querySelectorAll\('\.bookmarklet'\)/);
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
