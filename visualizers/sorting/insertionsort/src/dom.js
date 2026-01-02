export const qs = (sel, root = document) => root.querySelector(sel);

export function el(tag, className = "", children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (!Array.isArray(children)) children = [children];
  children.filter(Boolean).forEach(c => node.appendChild(c));
  return node;
}

export function renderCodeBlock(container, lines) {
  container.innerHTML = "";
  const map = new Map();
  lines.forEach((line, index) => {
    const lineEl = document.createElement("div");
    lineEl.className = "code-line";
    lineEl.dataset.line = String(index + 1);

    const numberEl = document.createElement("span");
    numberEl.className = "line-number";
    numberEl.textContent = String(index + 1).padStart(2, " ");

    const textEl = document.createElement("span");
    textEl.innerHTML = line;

    lineEl.append(numberEl, textEl);
    container.appendChild(lineEl);
    map.set(index + 1, lineEl);
  });
  return map;
}
