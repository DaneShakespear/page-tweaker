const test = require('node:test');
const assert = require('node:assert/strict');
const utils = require('../src/browser-utils.js');

test('accepts public URLs, file URLs, and local HTML paths', () => {
  assert.equal(utils.normalizeSource('https://example.com/report'), 'https://example.com/report');
  assert.equal(utils.normalizeSource('file:///Users/me/report.html'), 'file:///Users/me/report.html');
  assert.equal(utils.normalizeSource('/Users/me/report.html'), 'file:///Users/me/report.html');
  assert.equal(utils.normalizeSource('not-a-page'), null);
});

test('reads CSS computed styles and keeps controls centred on the selected value', () => {
  assert.equal(utils.readableValue({ fontSize: '128px' }, 'font-size'), '128px');
  const bounds = utils.sliderBounds('font-size', '128px');
  assert.equal(bounds.value, 128);
  assert.ok(bounds.max >= 256);
});

test('builds scripts that execute inside the selected page', () => {
  const script = utils.styleScript('html > body > h1:nth-of-type(1)', { 'font-size': '24px' });
  assert.match(script, /document\.querySelector/);
  assert.match(script, /font-size/);
});

test('keeps an existing file URL intact instead of nesting file schemes', () => {
  const source = 'file:///Users/dane/report.html';
  assert.equal(utils.normalizeSource(source), source);
});
