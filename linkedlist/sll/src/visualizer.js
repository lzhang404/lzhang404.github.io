import { qs, el, renderCodeBlock, highlightLines } from "./dom.js";
import { codeSnippets } from "./codeSnippets.js";
import { createList, generateOperationSteps, pointerConfig, snapshotList } from "./steps.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const OPERATIONS = {
  append: {
    label: "Append",
    params: [
      { name: "value", label: "Value to append", placeholder: "e.g. 12" },
    ],
  },
  prepend: {
    label: "Prepend",
    params: [
      { name: "value", label: "Value to prepend", placeholder: "e.g. 5" },
    ],
  },
  insertAfter: {
    label: "Insert node after",
    params: [
      { name: "targetValue", label: "Target value", placeholder: "existing value" },
      { name: "value", label: "New node value", placeholder: "e.g. 8" },
    ],
  },
  removeAfter: {
    label: "Remove node after",
    params: [
      { name: "targetValue", label: "Target value", placeholder: "existing value" },
    ],
  },
  removeByValue: {
    label: "Remove by value",
    params: [
      { name: "value", label: "Value to remove", placeholder: "existing value" },
    ],
  },
  traverse: {
    label: "Traversal",
    params: [],
  },
};

const POINTER_STYLE = {
  head: { nodeClass: "node-head", pointerClass: "ptr-head" },
  tail: { nodeClass: "node-tail", pointerClass: "ptr-tail" },
  cur: { nodeClass: "node-cur", pointerClass: "ptr-cur" },
  prev: { nodeClass: "node-prev", pointerClass: "ptr-prev" },
  target: { nodeClass: "node-target", pointerClass: "ptr-target" },
  new: { nodeClass: "node-new", pointerClass: "ptr-new" },
};

export class SinglyLinkedListOperationsVisualizer {
  constructor() {
    this.listInput = qs("#list-input");
    this.operationSelect = qs("#operation");
    this.fieldsHost = qs("#operation-fields");
    this.message = qs("#message");
    this.stepMessage = qs("#step-message");
    this.buildBtn = qs("#build-btn");
    this.resetBtn = qs("#reset-btn");
    this.runBtn = qs("#run-btn");
    this.stepBtn = qs("#step-btn");
    this.autoBtn = qs("#auto-btn");
    this.speed = qs("#speed");

    this.svg = qs("#viz");
    this.gArrows = document.createElementNS(SVG_NS, "g");
    this.gNodes = document.createElementNS(SVG_NS, "g");
    this.gPointers = document.createElementNS(SVG_NS, "g");
    this.svg.append(this.gArrows, this.gNodes, this.gPointers);

    this.operation = this.operationSelect?.value ?? "append";
    this.codeMap = renderCodeBlock(qs("#code-block"), codeSnippets[this.operation] ?? []);

    this.steps = [];
    this.index = 0;
    this.timer = null;
    this.prevPointers = null;

    this.list = { kind: "sll", head: null, tail: null, nodes: [] };
    this.nextId = 0;

    this.nodeElements = new Map();
    this.nodePositions = new Map();
    this.paramInputs = new Map();

    this.bind();
    this.renderOperationFields();
    this.rebuild();
  }

  bind() {
    this.buildBtn?.addEventListener("click", () => this.rebuild());
    this.resetBtn?.addEventListener("click", () => this.rebuild());
    this.runBtn?.addEventListener("click", () => this.runOperation());
    this.stepBtn?.addEventListener("click", () => this.stepOnce());
    this.autoBtn?.addEventListener("click", () => this.toggleAuto());

    this.operationSelect?.addEventListener("change", () => {
      const value = this.operationSelect.value;
      this.setOperation(value);
    });
  }

  setOperation(operation) {
    if (!codeSnippets[operation]) return;
    this.operation = operation;
    this.codeMap = renderCodeBlock(qs("#code-block"), codeSnippets[operation]);
    this.renderOperationFields();
    this.stopAuto();
    this.steps = [];
    this.index = 0;
    this.prevPointers = null;
    this.stepMessage.textContent = "";
    highlightLines(this.codeMap, []);
    this.renderBaseState("Operation changed. Current list shown.");
  }

