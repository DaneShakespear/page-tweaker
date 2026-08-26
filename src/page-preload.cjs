const { ipcRenderer } = require('electron');
let enabled = true;
let hovered;
let selectedElement;
const originals = new WeakMap();
const editedElements = new Set();

function installHoverStyle() {
  if (document.getElementById('page-tweaker-hover-style')) return;
  const hoverStyle = document.createElement('style');
  hoverStyle.id = 'page-tweaker-hover-style';
  hoverStyle.textContent = '.page-tweaker-hover { outline: 2px solid #64d7ff !important; outline-offset: 2px !important; }';
  (document.head || document.documentElement).appendChild(hoverStyle);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installHoverStyle, { once: true });
else installHoverStyle();

function locator(element) {
  if (element.id) return `#${CSS.escape(element.id)}`;
  const parts = [];
  let node = element;
  while (node && node.nodeType === Node.ELEMENT_NODE) {
    const tag = node.tagName.toLowerCase();
    if (tag === 'html') { parts.unshift('html'); break; }
    const siblings = [...node.parentElement?.children || []].filter((s) => s.tagName === node.tagName);
    parts.unshift(`${tag}:nth-of-type(${siblings.indexOf(node) + 1})`);
    node = node.parentElement;
  }
  return parts.join(' > ');
}

function selectorScopes(element) {
  const exactSelector = locator(element);
  const tag = element.tagName.toLowerCase();
  const classes = [...element.classList].filter((name) => name !== 'page-tweaker-hover');
  const scopes = [{ key: `exact:${exactSelector}`, kind: 'exact', selector: exactSelector, label: 'This element', count: 1 }];
  const candidates = [];
  if (classes.length) candidates.push(`${tag}${classes.map((name) => `.${CSS.escape(name)}`).join('')}`);
  classes.forEach((name) => candidates.push(`.${CSS.escape(name)}`));
  candidates.push(tag);
  [...new Set(candidates)].forEach((selector) => {
    const count = document.querySelectorAll(selector).length;
    if (count > 1) scopes.push({ key: `all:${selector}`, kind: 'all', selector, label: `All ${selector}`, count });
  });
  return scopes;
}

function targetsFor(request) {
  if (request.scope?.kind === 'all') return [...document.querySelectorAll(request.scope.selector)];
  const element = document.querySelector(`[data-page-tweaker-target=${JSON.stringify(request.targetId)}]`);
  return element ? [element] : [];
}

function rememberOriginal(element) {
  if (!originals.has(element)) originals.set(element, {
    inlineStyle: element.getAttribute('style'),
    text: element.innerText,
    properties: Object.fromEntries(['font-family', 'font-size', 'line-height', 'letter-spacing', 'color', 'background-color', 'margin', 'padding'].map((property) => [property, element.style.getPropertyValue(property)]))
  });
  editedElements.add(element);
  return originals.get(element);
}

function restoreAllEdits() {
  editedElements.forEach((element) => {
    if (!element.isConnected) return;
    const original = originals.get(element);
    if (original.inlineStyle === null) element.removeAttribute('style');
    else element.setAttribute('style', original.inlineStyle);
    element.innerText = original.text;
  });
}

function clearHover() {
  hovered?.classList.remove('page-tweaker-hover');
  hovered = undefined;
}

function positionSelected() {
  if (!selectedElement) return;
  const box = selectedElement.getBoundingClientRect();
  ipcRenderer.sendToHost('element-position', { targetId: selectedElement.dataset.pageTweakerTarget, box: { x: box.x, y: box.y, width: box.width, height: box.height } });
}

function reportScroll() { ipcRenderer.sendToHost('page-scroll', { x: window.scrollX, y: window.scrollY }); positionSelected(); }
window.addEventListener('scroll', reportScroll, true);
window.addEventListener('resize', positionSelected);

