import {
  renderCodeBlock as sharedRenderCodeBlock,
  highlightLines as sharedHighlightLines
} from "../../shared/syntax.js";

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function el(tag, className = "", children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (!Array.isArray(children)) children = [children];
  children.filter(Boolean).forEach(child => node.appendChild(child));
  return node;
}

export function renderCodeBlock(container, lines, opts = {}) {
  return sharedRenderCodeBlock(container, lines, opts);
}

export function highlightLines(lineMap, lines = []) {
  sharedHighlightLines(lineMap, lines);
}
