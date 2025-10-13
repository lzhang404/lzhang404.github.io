// src/dom.js
import { highlightCpp } from "../../../shared/syntax.js";

export const qs = (sel, root=document) => root.querySelector(sel);
export const el = (tag, className) => { const n=document.createElement(tag); if(className) n.className=className; return n; };

export function renderCodeBlock(host, codeLines) {
  console.log("[dom] renderCodeBlock -> host?", !!host, "lines:", codeLines.length);
  host.innerHTML = "";
  const map = new Map();
  codeLines.forEach((line, i) => {
    const row = el("div", "code-line");
    row.dataset.line = i + 1;

    const num = el("span", "line-number");
    num.textContent = String(i + 1).padStart(2, " ");

    const txt = el("span");
    const alreadySpanned = typeof line === "string" && line.includes("<span");
    txt.innerHTML = alreadySpanned ? line : highlightCpp(line);

    row.append(num, txt);
    host.appendChild(row);
    map.set(i + 1, row);
  });
  return map;
}