  renderOperationFields() {
    this.fieldsHost.innerHTML = "";
    this.paramInputs.clear();
    const config = OPERATIONS[this.operation];
    if (!config || !config.params?.length) {
      const note = el("div", "param-note");
      note.textContent = "No additional parameters required.";
      this.fieldsHost.appendChild(note);
      return;
    }
    config.params.forEach((param) => {
      const wrapper = el("label");
      wrapper.textContent = param.label;
      const input = el("input");
      input.type = "number";
      input.placeholder = param.placeholder ?? "";
      input.dataset.param = param.name;
      wrapper.appendChild(input);
      this.fieldsHost.appendChild(wrapper);
      this.paramInputs.set(param.name, input);
    });
  }

  parseInput() {
    const raw = (this.listInput?.value ?? "").trim();
    if (!raw.length) {
      return { ok: true, nums: [] };
    }
    const parts = raw.split(/[, \t\r\n]+/).filter(Boolean);
    const nums = parts.map((part) => Number(part));
    if (nums.some((n) => !Number.isFinite(n))) {
      return { ok: false, message: "Enter numeric values separated by commas or spaces." };
    }
    return { ok: true, nums };
  }

  rebuild() {
    this.stopAuto();
    this.prevPointers = null;
    const parsed = this.parseInput();
    if (!parsed.ok) {
      this.message.textContent = parsed.message ?? "Invalid input.";
      this.steps = [];
      this.index = 0;
      highlightLines(this.codeMap, []);
      this.stepMessage.textContent = "";
      this.clear(this.gNodes);
      this.clear(this.gArrows);
      this.clear(this.gPointers);
      return;
    }
    this.message.textContent = "";
    const base = createList(parsed.nums ?? [], 0);
    this.list = {
      kind: "sll",
      head: base.head,
      tail: base.tail,
      nodes: base.nodes,
    };
    this.nextId = base.nextId ?? base.nodes.length;
    this.steps = [];
    this.index = 0;
    this.renderBaseState(parsed.nums.length ? "List rebuilt from input values." : "List initialized as empty.");
  }

  renderBaseState(message) {
    const step = {
      codeLines: [],
      message,
      list: snapshotList(this.list),
      pointers: {
        head: this.list.head,
        tail: this.list.tail,
        cur: null,
        prev: null,
        target: null,
        new: null,
      },
    };
    this.renderStep(step);
  }

