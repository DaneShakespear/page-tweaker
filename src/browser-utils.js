(function exposePageTweakerUtils(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined') module.exports = api;
  root.PageTweakerUtils = api;
}(globalThis, () => {
  const cssToJs = { 'font-size': 'fontSize', 'font-family': 'fontFamily', 'font-weight': 'fontWeight', 'line-height': 'lineHeight', 'letter-spacing': 'letterSpacing', 'background-color': 'backgroundColor' };
  const isHttpUrl = (value) => /^https?:\/\//i.test(value);
  const isFileUrl = (value) => /^file:\/\//i.test(value);
  const isHtmlPath = (value) => /\.html?(?:[?#].*)?$/i.test(value);
  const isBareWebAddress = (value) => {
    if (/\s/.test(value) || /^[./~]|^[a-z]:[\\/]/i.test(value)) return false;
    try {
      const hostname = new URL(`https://${value}`).hostname;
      return hostname === 'localhost' || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || /\.[a-z]{2,}$/i.test(hostname);
    } catch { return false; }
  };
  const normalizeSource = (raw) => {
    const value = raw.trim();
    if (!value) return null;
    if (isHttpUrl(value) || isFileUrl(value)) return value;
    if (isBareWebAddress(value) && !(isHtmlPath(value) && !value.includes('/'))) return `https://${value}`;
    return isHtmlPath(value) ? `file://${encodeURI(value)}` : null;
  };
  const readableValue = (style, property) => style[cssToJs[property] || property];
  const numberFrom = (value, fallback) => Number.parseFloat(value) || fallback;
  const sliderBounds = (property, value) => {
    const numeric = numberFrom(value, property === 'line-height' ? 1.2 : 0);
    if (property === 'font-size') return { min: Math.min(numeric, Math.max(8, Math.floor(numeric * 0.5))), max: Math.max(numeric, Math.min(120, Math.max(32, Math.ceil(numeric * 1.5)))), step: 1, value: numeric };
    if (property === 'font-weight') return { min: 100, max: 900, step: 100, value: Math.min(900, Math.max(100, Math.round(numeric / 100) * 100)) };
    if (property === 'line-height') return { min: Math.min(0.8, numeric), max: Math.max(2.5, numeric), step: 0.05, value: numeric };
    if (property === 'letter-spacing') return { min: Math.min(-3, numeric), max: Math.max(8, numeric), step: 0.1, value: numeric };
    return { min: 0, max: Math.max(160, Math.ceil(numeric * 2)), step: 1, value: numeric };
  };
  const cssValue = (property, raw) => ['line-height', 'font-family', 'font-weight', 'color', 'background-color'].includes(property) ? String(raw) : `${raw}px`;
  const targetSelector = (targetId) => `[data-page-tweaker-target=${JSON.stringify(targetId)}]`;
  const styleScript = (targetId, changes) => `(() => { const el = document.querySelector(${JSON.stringify(targetSelector(targetId))}); if (!el) return false; for (const [property, value] of Object.entries(${JSON.stringify(changes)})) el.style.setProperty(property, value); return true; })()`;
  const textScript = (targetId, text) => `(() => { const el = document.querySelector(${JSON.stringify(targetSelector(targetId))}); if (!el) return false; el.innerText = ${JSON.stringify(text)}; return true; })()`;
  const restoreStyleScript = (targetId, inlineStyle) => `(() => { const el = document.querySelector(${JSON.stringify(targetSelector(targetId))}); if (!el) return false; ${inlineStyle === null ? 'el.removeAttribute("style");' : `el.setAttribute("style", ${JSON.stringify(inlineStyle)});`} return true; })()`;
  return { normalizeSource, readableValue, sliderBounds, cssValue, styleScript, textScript, restoreStyleScript };
}));
