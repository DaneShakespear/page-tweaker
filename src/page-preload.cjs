const { ipcRenderer } = require('electron');
let enabled = true;
let hovered;
let selectedElement;

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
    const siblings = [...node.parentElement?.children || []].filter((s) => s.tagName === node.tagName);
    parts.unshift(`${tag}:nth-of-type(${siblings.indexOf(node) + 1})`);
    if (tag === 'html') break;
    node = node.parentElement;
  }
  return parts.join(' > ');
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

window.addEventListener('scroll', positionSelected, true);
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
    const element = document.querySelector(`[data-page-tweaker-target=${JSON.stringify(request.targetId)}]`);
    if (!element) throw new Error('The selected element is no longer present. Select it again.');
    if (request.action === 'style') Object.entries(request.changes).forEach(([property, value]) => element.style.setProperty(property, value));
    if (request.action === 'text') element.innerText = request.text;
    if (request.action === 'reset-property') {
      if (request.value) element.style.setProperty(request.property, request.value);
      else element.style.removeProperty(request.property);
    }
    if (request.action === 'restore') {
      if (request.inlineStyle === null) element.removeAttribute('style');
      else element.setAttribute('style', request.inlineStyle);
      if (request.text !== undefined) element.innerText = request.text;
    }
    ipcRenderer.sendToHost('edit-result', { id: request.id, ok: true });
  } catch (error) {
    ipcRenderer.sendToHost('edit-result', { id: request.id, ok: false, message: error.message });
  }
});
