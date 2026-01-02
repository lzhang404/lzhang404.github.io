// src/dom.js
export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
export const el = (tag, cls) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  return node;
};

export function renderCodeBlock(container, lines) {
  container.innerHTML = "";
  lines.forEach((line, idx) => {
    const lineEl = el("div", "code-line");
    lineEl.dataset.line = String(idx + 1);

    const numberEl = el("span", "line-number");
    numberEl.textContent = String(idx + 1).padStart(2, " ");

    const textEl = el("span");
    textEl.innerHTML = line;

    lineEl.append(numberEl, textEl);
    container.appendChild(lineEl);
  });

  return new Map(
    [...container.querySelectorAll(".code-line")].map(n => [Number(n.dataset.line), n])
  );
}
