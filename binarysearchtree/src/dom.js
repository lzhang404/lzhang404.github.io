import { renderCodeBlock as sharedRenderCodeBlock, highlightLines as sharedHighlightLines } from "../../shared/syntax.js";

export const qs  = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
export const el  = (tag, cls) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  return node;
};

export function renderCodeBlock(host, lines, opts = {}) {
  return sharedRenderCodeBlock(host, lines, opts);
}

export function highlightLines(map, lines = []) {
  sharedHighlightLines(map, lines);
}