  getOperationParams() {
    const config = OPERATIONS[this.operation];
    if (!config || !config.params?.length) return {};
    const params = {};
    for (const param of config.params) {
      const input = this.paramInputs.get(param.name);
      if (!input) continue;
      const raw = (input.value ?? "").trim();
      if (!raw.length) {
        this.message.textContent = `Enter ${param.label.toLowerCase()}.`;
        input.focus();
        return null;
      }
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        this.message.textContent = `${param.label} must be a valid number.`;
        input.focus();
        return null;
      }
      params[param.name] = value;
    }
    return params;
  }

  runOperation() {
    this.stopAuto();
    this.prevPointers = null;
    const params = this.getOperationParams();
    if (params == null) return;

    const { steps, list, nextId } = generateOperationSteps(this.operation, this.list, params, this.nextId);
    if (!steps.length) {
      this.message.textContent = "Operation produced no steps. Check your inputs.";
      return;
    }

    this.message.textContent = "";
    this.steps = steps;
    this.index = 0;
    this.list = list;
    this.nextId = nextId;

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

  toggleAuto() {
    if (this.timer) {
      this.stopAuto();
      return;
    }
    if (!this.steps.length) return;
    this.stepOnce();
    if (this.index >= this.steps.length) return;
    const delay = Number(this.speed?.value) || 700;
    this.timer = setInterval(() => this.stepOnce(), delay);
    this.autoBtn.textContent = "Stop";
  }

  stopAuto() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.autoBtn) this.autoBtn.textContent = "Auto";
  }

  renderStep(step) {
    if (!step) return;
    highlightLines(this.codeMap, step.codeLines ?? []);
    this.stepMessage.textContent = step.message ?? "";
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
    const height = 78;

    const byId = (id) => list.nodes.find((n) => n.id === id) ?? null;

    const placeNode = (node, x, y, type) => {
      const group = document.createElementNS(SVG_NS, "g");
      group.setAttribute("class", `node node-${type}`);
      group.dataset.id = String(node.id);

      const rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", width);
      rect.setAttribute("height", height);
      group.appendChild(rect);

      const textData = document.createElementNS(SVG_NS, "text");
      textData.setAttribute("x", x + 18);
      textData.setAttribute("y", y + 32);
      textData.textContent = `data: ${node.data}`;
      group.appendChild(textData);

      const textNext = document.createElementNS(SVG_NS, "text");
      textNext.setAttribute("x", x + 18);
      textNext.setAttribute("y", y + 58);
      textNext.textContent = `next: ${node.next != null ? "→" : "null"}`;
      group.appendChild(textNext);

      this.gNodes.appendChild(group);
      this.nodeElements.set(node.id, group);
      this.nodePositions.set(node.id, { left: x, top: y, width, height });
    };

    list.order.forEach((id, idx) => {
      const node = byId(id);
      if (!node) return;
      const x = startX + idx * gap;
      placeNode(node, x, mainY, "main");
    });

    list.detached.forEach((id, idx) => {
      const node = byId(id);
      if (!node) return;
      const x = startX + idx * gap;
      placeNode(node, x, detachedY, "detached");
    });

    list.order.forEach((id) => {
      const node = byId(id);
      if (!node || node.next == null) return;
      const target = byId(node.next);
      const fromRect = this.nodePositions.get(node.id);
      const toRect = this.nodePositions.get(target?.id ?? node.next);
      if (!fromRect || !toRect) return;
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("class", "arrow arrow-next");
      line.setAttribute("marker-end", "url(#arrowHead)");
      line.setAttribute("x1", fromRect.left + fromRect.width);
      line.setAttribute("y1", fromRect.top + fromRect.height / 2);
      line.setAttribute("x2", toRect.left);
      line.setAttribute("y2", toRect.top + toRect.height / 2);
      this.gArrows.appendChild(line);
    });
  }

  applyPointerHighlights(step) {
    this.clear(this.gPointers);
    const config = pointerConfig(this.operation);
    const current = step.pointers ?? {};
    const moved = new Set();
    const previous = this.prevPointers || {};

    const stackByNode = new Map();
    config.forEach(({ key }) => {
      const nodeId = current[key];
      if ((previous?.[key] ?? null) !== (current?.[key] ?? null)) {
        moved.add(key);
      }
      if (nodeId != null) {
        if (!stackByNode.has(nodeId)) stackByNode.set(nodeId, []);
        stackByNode.get(nodeId).push(key);
      }
    });
    this.prevPointers = { ...current };

    this.nodeElements.forEach((group) => {
      group.classList.remove("node-head", "node-tail", "node-cur", "node-prev", "node-target", "node-new", "node-moved");
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
      const stack = stackByNode.get(nodeId) ?? [];
      const idx = stack.indexOf(key);
      const y = baseY - (idx >= 0 ? idx * 48 : 0);

      const g = document.createElementNS(SVG_NS, "g");
      const pointerClass = style?.pointerClass ?? "";
      g.setAttribute("class", `ptr ${pointerClass}${moved.has(key) ? " moved" : ""}`);

      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("cx", x);
      circle.setAttribute("cy", y);
      circle.setAttribute("r", 12);
      g.appendChild(circle);

      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("x", x);
      label.setAttribute("y", y - 14);
      label.setAttribute("text-anchor", "middle");
      label.textContent = config.find((c) => c.key === key)?.label ?? key;
      g.appendChild(label);

      this.gPointers.appendChild(g);
    });
  }

  clear(group) {
    while (group.firstChild) {
      group.removeChild(group.firstChild);
    }
  }
}
