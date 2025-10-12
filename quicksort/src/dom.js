// src/dom.js
export const qs = (sel, root = document) => root.querySelector(sel);

export const el = (tag, className) => {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
};

export function renderCodeBlock(host, codeLines) {
  host.innerHTML = "";
  const map = new Map();
  codeLines.forEach((line, i) => {
    const row = el("div", "code-line");
    row.dataset.line = i + 1;

    const num = el("span", "line-number");
    num.textContent = String(i + 1).padStart(2, " ");

    const txt = el("span");
    txt.innerHTML = line;

    row.append(num, txt);
    host.appendChild(row);
    map.set(i + 1, row);
  });
  return map;
}
