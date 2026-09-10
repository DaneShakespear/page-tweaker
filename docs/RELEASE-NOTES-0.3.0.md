# AI PagePolish by PageTweaker v0.3.0

This release makes visual feedback faster and keeps code out of the way.

## What changed

- The Inspector's **Replace text** field now shows readable visible text instead of the selected element's HTML. Edit any part normally, or add simple formatting such as `<br>`, `<strong>`, and `<em>` when useful.
- Markup now includes freehand drawing, straight lines, arrows, rectangles, and circles.
- Every exported shape keeps its tool type, position, color, thickness, and explanation so the receiving AI has complete visual context.
- The app title now gives `AI PagePolish` clear visual priority while retaining `by PageTweaker` as attribution.
- The startup screen now leads with the simpler promise: **Stop explaining. Show your AI.**
- Startup spacing is more generous around the drop target and headline.

The original page is never modified. Handoff files remain outcome evidence for the AI, not code to paste blindly.

## Verification

- 31 of 31 contract tests pass.
- Packaged native smoke verifies readable replacement text, typed safe formatting, markup-tool selection, exported arrow evidence, and the complete handoff workflow.
- Strict ad-hoc signature verification and DMG integrity verification pass.
- DMG SHA-256: `45e81e54ce380b867c890e26b325932b1b74c215c92e71b4fc00984f40c91cb9`.
- Blockmap SHA-256: `6d3219c02fd59e733c619fa0f87819323b8bd5b4efd0903cd373c1f6859ab032`.
