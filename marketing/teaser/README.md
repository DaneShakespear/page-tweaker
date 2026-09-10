# AI PagePolish product teaser

The approved 30-second webpage concept is implemented as real packaged-app captures plus local editorial motion graphics. The sequence opens with “Stop explaining. Show your AI.”, holds the full webpage and Inspector reveal for six seconds, demonstrates the actual headline adjustment, types replacement wording and an arrow explanation, shows a real exported handoff, and closes with the product name and macOS download CTA.

## Deliverables

Files are generated in `out/teaser/` (excluded from Git):

- `ai-pagepolish-teaser.mp4`: muted 1920 × 1080 H.264 video, 30 fps, 30 seconds, fast-start metadata.
- `poster.jpg`: matching poster image.
- `preview.html`: local video player.
- `editable-source.zip`: capture frames, authored demo page, renderer, storyboard, and reproduction notes.
- `capture-verification.json`: actual preview values and exported handoff evidence.
- `contact-sheet.jpg`: representative frames for visual review.

## Reproduce

Use macOS, Python 3 with Pillow, ffmpeg, and the existing packaged v0.3.0 app. No product source changes are needed.

```sh
node marketing/teaser/capture.cjs
python3 marketing/teaser/render.py
python3 marketing/teaser/package.py
```

Capture launches a separate temporary app profile. Rendering happens locally. Real product UI comes from the captures; titles, cursor, and the generic AI composer are editorial graphics. The original demo HTML stays unchanged. The animation does not send an AI message or imply that PagePolish edits or deploys source code.

The final movie masks local file paths. Raw source captures retain the local filming paths and are intended for local editing, not publication. Do not upload the source archive without reviewing it.

## Web embed

Place the MP4 and poster beside your webpage, then use:

```html
<video controls playsinline muted preload="metadata" poster="poster.jpg"
       aria-label="AI PagePolish product overview">
  <source src="ai-pagepolish-teaser.mp4" type="video/mp4">
</video>
```

For a silent looping hero, replace `controls` with `autoplay loop`; retain `muted playsinline`. Respect reduced-motion preferences before enabling autoplay.

The opening title and poster are fully visible from frame zero. The repository README uses a native GitHub video attachment; published assets are also mirrored under `assets/`.
