function makePrompt(handoff) {
  return `# PageTweaker handoff\n\nApply these preview-validated changes to the source artifact. Preserve unrelated work.\n\n- Source: ${handoff.source}\n- CSS tweaks: ${handoff.cssTweaks.length}\n- Text changes: ${handoff.textChanges.length}\n- Notes: ${handoff.notes.length}\n\nRead \`handoff.json\` for element locators and exact values. Review \`annotated.png\` for visual markup before implementing.`;
}
function cssValue(property, raw) {
  if (property === 'line-height') return String(raw);
  if (property === 'color' || property === 'background-color') return raw;
  return `${raw}px`;
}
module.exports = { makePrompt, cssValue };
