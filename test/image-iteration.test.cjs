const test = require('node:test');
const assert = require('node:assert/strict');
const { blend, editStrength } = require('../src/image-iteration.js');

test('image iteration restores exact original pixels in protected and unmarked areas', () => {
  const width = 10, height = 10;
  const original = new Uint8ClampedArray(width * height * 4);
  const candidate = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < original.length; index += 4) {
    original.set([10, 20, 30, 255], index);
    candidate.set([210, 120, 80, 255], index);
  }
  const regions = [
    { kind: 'change', x: .2, y: .2, width: .6, height: .6 },
    { kind: 'protect', x: .4, y: .4, width: .2, height: .2 }
  ];
  const result = blend(original, candidate, width, height, regions, 1);
  const pixel = (x, y) => [...result.slice((y * width + x) * 4, (y * width + x) * 4 + 4)];
  assert.deepEqual(pixel(0, 0), [10, 20, 30, 255]);
  assert.deepEqual(pixel(3, 3), [210, 120, 80, 255]);
  assert.deepEqual(pixel(4, 4), [10, 20, 30, 255]);
  assert.deepEqual(pixel(9, 9), [10, 20, 30, 255]);
});

test('blend margin changes only transition pixels and never a protected box', () => {
  const regions = [
    { kind: 'change', x: .3, y: .3, width: .4, height: .4 },
    { kind: 'protect', x: .1, y: .3, width: .1, height: .4 }
  ];
  assert.equal(editStrength(5, 5, 10, 10, regions, 2), 1);
  assert.equal(editStrength(2, 5, 10, 10, regions, 2), .5);
  assert.equal(editStrength(1.5, 5, 10, 10, regions, 2), 0);
  assert.equal(editStrength(.5, .5, 10, 10, regions, 2), 0);
});
