# Page Tweaker Project Compass

## What this is

Page Tweaker is a public macOS Electron app for visual QA of local HTML artifacts and public web pages. It supports preview-only element edits, pinned notes, drawing markup, and portable AI/developer handoff bundles. It never modifies the opened source artifact.

## Authority

- Durable project meaning and decisions: `06-PROJECTS/Page-Tweaker.md` in the Brain Vault.
- Current implementation and release evidence: this repository.
- Public distribution: <https://github.com/DaneShakespear/page-tweaker/releases/latest>.
- Brain Search is retrieval only. It is not the project record.

## Current state

- Status: active local product.
- Workspace: `/Users/daneshakespear/Workspace/Page Tweaker App`.
- Repository: <https://github.com/DaneShakespear/page-tweaker>.
- Current release: `v0.1.11`, Apple Silicon DMG.
- Visible releases: `v0.1.11` only.
- Release signing: ad-hoc signed and strict-signature verified; not Developer ID signed or Apple notarized.
- Current release commit: `1d2416f`.
- DMG SHA-256: `f7ba4bde5bc3d918d9d291e5713f886997d15e5aa11900d87a38a23f06645256`.

## Current objective

Stabilize the approved v1 interaction boundary through testing of the packaged Electron app. Keep the workflow simple: open, select, preview, explain, export.

## Next meaningful action

Test `v0.1.11` across representative responsive pages and AI chats. Confirm breakpoint-specific feedback is interpreted as desired outcomes rather than prescribed implementation code.

## Approved v1 boundary

- Local `.html`/`.htm` artifacts, `file://` URLs, Safari `.webloc` files, and public `http(s)` URLs.
- Exact-element editing by default, with deliberate class-wide or tag-wide style scope.
- Immediate preview-only typography, spacing, color, background, and text changes.
- Desktop, tablet, and mobile preview contexts with breakpoint-scoped edits and feedback.
- Pinned notes attached to the exact clicked element.
- Freehand markup with color, thickness, undo, individual removal, and clear-all controls.
- One draggable AI handoff ZIP containing structured JSON, a `START-HERE.md` implementation brief, and a markup overlay when drawings or pins exist.

## Non-goals

- Modifying source files in place.
- Becoming a full browser, page builder, CMS, or deployment tool.
- Reusing browser profiles, cookies, or authenticated sessions.
- Claiming Apple notarization before a Developer ID and notarization workflow exists.

## Read first

1. `docs/CURRENT-STATE.md`
2. `README.md`
3. `docs/INSTALLING.md`
4. `src/page-preload.cjs` and `src/renderer.js` for interaction work
5. `scripts/smoke-ui.cjs` for packaged-app regression testing
