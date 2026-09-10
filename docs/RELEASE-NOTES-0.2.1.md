# AI PagePolish by PageTweaker v0.2.1

This patch makes image feedback clearer and more useful after the image support introduced in v0.2.0.

## Improvements

- Replaces irrelevant typography and spacing controls with **Notes for AI** when a standalone image is open.
- Adds overall image notes to the exported AI handoff.
- Shows compact numbered explanation callouts beside saved markup drawings in the preview and annotated screenshots.
- Uses a normal cursor on images and reserves the crosshair for active Markup mode.
- Adds the requested space between the startup drop label and main headline.

## Verification

- 30 of 30 contract tests pass.
- Packaged native smoke passes, including image-file drop, clipboard screenshot loading, image-only notes, and cursor behavior.
- Strict ad-hoc signature verification and DMG integrity verification pass.
- DMG SHA-256: `569789318870e9b7fe587b38f30a96545536fb5c37f2644997bd8c4552f2612a`.
- Blockmap SHA-256: `4314031e400569235ecdcf9192f1d3ea8c0d570a180a84a656c3cbd20729d251`.
