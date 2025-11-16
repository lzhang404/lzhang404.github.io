// shared/syntax.js
export const qs = (sel, root = document) => root.querySelector(sel);
export const el = (tag, className) => {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
};

// ---- Highlighter (your version, unchanged) ----
export function escapeHtml(s) {
  return s.replace(/[&<>"']/g, m => (
    { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]
  ));
}

function splitLineParts(line) {
  let inString = false;
  let escapeNext = false;
  for (let i = 0; i < line.length - 1; i++) {
    const ch = line[i];
    if (inString) {
      if (escapeNext) {
        escapeNext = false;
      } else if (ch === "\\") {
        escapeNext = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }
    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "/" && line[i + 1] === "/" && (i === 0 || line[i - 1] !== ":")) {
      return {
        code: line.slice(0, i),
        comment: line.slice(i)
      };
    }
  }
  return { code: line, comment: "" };
}

export function highlightCpp(line) {
  const { code, comment } = splitLineParts(line);
  let s = escapeHtml(code);

  // strings
  s = s.replace(/"(?:\\.|[^"\\])*"/g, m => `<span class="str">${m}</span>`);

  // std::name  -> std (pink) + name (purple)
  s = s.replace(/\bstd::([A-Za-z_]\w*)\b/g,
    (_m, fn) => `<span class="standard">std</span>::<span class="func">${fn}</span>`
  );

  // keywords (blue)
  const kw = [
    "if","else","for","while","do","return","break","continue",
    "switch","case","default","const","static","namespace","using",
    "new","delete","sizeof"
  ].join("|");
  s = s.replace(new RegExp(`\\b(${kw})\\b`, "g"), `<span class="kw">$1</span>`);

  // types (teal)
  const types = [
    "void","int","long","short","float","double","bool","char","size_t",
    "vector","string","array","map","set","unordered_map"
  ].join("|");
  s = s.replace(new RegExp(`\\b(${types})\\b`, "g"), `<span class="type">$1</span>`);

  // numbers (muted)
  s = s.replace(/\b\d+(?:\.\d+)?\b/g, m => `<span class="num">${m}</span>`);

  if (comment) {
    s += `<span class="cmt">${escapeHtml(comment)}</span>`;
  }
  return s;
}

// ---- Renderer that can handle both tokenized or raw lines ----
/**
 * Render code lines to a block.
 * @param {HTMLElement} host
 * @param {string[]} codeLines - lines (either RAW C++ or pre-tokenized HTML)
 * @param {{tokenized?: boolean}} [opts] - set tokenized=true if lines already contain <span class="kw"> etc.
 * @returns {Map<number, HTMLElement>} lineNumber -> row element
 */
export function renderCodeBlock(host, codeLines, opts = {}) {
  const { tokenized = false } = opts;
  host.innerHTML = "";
  const map = new Map();

  codeLines.forEach((line, i) => {
    const row = el("div", "code-line");
    row.dataset.line = i + 1;

    const num = el("span", "line-number");
    num.textContent = String(i + 1).padStart(2, " ");

    const txt = el("span");
    let html = tokenized ? line : highlightCpp(line);
    txt.innerHTML = html;

    if (!tokenized) {
      const walker = document.createTreeWalker(txt, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      let stillLeading = true;
      while (node && stillLeading) {
        const value = node.textContent ?? "";
        if (value.length) {
          const leading = value.match(/^\s*/)?.[0] ?? "";
          if (leading.length) {
            node.textContent =
              "\u00a0".repeat(leading.length) + value.slice(leading.length);
          }
          if (value.trim().length > 0) {
            stillLeading = false;
          }
        }
        node = walker.nextNode();
      }
    }

    row.append(num, txt);
    host.appendChild(row);
    map.set(i + 1, row);
  });
  return map;
}

export function highlightLines(lineMap, lines = []) {
  lineMap.forEach(el => el.classList.remove("active"));
  lines.forEach(n => {
    const el = lineMap.get(n);
    if (el) el.classList.add("active");
  });
}
