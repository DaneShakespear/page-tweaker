const ImageIteration = (() => {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const bounds = (region, width, height) => ({
    left: region.x * width,
    top: region.y * height,
    right: (region.x + region.width) * width,
    bottom: (region.y + region.height) * height
  });

  const prepare = (regions, width, height) => regions.map((region) => ({ kind: region.kind, ...bounds(region, width, height) }));

  function preparedStrength(x, y, regions, blendPixels) {
    for (const box of regions) if (box.kind === 'protect' && x >= box.left && x < box.right && y >= box.top && y < box.bottom) return 0;
    let strength = 0;
    for (const box of regions) {
      if (box.kind !== 'change') continue;
      const dx = Math.max(box.left - x, 0, x - box.right);
      const dy = Math.max(box.top - y, 0, y - box.bottom);
      const distance = Math.hypot(dx, dy);
      strength = Math.max(strength, blendPixels ? clamp(1 - distance / blendPixels, 0, 1) : distance === 0 ? 1 : 0);
    }
    return strength;
  }

  function editStrength(x, y, width, height, regions, blendPixels) {
    return preparedStrength(x, y, prepare(regions, width, height), blendPixels);
  }

  function blend(base, candidate, width, height, regions, blendPixels) {
    if (base.length !== candidate.length || base.length !== width * height * 4) throw new Error('Both images must have the same pixel dimensions.');
    const output = new Uint8ClampedArray(base.length);
    const prepared = prepare(regions, width, height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const strength = preparedStrength(x + .5, y + .5, prepared, blendPixels);
      for (let channel = 0; channel < 4; channel++) output[index + channel] = Math.round(base[index + channel] * (1 - strength) + candidate[index + channel] * strength);
    }
    return output;
  }

  function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  return { blend, editStrength, preparedStrength, prepare, overlaps, clamp };
})();
if (typeof module !== 'undefined') module.exports = ImageIteration;
