# PageTweaker Current State

**Last verified:** 2026-09-04  
**Current release:** `v0.1.15`  
**Release:** <https://github.com/DaneShakespear/page-tweaker/releases/tag/v0.1.15>

## Agent Startup

Before continuing work, read this file and the root `AGENTS.md`. The latest unreleased work is focused on making authenticated pages and Chrome handoff less painful.

## Product state

PageTweaker is a working public macOS Electron application for previewing visual changes to local HTML artifacts and public web pages. The original artifact remains untouched. The user can select an element, test visual adjustments, attach explanation, and export a portable implementation handoff.

The current interaction model is:

1. Open or drop a local HTML artifact, `file://` URL, Safari `.webloc`, public URL, app URL handler target, or Chrome bookmarklet target.
2. Choose desktop, tablet, or mobile, then click an exact DOM element. Exact-element scope is always the default.
3. Optionally widen visual changes through the bottom selector bar to a repeated CSS class or all matching tags, such as all `h1` elements.
4. Preview typography, spacing, text color, background, and text changes immediately.
5. Reset an individual property or restore the active selector to its original values.
6. Pin an exact-element note or use the separate Markup tab for drawing.
7. Create one AI handoff ZIP, then drag its in-app file icon into an AI chat or copy the selectable full path.

Text replacement and pinned notes remain exact-element actions even when a broader visual selector is active. This prevents one heading's content from being copied across every matching heading.

## v0.1.15 changes

- Added a persistent Inspector tip and live status guidance explaining that page controls work normally and Option-click selects them for tweaking.
- Reworked the Chrome bookmarklet into a shortcut-style draggable item with an illustrated Chrome bookmarks-bar target and clearer drag/copy instructions.
- Added Help guidance for interactive controls, protected pages, and the password-manager boundary.
- Added privacy-safe failed-request diagnostics that report only the failing origin and Electron network error, never passwords, request bodies, query strings, or tokens.
- Verified a successful real login at `https://portal.kre8media.com/` inside packaged PageTweaker. The protected session path works without weakening web security.

## v0.1.14 changes

- Changed the preview webview partition from `page-tweaker-public` to `persist:page-tweaker-public`, so PageTweaker has a durable Electron browser profile and can retain cookies after a user logs into a site inside PageTweaker.
- Updated the injected page bridge so common interactive controls pass through normally: links, buttons, inputs, textareas, selects, options, labels, summaries, contenteditable elements, and common ARIA controls.
- Added Option-click behavior for interactive controls: a normal click uses the page, while Option-click selects the control for PageTweaker inspection/tweaking.
- Added a draggable Chrome bookmarklet in the Help panel. Users can drag `Open in PageTweaker` to Chrome's bookmarks bar, then click it on any page to launch PageTweaker with that tab's URL.
- Added a click fallback that copies the bookmarklet launcher code for manual bookmark creation.
- Updated install/troubleshooting docs for authenticated pages and login-form behavior.
- Added regression tests covering the persistent partition, interactive-control pass-through, and bookmarklet markup.
- Verified `npm test`: 21 of 21 tests passing.

## Chrome Interaction Decision

Do not implement direct Chrome cookie copying into Electron. It is fragile, security-sensitive, profile-dependent, and likely to break across Chrome/macOS updates.

The chosen near-term direction is bookmarklet-first:

- PageTweaker exposes a draggable bookmarklet in the Help panel.
- The bookmarklet URL is `javascript:location.href='page-tweaker://open?url='+encodeURIComponent(location.href)`.
- The bookmarklet uses the existing `page-tweaker://` handler to launch the app from Chrome's current tab.
- This removes most copy/paste, drag-to-app, and "remember to open the Mac app" friction without asking users to install a Chrome extension.

A Chrome extension remains the later power-user path only if richer authenticated capture is needed:

- Chrome extension toolbar action: open the active Chrome tab in PageTweaker.
- Chrome context menu action: open or capture the current page in PageTweaker.
- Launch mechanism: use the existing `page-tweaker://` URL handler, with the current page URL encoded as a parameter.
- Authenticated capture mode: run in the already logged-in Chrome tab and package page context for PageTweaker instead of requiring PageTweaker to load the URL with Chrome's cookies.

This solves two user problems:

- Users do not need to remember to open PageTweaker separately or drag/copy URLs from Chrome.
- Users get a no-extension path now, while keeping the door open to a deeper Chrome integration later.

## Planned Chrome/Browser Work

Near-term bookmarklet follow-up:

- Manually verify dragging the bookmarklet from PageTweaker Help to Chrome's bookmarks bar.
- Manually verify clicking the bookmarklet on `https://example.com` opens PageTweaker through `page-tweaker://open?url=...`.
- Manually verify clicking the bookmarklet on a logged-in page opens the matching URL in PageTweaker and uses PageTweaker's own persistent session if that site has already been logged into there.
- Consider adding a click fallback that copies the bookmarklet code if clicking the link inside Electron is confusing.

Later capture-package behavior:

