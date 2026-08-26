# Page Tweaker Current State

**Last verified:** 2026-08-26  
**Current release:** `v0.1.9`  
**Release:** <https://github.com/DaneShakespear/page-tweaker/releases/tag/v0.1.9>

## Product state

Page Tweaker is a working public macOS Electron application for previewing visual changes to local HTML artifacts and public web pages. The original artifact remains untouched. The user can select an element, test visual adjustments, attach explanation, and export a portable implementation handoff.

The current interaction model is:

1. Open or drop a local HTML artifact, `file://` URL, Safari `.webloc`, or public URL.
2. Click an exact DOM element. Exact-element scope is always the default.
3. Optionally widen visual changes through the bottom selector bar to a repeated CSS class or all matching tags, such as all `h1` elements.
4. Preview typography, spacing, text color, background, and text changes immediately.
5. Reset an individual property or restore the active selector to its original values.
6. Pin an exact-element note or use the separate Markup tab for drawing.
7. Export `handoff.json`, `prompt.md`, and `annotated.png` when screenshot capture succeeds.

Text replacement and pinned notes remain exact-element actions even when a broader visual selector is active. This prevents one heading's content from being copied across every matching heading.

## Completed repair sequence

- Repaired the initial macOS app bundle and ad-hoc signing path.
- Removed the empty-state overlay after a page loads so the preview is interactive.
- Added direct local paths, `file://`, public URLs, Enter-to-open, address-bar drop, preview-space drop, and whole-window drop.
- Replaced reconstructed selector execution with exact clicked-node markers through the Electron webview preload bridge.
- Restored immediate live visual changes for sliders, colors, spacing, and typography.
- Restored text changes, pinned notes, freehand annotation, screenshot capture fallback, and portable export.
- Added page-change and reload confirmation with session clearing.
- Made pinned note markers follow their selected element while the preview scrolls.
- Added individual property resets and whole-selector restoration.
- Split Inspect and Markup into explicit tabs.
- Added markup colors, thickness, undo, individual stroke removal, and clear all.
- Added an exact-versus-repeated selector bar with visible affected-element counts.
- Added a visible runtime version and icon tooltips.
- Added `.webloc`, custom app-link, and app-icon opening support.
- Restored native macOS window dragging while keeping the browser-style controls interactive.
- Simplified the top bar to reload, address, file selection, and export; Enter loads the typed target.
- Added a concise How it works tab and a production application icon.
- Added a markup explanation that travels with `handoff.json` and `prompt.md`.
- Registered the installed app as an alternate HTTP, HTTPS, file, and Page Tweaker URL handler without changing the system default browser.

## Verification evidence

- `npm test`: 13 of 13 tests passing.
- Packaged Electron smoke: native window drag, local path, public HTTP URL through Enter, `file://` URL drop, exact/all selector scope, live style editing, scoped reset, true clean reload, markup explanation/removal, and Help tab passed.
- `hdiutil verify`: DMG valid.
- Mounted-app `codesign --verify --deep --strict`: passed.
- Local and hosted DMG SHA-256 match: `6cc132ea382af31a6f527cc427d65e287920a735e0b85d5cb8f630bf4e8e9d36`.
- GitHub assets include the DMG and blockmap.
- `v0.1.9` is the only visible release.

## Architecture that matters

- `src/main.cjs`: Electron lifecycle, file/URL opening, `.webloc` resolution, version bridge, and export writes.
- `src/shell-preload.cjs`: safe shell IPC surface.
- `src/page-preload.cjs`: exact clicked-node markers, selector-scope discovery, scroll position reporting, live edit application, and original-value restoration inside the loaded page.
- `src/renderer.js`: session state, confirmation-safe loading, selector UI, live controls, notes, markup, screenshot composition, and export handoff.
- `scripts/after-pack.cjs`: ad-hoc signs the packaged macOS app and verifies the signature.
- `scripts/smoke-ui.cjs`: launches the packaged app and validates critical Electron/webview interactions through the Chromium debugging protocol.

## Current limitations

- The app is ad-hoc signed, not Developer ID signed or Apple notarized. Gatekeeper may require Control-click > Open or a per-app quarantine removal for a trusted download.
- Public pages only. The app does not inherit Chrome/Safari cookies or authenticated browser sessions.
- Preview changes exist only in the current session and export bundle. They do not modify source code.
- Screenshot capture can fail on some pages; structured JSON and prompt export remain the durable handoff.
- The repository does not yet grant an open-source license.
- The README still uses a concept render; a real product screenshot walkthrough remains planned.

## Next-session starting point

Start from the packaged `v0.1.9` app, not `src/index.html` in a browser. Reproduce any new issue there first. Run `npm test`, `npm run package:mac`, and `npm run smoke:ui` before publishing another release. Keep only the current verified release visible and compare the hosted DMG hash with the local validated artifact.
