const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('the empty-state overlay is removed after it is hidden', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.css'), 'utf8');
  assert.match(css, /#empty\[hidden\]\s*\{\s*display\s*:\s*none\s*\}/);
});
