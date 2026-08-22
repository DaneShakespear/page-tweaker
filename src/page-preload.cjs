const { ipcRenderer } = require('electron');
let enabled = true;
function locator(element) {
  if (element.id) return `#${CSS.escape(element.id)}`;
  const parts = [];
  let node = element;
  while (node && node.nodeType === Node.ELEMENT_NODE && parts.length < 6) {
    const tag = node.tagName.toLowerCase();
    const siblings = [...node.parentElement?.children || []].filter((s) => s.tagName === node.tagName);
    parts.unshift(`${tag}:nth-of-type(${siblings.indexOf(node) + 1})`);
    node = node.parentElement;
  }
  return parts.join(' > ');
}
document.addEventListener('mouseover', (event) => { if (enabled) event.target.style.outline = '2px solid #64d7ff'; });
document.addEventListener('mouseout', (event) => { if (enabled) event.target.style.outline = ''; });
document.addEventListener('click', (event) => {
  if (!enabled) return;
  event.preventDefault(); event.stopPropagation();
  const el = event.target;
  const box = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  ipcRenderer.sendToHost('element-selected', { selector: locator(el), tag: el.tagName.toLowerCase(), text: (el.innerText || '').trim().slice(0, 240), box: { x: box.x, y: box.y, width: box.width, height: box.height }, style: { fontSize: style.fontSize, lineHeight: style.lineHeight, letterSpacing: style.letterSpacing, color: style.color, backgroundColor: style.backgroundColor, margin: style.margin, padding: style.padding } });
}, true);
ipcRenderer.on('set-inspector', (_event, value) => { enabled = value; });
