(function exposePageTweakerUtils(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined') module.exports = api;
  root.PageTweakerUtils = api;
}(globalThis, () => {
  const cssToJs = { 'font-size': 'fontSize', 'font-family': 'fontFamily', 'line-height': 'lineHeight', 'letter-spacing': 'letterSpacing', 'background-color': 'backgroundColor' };
  const isHttpUrl = (value) => /^https?:\/\//i.test(value);
  const isFileUrl = (value) => /^file:\/\//i.test(value);
  const isHtmlPath = (value) => /\.html?(?:[?#].*)?$/i.test(value);
  const normalizeSource = (raw) => {
    const value = raw.trim();
    if (!value) return null;
    if (isHttpUrl(value) || isFileUrl(value)) return value;
    return isHtmlPath(value) ? `file://${encodeURI(value)}` : null;
  };
  const readableValue = (style, property) => style[cssToJs[property] || property];
  const numberFrom = (value, fallback) => Number.parseFloat(value) || fallback;
  const sliderBounds = (property, value) => {
    const numeric = numberFrom(value, property === 'line-height' ? 1.2 : 0);
    if (property === 'font-size') return { min: 1, max: Math.max(160, Math.ceil(numeric * 2)), step: 1, value: numeric };
    if (property === 'line-height') return { min: 0.5, max: Math.max(4, Math.ceil(numeric * 2 * 10) / 10), step: 0.05, value: numeric };
    if (property === 'letter-spacing') return { min: -8, max: Math.max(20, Math.ceil(numeric * 2)), step: 0.25, value: numeric };
    return { min: 0, max: Math.max(160, Math.ceil(numeric * 2)), step: 1, value: numeric };
  };
  const cssValue = (property, raw) => ['line-height', 'font-family', 'color', 'background-color'].includes(property) ? String(raw) : `${raw}px`;
  const styleScript = (selector, changes) => `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; for (const [property, value] of Object.entries(${JSON.stringify(changes)})) el.style.setProperty(property, value); return true; })()`;
  const textScript = (selector, text) => `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.innerText = ${JSON.stringify(text)}; return true; })()`;
  const restoreStyleScript = (selector, inlineStyle) => `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; ${inlineStyle === null ? 'el.removeAttribute("style");' : `el.setAttribute("style", ${JSON.stringify(inlineStyle)});`} return true; })()`;
  return { normalizeSource, readableValue, sliderBounds, cssValue, styleScript, textScript, restoreStyleScript };
}));
