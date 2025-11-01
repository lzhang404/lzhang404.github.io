import {
  renderCodeBlock as sharedRenderCodeBlock,
  highlightLines as sharedHighlightLines,
  qs as sharedQs,
  el as sharedEl
} from "../../shared/syntax.js";

// Re-export helpers so algorithm visualizers do not need to import from shared directly.
export const qs = (sel, root = document) => sharedQs ? sharedQs(sel, root) : root.querySelector(sel);
export const el = (tag, className = "") => sharedEl ? sharedEl(tag, className) : (() => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
})();
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function renderCodeBlock(container, lines, opts = {}) {
  return sharedRenderCodeBlock(container, lines, opts);
}

export function highlightLines(lineMap, lines = []) {
  sharedHighlightLines(lineMap, lines);
}
