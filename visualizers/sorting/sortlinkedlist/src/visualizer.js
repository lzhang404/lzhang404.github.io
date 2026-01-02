import { qs, qsa, el, renderCodeBlock, highlightLines } from "./dom.js";
import { codeSnippets } from "./codeSnippets.js";
import { generateSteps, pointerConfig } from "./steps.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const POINTER_STYLE = {
  cur: { nodeClass: "node-cur", pointerClass: "ptr-cur" },
  search: { nodeClass: "node-search", pointerClass: "ptr-search" },
  next: { nodeClass: "node-next", pointerClass: "ptr-next" },
  sorted: { nodeClass: "node-sorted", pointerClass: "ptr-sorted" },
};

export class LinkedListSortVisualizer {
  constructor() {
    this.input = qs("#list-input");
    this.typeSelect = qsa("input[name='list-kind']");
    this.msg = qs("#message");
    this.stepMsg = qs("#step-message");
    this.buildBtn = qs("#build-btn");
    this.stepBtn = qs("#step-btn");
    this.autoBtn = qs("#auto-btn");
    this.resetBtn = qs("#reset-btn");
    this.speed = qs("#speed");

    this.svg = qs("#viz");
    this.gArrows = document.createElementNS(SVG_NS, "g");
    this.gNodes = document.createElementNS(SVG_NS, "g");
    this.gPointers = document.createElementNS(SVG_NS, "g");
    this.svg.append(this.gArrows, this.gNodes, this.gPointers);

    this.kind = "dll";
    this.codeMap = renderCodeBlock(qs("#code-block"), codeSnippets[this.kind]);

    this.steps = [];
    this.index = 0;
    this.timer = null;
    this.prevPointers = null;

    this.nodeElements = new Map();
    this.nodePositions = new Map();

    this.bind();
    this.rebuild();
  }

