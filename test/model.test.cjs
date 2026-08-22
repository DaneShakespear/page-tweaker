const test = require('node:test');
const assert = require('node:assert/strict');
const { makePrompt, cssValue } = require('../src/model.cjs');
test('normalizes visual control values into CSS', () => { assert.equal(cssValue('font-size', 24), '24px'); assert.equal(cssValue('line-height', 1.25), '1.25'); assert.equal(cssValue('color', '#ffffff'), '#ffffff'); });
test('makes an actionable handoff prompt', () => { const prompt = makePrompt({ source: '/tmp/report.html', cssTweaks: [{}], textChanges: [], notes: [{}] }); assert.match(prompt, /report.html/); assert.match(prompt, /CSS tweaks: 1/); assert.match(prompt, /annotated.png/); });
