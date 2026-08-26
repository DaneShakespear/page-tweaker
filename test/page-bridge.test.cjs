const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('the page bridge receives and acknowledges direct edit requests', () => {
  const bridge = fs.readFileSync(path.join(__dirname, '..', 'src', 'page-preload.cjs'), 'utf8');
  assert.match(bridge, /ipcRenderer\.on\('apply-edit'/);
  assert.match(bridge, /ipcRenderer\.sendToHost\('edit-result'/);
});