  bind() {
    this.buildBtn.addEventListener("click", () => this.rebuild());
    this.resetBtn.addEventListener("click", () => this.rebuild());
    this.stepBtn.addEventListener("click", () => this.stepOnce());
    this.autoBtn.addEventListener("click", () => this.toggleAuto());

    this.typeSelect.forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) {
          this.setKind(input.value);
        }
      });
    });
  }

  setKind(kind) {
    if (!codeSnippets[kind]) return;
    this.kind = kind;
    this.codeMap = renderCodeBlock(qs("#code-block"), codeSnippets[this.kind]);
    this.stopAuto();
    this.rebuild();
  }

  toggleAuto() {
    if (this.timer) {
      this.stopAuto();
      return;
    }
    this.stepOnce();
    if (this.index >= this.steps.length) {
      return;
    }
    const delay = Number(this.speed?.value) || 700;
    this.timer = setInterval(() => this.stepOnce(), delay);
    this.autoBtn.textContent = "Stop";
  }

  stopAuto() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.autoBtn.textContent = "Auto";
  }

  parseInput() {
    const raw = (this.input.value || "").trim();
    const nums = raw
      .split(/[, \t\r\n]+/)
      .filter(Boolean)
      .map((v) => Number(v));
    if (!nums.length || nums.some((n) => !Number.isFinite(n))) {
      return { ok: false, message: "Enter at least one integer separated by commas or spaces." };
    }
    return { ok: true, nums };
  }

  rebuild() {
    this.stopAuto();
    this.prevPointers = null;

    const parsed = this.parseInput();
    if (!parsed.ok) {
      this.msg.textContent = parsed.message;
      this.steps = [];
      this.index = 0;
      this.clear(this.gArrows);
      this.clear(this.gNodes);
      this.clear(this.gPointers);
      highlightLines(this.codeMap, []);
      this.stepMsg.textContent = "";
      return;
    }

    this.msg.textContent = "";
    this.steps = generateSteps(this.kind, parsed.nums);
    this.index = 0;

    if (!this.steps.length) {
      highlightLines(this.codeMap, []);
      this.stepMsg.textContent = "";
      this.clear(this.gArrows);
      this.clear(this.gNodes);
      this.clear(this.gPointers);
      return;
    }

    this.renderStep(this.steps[0]);
    this.index = 1;
  }

  stepOnce() {
    if (!this.steps.length) return;
    if (this.index >= this.steps.length) {
      this.stopAuto();
      return;
    }
    const step = this.steps[this.index++];
    this.renderStep(step);
    if (this.index >= this.steps.length) {
      this.stopAuto();
    }
  }

  renderStep(step) {
    if (!step) return;
    highlightLines(this.codeMap, step.codeLines || []);
    this.stepMsg.textContent = step.message || "";

    this.layout(step.list);
    this.applyPointerHighlights(step);
  }

  layout(list) {
    this.clear(this.gArrows);
    this.clear(this.gNodes);

    this.nodeElements.clear();
    this.nodePositions.clear();

    if (!list || !list.nodes?.length) return;

    const gap = 180;
    const startX = 50;
    const mainY = 50;
    const detachedY = 180;
    const width = 150;
    const height = 96;

    const byId = (id) => list.nodes.find((n) => n.id === id) ?? null;

    const placeNode = (node, x, y, positionType) => {
      const group = document.createElementNS(SVG_NS, "g");
      group.setAttribute("class", `node node-${positionType}`);
      group.dataset.id = String(node.id);

      const rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", width);
      rect.setAttribute("height", height);
      group.appendChild(rect);

      const textData = document.createElementNS(SVG_NS, "text");
      textData.setAttribute("x", x + 18);
      textData.setAttribute("y", y + 34);
      textData.textContent = `data: ${node.data}`;
      group.appendChild(textData);

      const textNext = document.createElementNS(SVG_NS, "text");
      textNext.setAttribute("x", x + 18);
      textNext.setAttribute("y", y + 62);
      textNext.textContent = `next: ${node.next != null ? "→" : "null"}`;
      group.appendChild(textNext);

      if (list.kind === "dll") {
        const textPrev = document.createElementNS(SVG_NS, "text");
        textPrev.setAttribute("x", x + 18);
        textPrev.setAttribute("y", y + 86);
        textPrev.textContent = `prev: ${node.prev != null ? "←" : "null"}`;
        group.appendChild(textPrev);
      }

      this.gNodes.appendChild(group);
      this.nodeElements.set(node.id, group);
      this.nodePositions.set(node.id, { left: x, top: y, width, height });
    };

    list.order.forEach((id, index) => {
      const node = byId(id);
      if (!node) return;
      const x = startX + index * gap;
      placeNode(node, x, mainY, "main");
    });

    list.detached.forEach((id, index) => {
      const node = byId(id);
      if (!node) return;
      const x = startX + index * gap;
      placeNode(node, x, detachedY, "detached");
    });

    list.order.forEach((id) => {
      const node = byId(id);
      if (!node) return;
      if (node.next != null) {
        const target = byId(node.next);
        const fromRect = this.nodePositions.get(node.id);
        const toRect = this.nodePositions.get(target?.id ?? node.next);
        if (fromRect && toRect) {
          const line = document.createElementNS(SVG_NS, "line");
          line.setAttribute("class", "arrow arrow-next");
          line.setAttribute("marker-end", "url(#arrowHead)");
          line.setAttribute("x1", fromRect.left + fromRect.width);
          line.setAttribute("y1", fromRect.top + fromRect.height / 2);
          line.setAttribute("x2", toRect.left);
          line.setAttribute("y2", toRect.top + toRect.height / 2);
          this.gArrows.appendChild(line);
        }
      }
      if (list.kind === "dll" && node.prev != null) {
        const target = byId(node.prev);
        const fromRect = this.nodePositions.get(node.id);
        const toRect = this.nodePositions.get(target?.id ?? node.prev);
        if (fromRect && toRect) {
          const line = document.createElementNS(SVG_NS, "line");
          line.setAttribute("class", "arrow arrow-prev");
          line.setAttribute("marker-end", "url(#arrowHead)");
          line.setAttribute("x1", fromRect.left);
          line.setAttribute("y1", fromRect.top + fromRect.height / 2 + 28);
          line.setAttribute("x2", toRect.left + toRect.width);
          line.setAttribute("y2", toRect.top + toRect.height / 2 + 28);
          this.gArrows.appendChild(line);
        }
      }
    });
  }

  applyPointerHighlights(step) {
    this.clear(this.gPointers);

    const config = pointerConfig(this.kind);
    const current = step.pointers ?? {};
    const moved = new Set();
    const previous = this.prevPointers || {};

    const pointerStacks = new Map();
    config.forEach(({ key }) => {
      const nodeId = current[key];
      if ((previous?.[key] ?? null) !== (current?.[key] ?? null)) {
        moved.add(key);
      }
      if (nodeId != null) {
        if (!pointerStacks.has(nodeId)) pointerStacks.set(nodeId, []);
        pointerStacks.get(nodeId).push(key);
      }
    });
    this.prevPointers = { ...current };

    this.nodeElements.forEach((group) => {
      group.classList.remove("node-cur", "node-search", "node-next", "node-sorted", "node-moved");
    });

    config.forEach(({ key }) => {
      const nodeId = current[key];
      if (nodeId == null) return;
      const group = this.nodeElements.get(nodeId);
      if (!group) return;
      const style = POINTER_STYLE[key];
      if (style?.nodeClass) group.classList.add(style.nodeClass);
      if (moved.has(key)) group.classList.add("node-moved");

      const rect = group.querySelector("rect");
      if (!rect) return;
      const x = Number(rect.getAttribute("x")) + Number(rect.getAttribute("width")) / 2;
      const baseY = Number(rect.getAttribute("y")) - 36;
      const stack = pointerStacks.get(nodeId) ?? [];
      const idx = stack.indexOf(key);
      const y = baseY - (idx >= 0 ? idx * 50 : 0);

      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", `ptr ${style?.pointerClass ?? ""}${moved.has(key) ? " moved" : ""}`);

      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("cx", x);
      circle.setAttribute("cy", y);
      circle.setAttribute("r", 12);
      g.appendChild(circle);

      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("x", x);
      label.setAttribute("y", y - 16);
      label.setAttribute("text-anchor", "middle");
      label.textContent = config.find((c) => c.key === key)?.label ?? key;
      g.appendChild(label);

      this.gPointers.appendChild(g);
    });
  }

  clear(group) {
    while (group.firstChild) group.removeChild(group.firstChild);
  }
}
