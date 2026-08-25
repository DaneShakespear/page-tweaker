const page = document.querySelector('#page');
const address = document.querySelector('#address');
const status = document.querySelector('#status');
const controls = document.querySelector('#controls');
const selection = document.querySelector('#selection');
const canvas = document.querySelector('#markup');
const ctx = canvas.getContext('2d');
const annotationControls = document.querySelector('#annotationControls');
const utils = window.PageTweakerUtils;
const desktopBridge = window.pageTweaker;
const state = { source: '', selected: null, cssTweaks: new Map(), textChanges: new Map(), originalStyles: new Map(), notes: [], strokes: [], annotating: false, annotationColor: '#f25f5c', annotationWidth: 3 };

function setStatus(message) { status.textContent = message; }
function makePrompt(handoff) { return `# Page Tweaker handoff\n\nApply these preview-validated changes to the source artifact. Preserve unrelated work.\n\n- Source: ${handoff.source}\n- CSS tweaks: ${handoff.cssTweaks.length}\n- Text changes: ${handoff.textChanges.length}\n- Notes: ${handoff.notes.length}\n\nRead \`handoff.json\` for element locators and exact values. Review \`annotated.png\` for visual markup before implementing.`; }
function resizeCanvas() { const box = page.getBoundingClientRect(); canvas.width = box.width * devicePixelRatio; canvas.height = box.height * devicePixelRatio; canvas.style.width = `${box.width}px`; canvas.style.height = `${box.height}px`; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); drawMarkup(); }
function drawMarkup() { const box = page.getBoundingClientRect(); ctx.clearRect(0, 0, box.width, box.height); for (const stroke of state.strokes) { ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); stroke.points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.stroke(); } state.notes.forEach((note, index) => { const { x, y } = note.box; ctx.fillStyle = '#ffca56'; ctx.beginPath(); ctx.arc(x + 10, y + 10, 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#161616'; ctx.font = '11px sans-serif'; ctx.fillText(String(index + 1), x + 7, y + 14); }); }
function open(rawValue) { if (!desktopBridge) return setStatus('Launch Page Tweaker.app. Opening src/index.html directly in a browser cannot inspect elements or export bundles.'); const source = utils.normalizeSource(rawValue); if (!source) return setStatus('Paste a file:// URL, public http(s) URL, or path to an .html file.'); state.source = source; address.value = source; document.querySelector('#empty').hidden = true; page.src = source; setStatus('Loading preview…'); }
function currentChanges() { return state.cssTweaks.get(state.selected.selector) || {}; }
async function executeSelected(script) { const applied = await page.executeJavaScript(script); if (!applied) throw new Error('The selected element is no longer present. Select it again.'); }
function setControlValues(style) {
  document.querySelectorAll('[data-style]').forEach((control) => {
    const property = control.dataset.style;
    const rawValue = utils.readableValue(style, property) || '';
    if (control.tagName === 'SELECT') { control.value = currentChanges()[property] || ''; return; }
    if (control.type === 'color') { const match = rawValue.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); control.value = match ? `#${[match[1], match[2], match[3]].map((value) => Number(value).toString(16).padStart(2, '0')).join('')}` : '#000000'; return; }
    const bounds = utils.sliderBounds(property, rawValue);
    control.min = bounds.min; control.max = bounds.max; control.step = bounds.step; control.value = bounds.value;
    control.nextElementSibling.value = bounds.value;
  });
}
function renderNotes() { document.querySelector('#notes').innerHTML = state.notes.map((note, index) => `<div class="note"><strong>${index + 1}. Pinned to ${note.tag}</strong><br>${note.text || note.selector}<br>${note.note}</div>`).join(''); }
function showSelection(selected) { selection.innerHTML = `<h2>Selected: ${selected.tag}</h2><p>${selected.text || 'No readable text'}</p><small>${selected.selector}</small>`; document.querySelector('#pinContext').textContent = `This note will pin to this ${selected.tag} and travel with its selector in the export.`; }
function setAnnotationColor(color) { state.annotationColor = color; document.querySelectorAll('[data-color]').forEach((button) => button.classList.toggle('active', button.dataset.color === color)); }

page.addEventListener('did-finish-load', () => { page.send('set-inspector', !state.annotating); resizeCanvas(); setStatus('Click an element to inspect and tweak it.'); });
page.addEventListener('ipc-message', (_event) => { const [selected] = _event.args; if (_event.channel !== 'element-selected' || state.annotating) return; state.selected = selected; if (!state.originalStyles.has(selected.selector)) state.originalStyles.set(selected.selector, selected.inlineStyle); showSelection(selected); controls.hidden = false; document.querySelector('#text').value = state.textChanges.get(selected.selector) || selected.text; setControlValues({ ...selected.style, ...currentChanges() }); });

document.querySelectorAll('[data-style]').forEach((control) => control.addEventListener('input', async () => {
  if (!state.selected) return;
  const property = control.dataset.style;
  const rawValue = control.value;
  const value = utils.cssValue(property, rawValue);
  const changes = { ...currentChanges(), [property]: value };
  if (property === 'font-family' && !rawValue) delete changes[property];
  state.cssTweaks.set(state.selected.selector, changes);
  if (control.nextElementSibling?.tagName === 'OUTPUT') control.nextElementSibling.value = rawValue;
  try { await executeSelected(utils.styleScript(state.selected.selector, changes)); setStatus(`Preview updated: ${property}.`); } catch (error) { setStatus(error.message); }
}));
document.querySelector('#applyText').addEventListener('click', async () => { if (!state.selected) return; const text = document.querySelector('#text').value; state.textChanges.set(state.selected.selector, text); try { await executeSelected(utils.textScript(state.selected.selector, text)); setStatus('Preview text updated.'); } catch (error) { setStatus(error.message); } });
document.querySelector('#pinNote').addEventListener('click', () => { const note = document.querySelector('#note').value.trim(); if (!state.selected || !note) return setStatus('Select an element and enter a note first.'); state.notes.push({ selector: state.selected.selector, tag: state.selected.tag, text: state.selected.text, note, box: state.selected.box }); document.querySelector('#note').value = ''; renderNotes(); drawMarkup(); setStatus(`Pinned note ${state.notes.length} to the selected ${state.selected.tag}.`); });
document.querySelector('#reset').addEventListener('click', async () => { if (!state.selected) return; state.cssTweaks.delete(state.selected.selector); state.textChanges.delete(state.selected.selector); try { await executeSelected(utils.restoreStyleScript(state.selected.selector, state.originalStyles.get(state.selected.selector))); setControlValues(state.selected.style); document.querySelector('#text').value = state.selected.text; setStatus('Selected preview overrides cleared.'); } catch (error) { setStatus(error.message); } });

document.querySelector('#open').addEventListener('click', () => open(address.value));
address.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); open(address.value); } });
address.addEventListener('dragover', (event) => event.preventDefault());
address.addEventListener('drop', (event) => { event.preventDefault(); const dropped = event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain') || event.dataTransfer.files[0]?.path; if (dropped) open(dropped.split('\n')[0]); });
document.querySelector('#file').addEventListener('click', async () => { if (!desktopBridge) return open(''); const picked = await desktopBridge.chooseSource(); if (picked) open(picked); });
document.querySelector('#annotate').addEventListener('click', () => { state.annotating = !state.annotating; canvas.style.pointerEvents = state.annotating ? 'auto' : 'none'; annotationControls.hidden = !state.annotating; page.send('set-inspector', !state.annotating); document.querySelector('#annotate').textContent = state.annotating ? 'Done annotating' : 'Annotate'; setStatus(state.annotating ? 'Choose a color and thickness, then draw over the page.' : 'Markup saved to this session.'); });
document.querySelectorAll('[data-color]').forEach((button) => button.addEventListener('click', () => setAnnotationColor(button.dataset.color)));
document.querySelector('#annotationThickness').addEventListener('input', (event) => { state.annotationWidth = Number(event.target.value); document.querySelector('#annotationThicknessValue').value = `${state.annotationWidth} px`; });
let stroke;
canvas.addEventListener('pointerdown', (event) => { if (!state.annotating) return; stroke = { color: state.annotationColor, width: state.annotationWidth, points: [{ x: event.offsetX, y: event.offsetY }] }; canvas.setPointerCapture(event.pointerId); });
canvas.addEventListener('pointermove', (event) => { if (!stroke) return; stroke.points.push({ x: event.offsetX, y: event.offsetY }); drawMarkup(); ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); stroke.points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.stroke(); });
canvas.addEventListener('pointerup', () => { if (stroke) state.strokes.push(stroke); stroke = null; });

document.querySelector('#export').addEventListener('click', async () => { if (!desktopBridge) return setStatus('Launch Page Tweaker.app to export a bundle.'); if (!state.source) return setStatus('Open a page before exporting.'); const handoff = { version: 1, exportedAt: new Date().toISOString(), source: state.source, viewport: { width: page.clientWidth, height: page.clientHeight }, cssTweaks: [...state.cssTweaks].map(([selector, changes]) => ({ selector, changes })), textChanges: [...state.textChanges].map(([selector, text]) => ({ selector, text })), notes: state.notes, annotations: state.strokes }; let screenshot = null; try { const image = await page.capturePage(); const base = `data:image/png;base64,${image.toPNG().toString('base64')}`; const imageElement = new Image(); await new Promise((resolve, reject) => { imageElement.onload = resolve; imageElement.onerror = reject; imageElement.src = base; }); const composite = document.createElement('canvas'); composite.width = imageElement.width; composite.height = imageElement.height; const compositeContext = composite.getContext('2d'); compositeContext.drawImage(imageElement, 0, 0); compositeContext.drawImage(canvas, 0, 0, composite.width, composite.height); screenshot = composite.toDataURL('image/png'); } catch { setStatus('Exporting data without a screenshot.'); } const folder = await desktopBridge.exportBundle({ handoff, prompt: makePrompt(handoff), screenshot }); if (folder) { setStatus(`Bundle exported to ${folder}`); desktopBridge.showInFolder(folder); } });
window.addEventListener('resize', resizeCanvas);
page.setAttribute('preload', new URL('page-preload.cjs', location.href).href);
const initial = new URLSearchParams(location.search).get('source'); if (initial) open(initial);
if (desktopBridge) desktopBridge.onOpenSource(open);
else setStatus('Launch Page Tweaker.app to open pages, select elements, pin notes, and export bundles.');
