# Agent Notes

Before making changes in this repository, read `docs/CURRENT-STATE.md` first. It records the latest product state, verification status, known limitations, and planned next steps.

Current focus: PageTweaker should make Chrome-to-app handoff low friction. Do not pursue direct Chrome cookie copying into Electron. The chosen near-term direction is a draggable Chrome bookmarklet that launches PageTweaker from the current tab through `page-tweaker://open?url=...`. A Chrome extension remains the later path only if richer authenticated page capture is needed.

Important local context:

- The app is an Electron macOS app.
- Source files live under `src/`.
- Packaged artifacts under `dist/` are generated output.
- Use `npm test` for the contract test suite.
- Use `npm run package:mac` and `npm run smoke:ui` before publishing a new release.
- The shell sandbox may start outside the real project root when launched from Xcode. If shell writes fail, confirm the writable root is `/Users/daneshakespear/Workspace/Page Tweaker App` or use Xcode project tools for known files.
