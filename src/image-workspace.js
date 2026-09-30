function createImageWorkspace(desktopBridge, setStatus, onEdit = () => {}) {
  const workspace = document.querySelector('#imageWorkspace');
  const display = document.querySelector('#iterationDisplay');
  const overlay = document.querySelector('#regionCanvas');
  const context = overlay.getContext('2d');
  const regionList = document.querySelector('#regionList');
  const candidateStatus = document.querySelector('#candidateStatus');
  const resizeCandidateButton = document.querySelector('#resizeCandidate');
  const resultButton = document.querySelector('#toggleResult');
  const saveButton = document.querySelector('#saveResult');
  let original = null;
  let originalPng = '';
  let candidate = null;
  let pendingCandidate = null;
  let merged = null;
  let regions = [];
  let selected = -1;
  let pointer = null;
  let showingMerged = false;

  const dimension = () => original ? { width: original.width, height: original.height } : null;
  const changeRegions = () => regions.filter((region) => region.kind === 'change');
  const blendWidth = () => Number(document.querySelector('#blendWidth').value);
  const instruction = () => document.querySelector('#editInstruction').value.trim();
  const changeInstruction = document.querySelector('#changeInstruction');
  const currentKind = () => document.querySelector('#regionKind').value;
  const protectLabel = () => document.querySelector('#protectLabel').value.trim();

  function reset() {
    original = null; originalPng = ''; candidate = null; pendingCandidate = null; merged = null; regions = []; selected = -1; pointer = null; showingMerged = false;
    display.removeAttribute('src'); candidateStatus.textContent = ''; regionList.replaceChildren(); resultButton.disabled = true; saveButton.disabled = true;
    resizeCandidateButton.hidden = true;
    document.querySelector('#editInstruction').value = ''; changeInstruction.value = ''; document.querySelector('#regionKind').value = 'change'; document.querySelector('#protectLabel').value = '';
    document.querySelector('#blendWidth').value = '12'; document.querySelector('#blendWidthValue').value = '12 px'; document.querySelector('#protectLabelRow').hidden = true; document.querySelector('#changeInstructionRow').hidden = true;
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
      const label = `${region.kind === 'change' ? `CHANGE ${index + 1}` : 'KEEP EXACTLY'} ${region.kind === 'change' ? (region.instruction || '').trim().slice(0, 34) : region.label || ''}`.trim();
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
    const selectedInstruction = selected >= 0 && regions[selected]?.kind === 'change' ? regions[selected].instruction || '' : '';
    if (changeInstruction.value !== selectedInstruction) changeInstruction.value = selectedInstruction;
    document.querySelector('#changeInstructionRow').hidden = selected < 0 || regions[selected]?.kind !== 'change';
    if (selected >= 0 && regions[selected]?.kind === 'protect') document.querySelector('#protectLabel').value = regions[selected].label;
    document.querySelector('#protectLabelRow').hidden = currentKind() !== 'protect' && regions[selected]?.kind !== 'protect';
    regions.forEach((region, index) => {
      const item = document.createElement('div'); item.className = `region-item${selected === index ? ' active' : ''}`;
      const title = document.createElement('strong'); title.textContent = `${index + 1}. ${region.kind === 'change' ? 'Change' : 'Keep exactly'}${region.kind === 'change' ? `: ${region.instruction || 'Describe this change'}` : region.label ? `: ${region.label}` : ''}`;
      const detail = document.createElement('small'); detail.textContent = region.kind === 'change' ? 'Click to edit this box’s instructions. Drag or use arrow keys to adjust.' : 'Click to select, then drag or use arrow keys.';
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
      regions.push({ kind: currentKind(), label: currentKind() === 'protect' ? protectLabel() : '', instruction: '', x: p.x, y: p.y, width: 0, height: 0 });
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
    pointer = null; renderList(); draw(); onEdit();
    if (candidate && changeRegions().length) compose();
    const protect = regions.filter((item) => item.kind === 'protect');
    if (changeRegions().some((change) => protect.some((item) => ImageIteration.overlaps(change, item)))) setStatus('A protected box overlaps a change box. The protected pixels win; inspect the boundary for a visible seam.');
  }
  overlay.addEventListener('pointerup', finishPointer);
  overlay.addEventListener('pointercancel', finishPointer);
  document.querySelector('#protectLabel').addEventListener('input', (event) => { if (selected < 0 || regions[selected].kind !== 'protect') return; regions[selected].label = event.target.value.trim(); renderList(); draw(); onEdit(); });
  changeInstruction.addEventListener('input', (event) => { if (selected < 0 || regions[selected].kind !== 'change') return; regions[selected].instruction = event.target.value; renderList(); draw(); onEdit(); });
  document.querySelector('#editInstruction').addEventListener('input', onEdit);

  overlay.addEventListener('keydown', (event) => {
    if (selected < 0 || !original || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault(); const amount = event.shiftKey ? 10 : 1, region = regions[selected];
    const dx = (event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0) / original.width;
    const dy = (event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0) / original.height;
    region.x = ImageIteration.clamp(region.x + dx, 0, 1 - region.width); region.y = ImageIteration.clamp(region.y + dy, 0, 1 - region.height);
    invalidate(); draw(); if (candidate) compose(); onEdit();
  });

  document.querySelector('#regionKind').addEventListener('change', () => { selected = -1; renderList(); draw(); });
  document.querySelector('#blendWidth').addEventListener('input', (event) => { document.querySelector('#blendWidthValue').value = `${event.target.value} px`; invalidate(); draw(); if (candidate) compose(); onEdit(); });
  document.querySelector('#undoRegion').addEventListener('click', () => { if (!regions.length) return; regions.pop(); selected = -1; invalidate(); renderList(); draw(); if (candidate && changeRegions().length) compose(); onEdit(); });
  document.querySelector('#removeRegion').addEventListener('click', () => { if (selected < 0) return; regions.splice(selected, 1); selected = -1; invalidate(); renderList(); draw(); if (candidate && changeRegions().length) compose(); onEdit(); });

  async function loadCandidate(source) {
    if (!original) return setStatus('Open a local source image first.');
    candidate = null; pendingCandidate = null; merged = null; showingMerged = false;
    resultButton.disabled = true; saveButton.disabled = true; resizeCandidateButton.hidden = true; display.src = originalPng;
    try {
      const image = await decode(await desktopBridge.readImage(source));
      if (image.width !== original.width || image.height !== original.height) {
        const sameShape = Math.abs(image.width / image.height - original.width / original.height) <= original.width / original.height * .01;
        pendingCandidate = sameShape ? image : null;
        resizeCandidateButton.hidden = !sameShape;
        const message = `The returned file decodes to ${image.width} × ${image.height} pixels; the original is ${original.width} × ${original.height}. The AI's stated size may differ from the file it exported. ${sameShape ? 'You can resize a copy here and merge it, but inspect alignment and the blend edge.' : 'Ask the AI for an export with the exact original width and height; this different shape cannot be merged safely.'}`;
        candidateStatus.textContent = message; setStatus(message); return;
      }
      candidate = image; compose();
    } catch (error) { candidateStatus.textContent = error.message; setStatus(error.message); }
  }
  resizeCandidateButton.addEventListener('click', () => {
    if (!original || !pendingCandidate) return;
    const sourceSize = `${pendingCandidate.width} × ${pendingCandidate.height}`;
    const resized = document.createElement('canvas'); resized.width = original.width; resized.height = original.height;
    const ctx = resized.getContext('2d', { willReadFrequently: true }); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(pendingCandidate, 0, 0, resized.width, resized.height);
    candidate = resized; pendingCandidate = null; resizeCandidateButton.hidden = true; compose();
    candidateStatus.textContent = `Resized a copy from ${sourceSize} to ${original.width} × ${original.height} and merged locally. Protected pixels came from the original. Inspect object alignment and the blend edge before saving.`;
  });
  const candidateDrop = document.querySelector('#candidateDrop');
  document.querySelector('#pasteCandidate').addEventListener('click', async () => {
    try {
      const source = await desktopBridge.clipboardImage();
      if (!source) {
        const message = 'The clipboard has no image pixels. Copy the rendered image itself, or download it and use the drop target.';
        candidateStatus.textContent = message; setStatus(message); return;
      }
      await loadCandidate(source);
    } catch (error) { candidateStatus.textContent = `Could not paste the copied image: ${error.message}`; setStatus(candidateStatus.textContent); }
  });
  candidateDrop.addEventListener('click', async () => { const source = await desktopBridge.chooseImage(); if (source) loadCandidate(source); });
  candidateDrop.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); candidateDrop.click(); } });
  candidateDrop.addEventListener('dragenter', (event) => { event.preventDefault(); event.stopPropagation(); candidateDrop.classList.add('drag-over'); });
  candidateDrop.addEventListener('dragover', (event) => { event.preventDefault(); event.stopPropagation(); candidateDrop.classList.add('drag-over'); });
  candidateDrop.addEventListener('dragleave', () => candidateDrop.classList.remove('drag-over'));
  candidateDrop.addEventListener('drop', (event) => { event.preventDefault(); event.stopPropagation(); candidateDrop.classList.remove('drag-over'); const file = event.dataTransfer.files[0]; if (file) loadCandidate(desktopBridge.pathForFile(file)); });
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
    const missing = regions.findIndex((region) => region.kind === 'change' && !region.instruction.trim());
    if (missing >= 0) throw new Error(`Select change box ${missing + 1} and describe what should change there.`);
    const labels = regions.filter((region) => region.kind === 'protect').map((region) => region.label || 'the marked protected detail');
    const changes = regions.map((region, index) => region.kind === 'change' ? `- Change box ${index + 1}: ${region.instruction.trim()}` : '').filter(Boolean).join('\n');
    const prompt = `# Image iteration instructions\n\nEdit the attached original.png. ${instruction() ? `Overall direction: ${instruction()}\n\n` : ''}Requested changes by numbered box:\n${changes}\n\nUse marked-preview.png to locate each numbered box. edit-mask.png is transparent wherever editing is allowed, including the blend margin, and opaque where the source should be preserved. Check your image tool’s mask convention and convert the mask if needed. The boxes are rough guidance, not object contours. Do not reproduce the colored boxes or labels in the output.\n\nMake each requested change only in its corresponding box. Use the ${blendWidth()}-pixel blend margin for a natural transition of edges, texture, lighting, and shadows. Preserve the composition and content elsewhere. Keep these specifically marked details unchanged: ${labels.length ? labels.join('; ') : 'none separately marked; all unmarked areas should remain unchanged'}. Keep the output at exactly ${original.width} × ${original.height} pixels, with no crop, shift, or rescaling.\n\nBefore returning the result, check the actual exported image file's pixel dimensions. The file itself must be exactly ${original.width} pixels wide and ${original.height} pixels high. A preview size or a statement in the chat does not count. If your image tool cannot export those exact dimensions, say so and return its native-size file rather than claiming an exact-size result.\n\nA mask guides the image model but does not guarantee exact pixel preservation. If the user wants exact restoration, they can optionally bring the edited image back into PageTweaker to merge it locally with the original. PageTweaker can offer an optional resize for a same-shape file with different dimensions, but that may misalign details and requires visual inspection. If your tool cannot use a mask, use the preview and these instructions, and state that the model’s output may change areas outside the marked region. The user should inspect the blend edge after any local merge.`;
    return {
      prompt,
      meta: { original: 'original.png', editMask: 'edit-mask.png', markedPreview: 'marked-preview.png', width: original.width, height: original.height, blendPixels: blendWidth(), overallDirection: instruction(), regions: regions.map((region) => ({ ...region, instruction: region.instruction.trim() })) },
      assets: { 'original.png': originalPng, 'edit-mask.png': makeMask(), 'marked-preview.png': makePreview() }
    };
  }

  return { reset, loadSource, loadCandidate, setActive, resize, hasWork: () => Boolean(regions.length || instruction()), makeHandoff, hasChange: () => changeRegions().length > 0, readyForHandoff: () => changeRegions().length > 0 && changeRegions().every((region) => Boolean(region.instruction.trim())) };
}
