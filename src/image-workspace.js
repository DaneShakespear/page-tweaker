function createImageWorkspace(desktopBridge, setStatus) {
  const workspace = document.querySelector('#imageWorkspace');
  const display = document.querySelector('#iterationDisplay');
  const overlay = document.querySelector('#regionCanvas');
  const context = overlay.getContext('2d');
  const regionList = document.querySelector('#regionList');
  const candidateStatus = document.querySelector('#candidateStatus');
  const resultButton = document.querySelector('#toggleResult');
  const saveButton = document.querySelector('#saveResult');
  let original = null;
  let originalPng = '';
  let candidate = null;
  let merged = null;
  let regions = [];
  let selected = -1;
  let pointer = null;
  let showingMerged = false;

  const dimension = () => original ? { width: original.width, height: original.height } : null;
  const changeRegions = () => regions.filter((region) => region.kind === 'change');
  const blendWidth = () => Number(document.querySelector('#blendWidth').value);
  const instruction = () => document.querySelector('#editInstruction').value.trim();
  const currentKind = () => document.querySelector('#regionKind').value;
  const protectLabel = () => document.querySelector('#protectLabel').value.trim();

  function reset() {
    original = null; originalPng = ''; candidate = null; merged = null; regions = []; selected = -1; pointer = null; showingMerged = false;
    display.removeAttribute('src'); candidateStatus.textContent = ''; regionList.replaceChildren(); resultButton.disabled = true; saveButton.disabled = true;
    document.querySelector('#editInstruction').value = ''; document.querySelector('#regionKind').value = 'change'; document.querySelector('#protectLabel').value = '';
    document.querySelector('#blendWidth').value = '12'; document.querySelector('#blendWidthValue').value = '12 px'; document.querySelector('#protectLabelRow').hidden = true;
    draw();
  }

  async function decode(data) {
    const image = new Image(); image.src = data; await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('The image has no usable pixels.');
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    canvas.getContext('2d', { willReadFrequently: true }).drawImage(image, 0, 0);
    return canvas;
  }

  async function loadSource(source) {
    reset();
    try {
      original = await decode(await desktopBridge.readImage(source));
      originalPng = original.toDataURL('image/png'); display.src = originalPng;
      await display.decode(); resize();
      candidateStatus.textContent = `Original image: ${original.width} × ${original.height} pixels.`;
    } catch (error) {
      candidateStatus.textContent = `Image iteration needs a local image: ${error.message}`;
      setStatus(candidateStatus.textContent);
    }
  }

  function setActive(active) {
    workspace.hidden = !active;
    document.querySelector('#stage').classList.toggle('image-editing', active);
    if (active) requestAnimationFrame(resize);
  }

  function resize() {
    if (workspace.hidden || !original || !display.complete) return;
    const scale = Math.min((workspace.clientWidth - 32) / original.width, (workspace.clientHeight - 32) / original.height, 4);
    display.style.width = `${Math.round(original.width * scale)}px`;
    display.style.height = `${Math.round(original.height * scale)}px`;
    const imageBox = display.getBoundingClientRect();
    const workspaceBox = workspace.getBoundingClientRect();
    overlay.style.left = `${imageBox.left - workspaceBox.left}px`;
    overlay.style.top = `${imageBox.top - workspaceBox.top}px`;
    overlay.style.width = `${imageBox.width}px`;
    overlay.style.height = `${imageBox.height}px`;
    overlay.width = Math.max(1, Math.round(imageBox.width * devicePixelRatio));
    overlay.height = Math.max(1, Math.round(imageBox.height * devicePixelRatio));
    context.setTransform(overlay.width / imageBox.width, 0, 0, overlay.height / imageBox.height, 0, 0);
    draw();
  }

  function paintRegions(ctx, width, height, handles = false) {
    const scale = original ? width / original.width : 1;
    regions.forEach((region, index) => {
      const x = region.x * width, y = region.y * height, w = region.width * width, h = region.height * height;
      const color = region.kind === 'change' ? '#64d7ff' : '#ffca56';
      if (region.kind === 'change' && blendWidth()) {
        const margin = blendWidth() * scale;
        ctx.save(); ctx.setLineDash([7, 5]); ctx.strokeStyle = '#b4ecff'; ctx.lineWidth = 2;
        ctx.strokeRect(x - margin, y - margin, w + margin * 2, h + margin * 2); ctx.restore();
      }
      ctx.fillStyle = region.kind === 'change' ? 'rgba(100,215,255,.16)' : 'rgba(255,202,86,.16)'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = color; ctx.lineWidth = index === selected && handles ? 3 : 2; ctx.strokeRect(x, y, w, h);
      const label = `${region.kind === 'change' ? 'CHANGE' : 'KEEP EXACTLY'} ${region.label || ''}`.trim();
      ctx.font = `${Math.max(12, 13 * scale)}px sans-serif`;
      const labelWidth = Math.min(ctx.measureText(label).width + 12, Math.max(w, 90));
      ctx.fillStyle = '#111318'; ctx.fillRect(x, Math.max(0, y - 22), labelWidth, 21);
      ctx.fillStyle = color; ctx.fillText(label, x + 5, Math.max(14, y - 7), labelWidth - 8);
      if (index === selected && handles) {
        for (const [hx, hy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
          ctx.fillStyle = '#fff'; ctx.fillRect(hx - 5, hy - 5, 10, 10);
          ctx.strokeStyle = color; ctx.strokeRect(hx - 5, hy - 5, 10, 10);
        }
      }
    });
  }

  function draw() {
    if (!overlay.width || !overlay.height) return;
    const rect = overlay.getBoundingClientRect();
    context.clearRect(0, 0, rect.width, rect.height);
    if (original) paintRegions(context, rect.width, rect.height, true);
  }

  function renderList() {
    regionList.replaceChildren();
    if (selected >= 0 && regions[selected]?.kind === 'protect') document.querySelector('#protectLabel').value = regions[selected].label;
    document.querySelector('#protectLabelRow').hidden = currentKind() !== 'protect' && regions[selected]?.kind !== 'protect';
    regions.forEach((region, index) => {
      const item = document.createElement('div'); item.className = `region-item${selected === index ? ' active' : ''}`;
      const title = document.createElement('strong'); title.textContent = `${index + 1}. ${region.kind === 'change' ? 'Change' : 'Keep exactly'}${region.label ? `: ${region.label}` : ''}`;
      const detail = document.createElement('small'); detail.textContent = 'Click to select, then drag or use arrow keys.';
      item.append(title, detail); item.addEventListener('click', () => { selected = index; renderList(); draw(); overlay.focus(); });
      regionList.append(item);
    });
  }

  function point(event) {
    const box = overlay.getBoundingClientRect();
    return { x: ImageIteration.clamp((event.clientX - box.left) / box.width, 0, 1), y: ImageIteration.clamp((event.clientY - box.top) / box.height, 0, 1) };
  }

  function cornerAt(region, p) {
    const box = overlay.getBoundingClientRect();
    const toleranceX = 10 / box.width, toleranceY = 10 / box.height;
    for (const [name, x, y] of [['nw', region.x, region.y], ['ne', region.x + region.width, region.y], ['sw', region.x, region.y + region.height], ['se', region.x + region.width, region.y + region.height]])
      if (Math.abs(p.x - x) <= toleranceX && Math.abs(p.y - y) <= toleranceY) return name;
    return null;
  }

  function invalidate() {
    merged = null; if (showingMerged) display.src = originalPng; showingMerged = false;
    resultButton.disabled = true; saveButton.disabled = true;
    if (candidate) candidateStatus.textContent = 'Regions changed. Review the updated merge after releasing the box.';
  }

  overlay.addEventListener('pointerdown', (event) => {
    if (!original) return;
    const p = point(event);
    let index = selected >= 0 && cornerAt(regions[selected], p) ? selected : -1;
    let mode = index >= 0 ? cornerAt(regions[index], p) : null;
    if (index < 0 && selected >= 0) { const region = regions[selected]; if (p.x >= region.x && p.x <= region.x + region.width && p.y >= region.y && p.y <= region.y + region.height) { index = selected; mode = 'move'; } }
    if (index < 0) {
      index = regions.findLastIndex((region) => region.kind === currentKind() && p.x >= region.x && p.x <= region.x + region.width && p.y >= region.y && p.y <= region.y + region.height);
      if (index >= 0) mode = 'move';
    }
    if (index < 0) {
      regions.push({ kind: currentKind(), label: currentKind() === 'protect' ? protectLabel() : '', x: p.x, y: p.y, width: 0, height: 0 });
      index = regions.length - 1; mode = 'new';
    }
    selected = index; pointer = { mode, start: p, initial: { ...regions[index] }, index };
    overlay.setPointerCapture(event.pointerId); overlay.focus(); renderList(); draw();
  });

  overlay.addEventListener('pointermove', (event) => {
    if (!pointer) return;
    const p = point(event), region = regions[pointer.index], start = pointer.initial;
    if (pointer.mode === 'new') {
      region.x = Math.min(pointer.start.x, p.x); region.y = Math.min(pointer.start.y, p.y);
      region.width = Math.abs(p.x - pointer.start.x); region.height = Math.abs(p.y - pointer.start.y);
    } else if (pointer.mode === 'move') {
      region.x = ImageIteration.clamp(start.x + p.x - pointer.start.x, 0, 1 - start.width);
      region.y = ImageIteration.clamp(start.y + p.y - pointer.start.y, 0, 1 - start.height);
    } else {
      const left = pointer.mode.includes('w') ? p.x : start.x;
      const right = pointer.mode.includes('e') ? p.x : start.x + start.width;
      const top = pointer.mode.includes('n') ? p.y : start.y;
      const bottom = pointer.mode.includes('s') ? p.y : start.y + start.height;
      region.x = Math.min(left, right); region.y = Math.min(top, bottom);
      region.width = Math.abs(right - left); region.height = Math.abs(bottom - top);
    }
    invalidate(); draw();
  });

  function finishPointer() {
    if (!pointer) return;
    const region = regions[pointer.index];
    if (region.width * original.width < 4 || region.height * original.height < 4) { regions.splice(pointer.index, 1); selected = -1; }
    pointer = null; renderList(); draw();
    if (candidate && changeRegions().length) compose();
    const protect = regions.filter((item) => item.kind === 'protect');
    if (changeRegions().some((change) => protect.some((item) => ImageIteration.overlaps(change, item)))) setStatus('A protected box overlaps a change box. The protected pixels win; inspect the boundary for a visible seam.');
  }
  overlay.addEventListener('pointerup', finishPointer);
  overlay.addEventListener('pointercancel', finishPointer);
  document.querySelector('#protectLabel').addEventListener('input', (event) => { if (selected < 0 || regions[selected].kind !== 'protect') return; regions[selected].label = event.target.value.trim(); renderList(); draw(); });

  overlay.addEventListener('keydown', (event) => {
    if (selected < 0 || !original || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault(); const amount = event.shiftKey ? 10 : 1, region = regions[selected];
    const dx = (event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0) / original.width;
    const dy = (event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0) / original.height;
    region.x = ImageIteration.clamp(region.x + dx, 0, 1 - region.width); region.y = ImageIteration.clamp(region.y + dy, 0, 1 - region.height);
    invalidate(); draw(); if (candidate) compose();
  });

  document.querySelector('#regionKind').addEventListener('change', () => { selected = -1; renderList(); draw(); });
  document.querySelector('#blendWidth').addEventListener('input', (event) => { document.querySelector('#blendWidthValue').value = `${event.target.value} px`; invalidate(); draw(); if (candidate) compose(); });
  document.querySelector('#undoRegion').addEventListener('click', () => { if (!regions.length) return; regions.pop(); selected = -1; invalidate(); renderList(); draw(); if (candidate && changeRegions().length) compose(); });
  document.querySelector('#removeRegion').addEventListener('click', () => { if (selected < 0) return; regions.splice(selected, 1); selected = -1; invalidate(); renderList(); draw(); if (candidate && changeRegions().length) compose(); });

  async function loadCandidate(source) {
    if (!original) return setStatus('Open a local source image first.');
    try {
      const image = await decode(await desktopBridge.readImage(source));
      if (image.width !== original.width || image.height !== original.height) throw new Error(`Returned image is ${image.width} × ${image.height}; the original is ${original.width} × ${original.height}. Ask the AI for the original dimensions before merging.`);
      candidate = image; compose();
    } catch (error) { candidateStatus.textContent = error.message; setStatus(error.message); }
  }
  document.querySelector('#chooseCandidate').addEventListener('click', async () => { const source = await desktopBridge.chooseImage(); if (source) loadCandidate(source); });
  workspace.addEventListener('dragenter', (event) => { event.preventDefault(); event.stopPropagation(); document.querySelector('#dropHint').hidden = true; });
  workspace.addEventListener('dragover', (event) => { event.preventDefault(); event.stopPropagation(); });
  workspace.addEventListener('drop', (event) => { event.preventDefault(); event.stopPropagation(); document.querySelector('#dropHint').hidden = true; const file = event.dataTransfer.files[0]; if (file) loadCandidate(desktopBridge.pathForFile(file)); });

  function compose() {
    if (!original || !candidate || !changeRegions().length) { candidateStatus.textContent = 'Mark an area to change before merging.'; return; }
    const width = original.width, height = original.height;
    const base = original.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, width, height);
    const next = candidate.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, width, height);
    const output = ImageIteration.blend(base.data, next.data, width, height, regions, blendWidth());
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d'); const pixels = ctx.createImageData(width, height); pixels.data.set(output); ctx.putImageData(pixels, 0, 0);
    merged = canvas.toDataURL('image/png'); showingMerged = true; display.src = merged; requestAnimationFrame(resize);
    resultButton.disabled = false; saveButton.disabled = false; resultButton.textContent = 'Show original';
    candidateStatus.textContent = 'Merged locally. Protected and unmarked pixels come from the original. Inspect the blend edge before saving.';
  }
  resultButton.addEventListener('click', () => { if (!merged) return; showingMerged = !showingMerged; display.src = showingMerged ? merged : originalPng; resultButton.textContent = showingMerged ? 'Show original' : 'Show merged'; });
  saveButton.addEventListener('click', async () => { if (!merged) return; try { const path = await desktopBridge.saveMergedImage(merged); candidateStatus.textContent = `Merged PNG saved: ${path}`; setStatus('Merged PNG saved. Protected pixels came from the original image.'); } catch (error) { setStatus(`Could not save merged image: ${error.message}`); } });

  function makeMask() {
    const { width, height } = dimension(); const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d'); const pixels = ctx.createImageData(width, height);
    const prepared = ImageIteration.prepare(regions, width, height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4, allowed = ImageIteration.preparedStrength(x + .5, y + .5, prepared, blendWidth()) > 0;
      pixels.data[index + 3] = allowed ? 0 : 255;
    }
    ctx.putImageData(pixels, 0, 0); return canvas.toDataURL('image/png');
  }

  function makePreview() {
    const canvas = document.createElement('canvas'); canvas.width = original.width; canvas.height = original.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(original, 0, 0); paintRegions(ctx, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  }

  function makeHandoff() {
    if (!original) throw new Error('Open a local image before creating an image iteration handoff.');
    if (!changeRegions().length) throw new Error('Draw at least one area to change.');
    if (!instruction()) throw new Error('Describe what should change inside the marked area.');
    const labels = regions.filter((region) => region.kind === 'protect').map((region) => region.label || 'the marked protected detail');
    const prompt = `# Image iteration instructions\n\nEdit the attached original.png. Requested change: ${instruction()}\n\nUse marked-preview.png to understand the user’s boxes. edit-mask.png is transparent wherever editing is allowed, including the blend margin, and opaque where the source should be preserved. Check your image tool’s mask convention and convert the mask if needed. The boxes are rough guidance, not object contours. Do not reproduce the colored boxes or labels in the output.\n\nMake the requested change within the marked area. Use the ${blendWidth()}-pixel blend margin for a natural transition of edges, texture, lighting, and shadows. Preserve the composition and content elsewhere. Keep these specifically marked details unchanged: ${labels.length ? labels.join('; ') : 'none separately marked; all unmarked areas should remain unchanged'}. Keep the output at exactly ${original.width} × ${original.height} pixels, with no crop, shift, or rescaling.\n\nA mask guides the image model but does not guarantee exact pixel preservation. Return the edited image to the user at the original dimensions. PageTweaker will merge the accepted change locally with the original and restore protected pixels. If your tool cannot use a mask, use the preview and these instructions, and state that the model’s output may change areas outside the marked region. The user should inspect the blend edge after local merge.`;
    return {
      prompt,
      meta: { original: 'original.png', editMask: 'edit-mask.png', markedPreview: 'marked-preview.png', width: original.width, height: original.height, blendPixels: blendWidth(), requestedChange: instruction(), regions: regions.map((region) => ({ ...region })) },
      assets: { 'original.png': originalPng, 'edit-mask.png': makeMask(), 'marked-preview.png': makePreview() }
    };
  }

  return { reset, loadSource, loadCandidate, setActive, resize, hasWork: () => Boolean(regions.length || instruction()), makeHandoff, hasChange: () => changeRegions().length > 0 };
}
