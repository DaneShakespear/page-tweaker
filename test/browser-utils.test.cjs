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
  assert.deepEqual(utils.sliderBounds('font-weight', '650'), { min: 100, max: 900, step: 100, value: 700 });
  assert.equal(bounds.max, 128);
  assert.deepEqual(utils.sliderBounds('font-size', '16px'), { min: 8, max: 32, step: 1, value: 16 });
  assert.deepEqual(utils.sliderBounds('line-height', '1.2'), { min: 0.8, max: 2.5, step: 0.05, value: 1.2 });
  assert.deepEqual(utils.sliderBounds('letter-spacing', '0'), { min: -3, max: 8, step: 0.1, value: 0 });
});

test('builds scripts that execute inside the selected page', () => {
  const script = utils.styleScript('target-123', { 'font-size': '24px' });
  assert.match(script, /document\.querySelector/);
  assert.match(script, /data-page-tweaker-target/);
  assert.match(script, /font-size/);
});

test('keeps an existing file URL intact instead of nesting file schemes', () => {
  const source = 'file:///Users/dane/report.html';
  assert.equal(utils.normalizeSource(source), source);
});