- Add a content script or injected script that captures URL, title, viewport, screenshot, selected DOM snapshot, and needed style evidence from the logged-in Chrome tab.
- Send that package to PageTweaker through a local/native channel or a temporary file opened by PageTweaker.
- Keep credentials, cookies, and auth tokens out of the package.

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
- Registered the installed app as an alternate HTTP, HTTPS, file, and PageTweaker URL handler without changing the system default browser.
- Replaced the screenshot-dependent export dialog with an automatic single-file handoff saved under `Downloads/PageTweaker Handoffs`.
- Added a Handoff tab with a native draggable file icon, selectable full path, Copy Path, and Show in Finder.
- Added `START-HERE.md` so the receiving AI understands that the ZIP is the complete brief, including previewed values, locators, notes, markup meaning, and drawing data.
- Added desktop, tablet, and mobile preview controls. Edits, text outcomes, pinned notes, and markup are stored and reapplied only at their recorded breakpoint.
- Attached each markup line to its own explanation, breakpoint, document coordinates, and nearby element locator; drawings now move with the page while scrolling.
- Rebuilt Inspector control rows so every Reset button explicitly names and restores one property without appearing attached to a neighboring control.
- Added native right-click Copy, Cut, Paste, and Select All context menus.
- Rewrote beginner-facing Help and the AI brief. Selectors and preview values are explicitly outcome evidence, not instructions to paste code or replace the real system architecture.
- Replaced breakpoint glyphs with standard monitor, tablet, and smartphone SVG icons.
- Made property reset refresh only its own Inspector control while leaving every other slider, color, and preview change untouched.
- Replaced breakpoint reloads with an acknowledged in-place restore/apply cycle. Exact-element and repeated-selector changes now remain isolated and persistent across size switches.
- Fixed exact locators that incorrectly began with `html:nth-of-type(0)` and therefore could not be restored.
- Replaced context-free markup overlays with full annotated page screenshots for each visited breakpoint.
- Standardized the visible product name and packaged app name as `PageTweaker`.
- Replaced the opaque square icon canvas with a real-alpha transparent master used by the app, DMG, Help, and handoff surfaces.
- Added synchronized hex fields beside the text and background color pickers. Pasted 3- or 6-digit hex values update the preview immediately.
- Made replacement text update in the preview while the user types; the separate Apply button is no longer required.

## Verification evidence

- `npm test`: 22 of 22 tests passing.
- Packaged Electron smoke: interactive-control pass-through, Option-click selection, bookmarklet copying and protocol launch, persistent preview storage across a complete app relaunch, native window drag, breakpoint persistence, property-specific reset, clean reload, markup, local/public/file loading, ZIP inspection, annotated screenshots, and AI handoff passed.
- `hdiutil verify`: v0.1.15 DMG valid.
- Mounted-app `codesign --verify --deep --strict`: passed.
- Local and downloaded GitHub v0.1.15 DMG SHA-256 match: `37c79b3d9548fe208738e6afc6a56812f6db5f868bcdcef4a4a3542d570c1e68`.
- GitHub v0.1.15 is public with the DMG and blockmap assets.

## Architecture that matters

- `src/main.cjs`: Electron lifecycle, file/URL opening, `.webloc` resolution, version bridge, and export writes.
- `src/index.html`: app shell, toolbar, webview, side panels, persistent webview partition, and Chrome bookmarklet UI.
- `src/shell-preload.cjs`: safe shell IPC surface.
- `src/page-preload.cjs`: exact clicked-node markers, interactive-control pass-through, selector-scope discovery, scroll position reporting, live edit application, and original-value restoration inside the loaded page.
- `src/renderer.js`: session state, confirmation-safe loading, selector UI, live controls, notes, markup, screenshot composition, and export handoff.
- `scripts/after-pack.cjs`: ad-hoc signs the packaged macOS app and verifies the signature.
- `scripts/smoke-ui.cjs`: launches the packaged app and validates critical Electron/webview interactions through the Chromium debugging protocol.

## Current limitations

- The app is ad-hoc signed, not Developer ID signed or Apple notarized. On macOS 26.5.2, Gatekeeper can leave v0.1.15 stalled at `_dyld_start` even when the bundle passes local `codesign` verification; no local bypass is confirmed. Restart the Mac before retesting a per-app approval. Do not publish another release until it is Developer ID signed, notarized, and stapled, then independently assessed with `spctl --assess` from a fresh download.
- PageTweaker does not inherit Chrome/Safari cookies or authenticated browser sessions.
- PageTweaker can now retain its own login cookies after a user signs in inside PageTweaker, but this is separate from Chrome's profile.
- Electron does not provide Chrome or Safari password-manager extension UI inside the PageTweaker webview. Use the password manager's standalone app or menu to copy and paste credentials; PageTweaker must not become a credential vault.
- The bookmarklet sends the current URL only. It does not capture Chrome's logged-in DOM, cookies, localStorage, IndexedDB, or auth tokens.
- Preview changes exist only in the current session and export bundle. They do not modify source code.
- Annotated screenshots capture the visible viewport at each visited breakpoint. Very long content outside that viewport remains represented through selectors, notes, drawing coordinates, and structured evidence rather than a stitched full-page image.
- The repository does not yet grant an open-source license.
- The README still uses a concept render; a real product screenshot walkthrough remains planned.

## Next-session starting point

Start by reading this file and `AGENTS.md`. Begin with packaged v0.1.15. Manually validate dragging the bookmarklet to Chrome's bookmarks bar on representative public and protected pages. If the bookmarklet is not enough, plan the Chrome extension only for richer authenticated capture. Before publishing another release, run `npm test`, `npm run package:mac`, and `npm run smoke:ui`.

## 2026-09-04 login diagnostic

- The affected page is `https://portal.kre8media.com/`.
- Packaged v0.1.14 submitted the real form with a deliberately invalid diagnostic password and received the expected `Incorrect password` response. This verifies normal form pass-through and production login endpoint reachability from PageTweaker.
- Before final confirmation, the reported failure appeared limited to the successful-login response/session path. Diagnostics were restricted to the origin and Electron network error and never captured credentials or request bodies.
- Web security and portal session protection were left unchanged.
- A subsequent user-entered valid login succeeded in packaged PageTweaker. The login hot issue is resolved; no compatibility workaround or security change was needed.