document.addEventListener('mouseover', (event) => {
  if (!enabled || event.target === hovered) return;
  clearHover();
  hovered = event.target;
  hovered.classList.add('page-tweaker-hover');
});

document.addEventListener('click', (event) => {
  if (!enabled) return;
  event.preventDefault();
  event.stopPropagation();
  const element = event.target;
  selectedElement?.removeAttribute('data-page-tweaker-target');
  selectedElement = element;
  const targetId = `target-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  element.setAttribute('data-page-tweaker-target', targetId);
  const box = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const properties = ['font-family', 'font-size', 'line-height', 'letter-spacing', 'color', 'background-color', 'margin', 'padding'];
  ipcRenderer.sendToHost('element-selected', {
    selector: locator(element),
    scopes: selectorScopes(element),
    targetId,
    tag: element.tagName.toLowerCase(),
    text: (element.innerText || '').trim().slice(0, 240),
    inlineStyle: element.getAttribute('style'),
    inlineProperties: Object.fromEntries(properties.map((property) => [property, element.style.getPropertyValue(property)])),
    box: { x: box.x, y: box.y, width: box.width, height: box.height },
    style: {
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      lineHeight: style.lineHeight === 'normal' ? String(parseFloat(style.fontSize) * 1.2) : style.lineHeight,
      letterSpacing: style.letterSpacing === 'normal' ? '0' : style.letterSpacing,
      color: style.color,
      backgroundColor: style.backgroundColor,
      margin: style.margin,
      padding: style.padding
    }
  });
}, true);

ipcRenderer.on('set-inspector', (_event, value) => {
  enabled = value;
  if (!enabled) clearHover();
});

ipcRenderer.on('apply-edit', (_event, request) => {
  try {
    const targets = targetsFor(request);
    if (!targets.length) throw new Error('No elements match this selector. Select the element again.');
    targets.forEach((element) => {
      const original = rememberOriginal(element);
      if (request.action === 'style') Object.entries(request.changes).forEach(([property, value]) => element.style.setProperty(property, value));
      if (request.action === 'text') element.innerText = request.text;
      if (request.action === 'reset-property') {
        const value = original.properties[request.property];
        if (value) element.style.setProperty(request.property, value);
        else element.style.removeProperty(request.property);
      }
      if (request.action === 'restore') {
        if (original.inlineStyle === null) element.removeAttribute('style');
        else element.setAttribute('style', original.inlineStyle);
        element.innerText = original.text;
      }
    });
    ipcRenderer.sendToHost('edit-result', { id: request.id, ok: true, count: targets.length });
  } catch (error) {
    ipcRenderer.sendToHost('edit-result', { id: request.id, ok: false, message: error.message });
  }
});

ipcRenderer.on('apply-session', (_event, request) => {
  try {
    if (request.reset) restoreAllEdits();
    let styleTargets = 0;
    (request.styles || []).forEach((edit) => document.querySelectorAll(edit.selector).forEach((element) => { styleTargets += 1; rememberOriginal(element); Object.entries(edit.changes).forEach(([property, value]) => element.style.setProperty(property, value)); }));
    let textTargets = 0;
    (request.texts || []).forEach((edit) => { const element = document.querySelector(edit.selector); if (element) { textTargets += 1; rememberOriginal(element); element.innerText = edit.text; } });
    ipcRenderer.sendToHost('session-applied', { id: request.id, ok: true, styleTargets, textTargets, styleRequests: (request.styles || []).length });
  } catch (error) {
    ipcRenderer.sendToHost('session-applied', { id: request.id, ok: false, message: error.message });
  }
});

ipcRenderer.on('identify-point', (_event, request) => {
  const element = document.elementFromPoint(request.x, request.y);
  ipcRenderer.sendToHost('point-context', { id: request.id, selector: element ? locator(element) : null, tag: element?.tagName.toLowerCase() || null, text: (element?.innerText || '').trim().slice(0, 160) });
});
