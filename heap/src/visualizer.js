import { qs, qsa, el, renderCodeBlock, highlightLines } from "./dom.js";
import { heapSnippets } from "./codeSnippets.js";
import { generateHeapOperationSteps } from "./steps.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const TREE_LAYOUT = { marginX: 60, top: 70, verticalSpacing: 110 };
const VIEWBOX_WIDTH = 960;

const DEFAULT_OPERATION = "heapify";
const DEFAULT_SNIPPET = "build";
const DEFAULT_HEAP_TYPE = "max";

export class HeapVisualizer {
  constructor() {
    this.arrayContainer = qs("#array-container");
    this.codeBlock = qs("#code-block");
    this.messageEl = qs("#message");
    this.stepInfoEl = qs("#step-info");
    this.startBtn = qs("#start-btn");
    this.stepBtn = qs("#step-btn");
    this.toggleBtn = qs("#toggle-btn");
    this.resetBtn = qs("#reset-btn");
    this.heapTypeInputs = qsa("input[name='heap-type']");
    this.operationInputs = qsa("input[name='operation']");
    this.insertField = qs("#insert-field");
    this.insertInput = qs("#insert-value");
    this.codeTabs = qsa(".code-tabs .tab");

    this.steps = [];
    this.stepIndex = 0;
    this.timer = null;
    this.isRunning = false;
    this.isPaused = false;
    this.stepDelay = 850;

    this.arrayElements = [];
    this.activeCodeLines = [];
    this.currentValues = [];

    const initialOperation = this.getSelectedOperation();
    const initialSnippet = initialOperation === "heapify" ? "build" : initialOperation;
    this.currentSnippet = heapSnippets[initialSnippet] ? initialSnippet : DEFAULT_SNIPPET;

    this.treeSvg = qs("#heap-tree");
    if (this.treeSvg) {
      this.treeEdges = document.createElementNS(SVG_NS, "g");
      this.treeNodes = document.createElementNS(SVG_NS, "g");
      this.treeSvg.append(this.treeEdges, this.treeNodes);
    }

    this.codeLineMap = renderCodeBlock(this.codeBlock, heapSnippets[this.currentSnippet]);

    this.bindEvents();
    this.updateOperationUI();
    this.reset();
  }

  bindEvents() {
    this.startBtn.addEventListener("click", () => this.start());
    this.stepBtn.addEventListener("click", () => this.stepOnce());
    this.toggleBtn.addEventListener("click", () => this.togglePause());
    this.resetBtn.addEventListener("click", () => this.reset());

    this.heapTypeInputs.forEach(input => {
      input.addEventListener("change", () => {
        if (input.checked) this.prepareSteps(true);
      });
    });

    this.operationInputs.forEach(input => {
      input.addEventListener("change", () => {
        if (input.checked) {
          this.updateOperationUI();
          this.prepareSteps(true);
        }
      });
    });

    this.codeTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const key = tab.dataset.snippet;
        if (!key) return;
        this.setSnippet(key);
      });
    });
  }

  start() {
    if (this.isRunning) return;
    if (!this.prepareSteps(true)) return;

    this.isRunning = true;
    this.isPaused = false;
    this.updateControls();
    this.playNextStep();
  }

  togglePause() {
    if (!this.isRunning) return;
    this.isPaused ? this.resume() : this.pause();
  }

  pause() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.updateControls();
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.updateControls();
    this.playNextStep();
  }

  reset() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.isRunning = false;
    this.isPaused = false;
    this.steps = [];
    this.stepIndex = 0;

    this.updateOperationUI();
    this.highlightCode([]);
    this.showMessage("");
    this.setStepInfo("Choose an operation to visualize how a heap changes step by step.");

    const parsed = this.parseArrayInput(this.inputElValue());
    if (parsed.success) {
      this.renderArray(parsed.values);
      this.renderTree(parsed.values, { heapSize: parsed.values.length });
    } else {
      this.arrayContainer.innerHTML = "";
      this.arrayElements = [];
      this.currentValues = [];
      this.renderTree([], {});
    }

    this.updateHeapRegion(parsed.success ? parsed.values.length : 0);
    this.updateControls();
  }

  prepareSteps(force = false) {
    const operation = this.getSelectedOperation();
    const heapType = this.getSelectedHeapType();

    if (!force && this.steps.length && this.stepIndex < this.steps.length) {
      return true;
    }

    const parsed = this.parseArrayInput(this.inputElValue());
    if (!parsed.success) {
      this.showMessage(parsed.message, true);
      this.steps = [];
      this.stepIndex = 0;
      this.isRunning = false;
      this.isPaused = false;
      this.renderArray([]);
      this.renderTree([], {});
      this.updateControls();
      return false;
    }

    let insertValue = null;
    if (operation === "insert") {
      const parsedInsert = this.parseInsertValue(this.insertInput.value);
      if (!parsedInsert.success) {
        this.showMessage(parsedInsert.message, true);
        return false;
      }
      insertValue = parsedInsert.value;
    }

    this.showMessage("");
    this.setSnippet(operation === "heapify" ? "build" : operation);

    const options = { operation, heapType, insertValue };
    this.steps = generateHeapOperationSteps(parsed.values, options);
    this.stepIndex = 0;
    this.isRunning = false;
    this.isPaused = false;

    this.renderArray(parsed.values);
    this.updateHeapRegion(parsed.values.length);
    this.renderTree(parsed.values, { heapSize: parsed.values.length });
    this.highlightCode([]);

    if (!this.steps.length) {
      this.setStepInfo("No steps generated.");
    } else {
      this.setStepInfo("Ready. Click Step to advance or Start to autoplay.");
    }

    this.updateControls();
    return this.steps.length > 0;
  }

  playNextStep() {
    if (!this.isRunning || this.isPaused) return;
    if (!this.advanceStep()) return;
    if (!this.isRunning || this.isPaused) return;
    this.timer = setTimeout(() => this.playNextStep(), this.stepDelay);
  }

  stepOnce() {
    if (this.isRunning && !this.isPaused) return;

    if (this.isRunning && this.isPaused) {
      if (this.advanceStep()) this.updateControls();
      return;
    }

    if (!this.steps.length) {
      if (!this.prepareSteps(true)) return;
    }

    if (this.stepIndex >= this.steps.length) {
      this.finish();
      return;
    }

    if (this.advanceStep()) this.updateControls();
  }

  advanceStep() {
    if (this.stepIndex >= this.steps.length) {
      this.finish();
      return false;
    }
    const step = this.steps[this.stepIndex];
    this.applyStep(step);
    this.stepIndex += 1;
    if (this.stepIndex >= this.steps.length) {
      this.finish();
    }
    return true;
  }

  applyStep(step) {
    if (!step) return;

    this.setSnippet(step.snippet || this.getSelectedOperation());
    this.ensureArrayLength(step.array);
    this.highlightCode(step.codeLines || []);
    this.updateArrayValues(step.array);
    this.clearHighlights();
    this.clearPointers();
    this.updateHeapRegion(step.heapSize ?? step.array.length);
    this.applyPointers(step);
    this.applyHighlights(step);
    this.renderTree(step.array, step);
    this.setStepInfo(step.info || "");
  }

  finish() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.isRunning = false;
    this.isPaused = false;
    this.updateControls();
  }

  parseArrayInput(text) {
    if (!text || !text.trim()) {
      return { success: false, message: "Enter at least one integer in the array input." };
    }
    const tokens = text.split(/[\s,]+/).map(t => t.trim()).filter(Boolean);
    if (!tokens.length) {
      return { success: false, message: "Enter at least one integer in the array input." };
    }
    const values = [];
    for (const token of tokens) {
      if (!/^[-+]?\d+$/.test(token)) {
        return { success: false, message: `Invalid number "${token}".` };
      }
      values.push(parseInt(token, 10));
    }
    return { success: true, values };
  }

  parseInsertValue(value) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return { success: false, message: "Provide a value to insert." };
    if (!/^[-+]?\d+$/.test(trimmed)) {
      return { success: false, message: `Invalid insert value "${trimmed}".` };
    }
    return { success: true, value: parseInt(trimmed, 10) };
  }

  inputElValue() {
    const input = qs("#array-input");
    return input ? input.value : "";
  }

  renderArray(values) {
    this.arrayContainer.innerHTML = "";
    this.currentValues = Array.isArray(values) ? values.slice() : [];
    this.arrayElements = this.currentValues.map((value, idx) => {
      const cell = el("div", "array-item");
      cell.dataset.index = String(idx);

      const pointerEl = el("div", "pointer-labels");
      const valueEl = el("div", "value");
      valueEl.textContent = value;
      const indexEl = el("div", "index");
      indexEl.textContent = `idx ${idx}`;

      cell.append(pointerEl, valueEl, indexEl);
      this.arrayContainer.appendChild(cell);
      return cell;
    });
  }

  ensureArrayLength(values) {
    if (!Array.isArray(values)) return;
    if (this.arrayElements.length !== values.length) {
      this.renderArray(values);
    }
  }

  updateArrayValues(values) {
    values.forEach((value, idx) => {
      const cell = this.arrayElements[idx];
      if (!cell) return;

      const valueEl = cell.querySelector(".value");
      if (valueEl) valueEl.textContent = value;
      const indexEl = cell.querySelector(".index");
      if (indexEl) indexEl.textContent = `idx ${idx}`;
    });
    this.currentValues = Array.isArray(values) ? values.slice() : this.currentValues;
  }

  clearSvgGroup(group) {
    if (!group) return;
    while (group.firstChild) group.removeChild(group.firstChild);
  }

  renderTree(values, step = {}) {
    if (!this.treeSvg) return;

    const arr = Array.isArray(values) ? values.slice() : this.currentValues.slice();
    const total = arr.length;

    this.clearSvgGroup(this.treeEdges);
    this.clearSvgGroup(this.treeNodes);

    if (!total) return;

    const heapSize = Number.isInteger(step.heapSize) ? step.heapSize : total;
    const positions = computeHeapPositions(total);
    const highlights = buildHighlightMap(step, total);

    for (let parent = 0; parent < total; parent++) {
      const parentPos = positions.get(parent);
      if (!parentPos) continue;
      const children = [2 * parent + 1, 2 * parent + 2];
      children.forEach(child => {
        if (child >= total) return;
        const childPos = positions.get(child);
        if (!childPos) return;
        const edge = document.createElementNS(SVG_NS, "line");
        edge.classList.add("tree-edge");
        if (parent >= heapSize || child >= heapSize) edge.classList.add("edge-outside");
        edge.setAttribute("x1", String(parentPos.x));
        edge.setAttribute("y1", String(parentPos.y));
        edge.setAttribute("x2", String(childPos.x));
        edge.setAttribute("y2", String(childPos.y));
        this.treeEdges.appendChild(edge);
      });
    }

    for (let idx = 0; idx < total; idx++) {
      const pos = positions.get(idx);
      if (!pos) continue;
      const nodeGroup = document.createElementNS(SVG_NS, "g");
      nodeGroup.classList.add("tree-node");
      if (idx < heapSize) nodeGroup.classList.add("node-in-heap");
      else nodeGroup.classList.add("node-outside");

      const classes = highlights.get(idx);
      if (classes) classes.forEach(cls => nodeGroup.classList.add(`node-${cls}`));

      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("cx", String(pos.x));
      circle.setAttribute("cy", String(pos.y));
      circle.setAttribute("r", "50");
      nodeGroup.appendChild(circle);

      const valueText = document.createElementNS(SVG_NS, "text");
      valueText.classList.add("node-value");
      valueText.setAttribute("x", String(pos.x));
      valueText.setAttribute("y", String(pos.y));
      valueText.textContent = String(arr[idx]);
      nodeGroup.appendChild(valueText);

      const indexText = document.createElementNS(SVG_NS, "text");
      indexText.classList.add("node-index");
      indexText.setAttribute("x", String(pos.x));
      indexText.setAttribute("y", String(pos.y + 55));
      indexText.textContent = `idx ${idx}`;
      nodeGroup.appendChild(indexText);

      this.treeNodes.appendChild(nodeGroup);
    }
  }

  clearHighlights() {
    this.arrayElements.forEach(cell => {
      cell.classList.remove("current", "candidate", "parent", "child", "swap", "removed", "largest");
    });
  }

  updateHeapRegion(heapSize) {
    const size = Number.isInteger(heapSize) ? heapSize : this.arrayElements.length;
    this.arrayElements.forEach((cell, idx) => {
      if (idx < size) cell.classList.add("heap");
      else cell.classList.remove("heap");
    });
  }

  clearPointers() {
    this.arrayElements.forEach(cell => {
      const pointerEl = cell.querySelector(".pointer-labels");
      if (pointerEl) pointerEl.innerHTML = "";
    });
  }

  setPointer(label, index, className) {
    if (!Number.isInteger(index)) return;
    if (index < 0 || index >= this.arrayElements.length) return;
    const cell = this.arrayElements[index];
    const wrapper = cell.querySelector(".pointer-labels");
    if (!wrapper) return;
    const badge = document.createElement("span");
    badge.className = `pointer ${className}`;
    badge.textContent = label;
    wrapper.appendChild(badge);
  }

  applyPointers(step) {
    const configs = [
      { field: "i", label: "i", className: "pointer-i" },
      { field: "left", label: "L", className: "pointer-left" },
      { field: "right", label: "R", className: "pointer-right" }
    ];
    configs.forEach(({ field, label, className }) => {
      const idx = step[field];
      if (Number.isInteger(idx)) this.setPointer(label, idx, className);
    });
  }

  applyHighlights(step) {
    const mark = (idx, cls) => {
      if (!Number.isInteger(idx)) return;
      if (idx < 0 || idx >= this.arrayElements.length) return;
      this.arrayElements[idx].classList.add(cls);
    };

    const highlightHeapifyState = () => {
      mark(step.i, "current");
      if (Number.isInteger(step.left)) mark(step.left, "child");
      if (Number.isInteger(step.right)) mark(step.right, "child");
      if (Number.isInteger(step.largest)) mark(step.largest, "largest");
    };

    switch (step.type) {
      case "heapifyLoop":
        mark(step.i, "current");
        break;
      case "siftStart":
        highlightHeapifyState();
        break;
      case "siftCompareLeft":
        highlightHeapifyState();
        break;
      case "siftCompareRight":
        highlightHeapifyState();
        break;
      case "updateLargest":
        highlightHeapifyState();
        break;
      case "childOutOfBounds":
        highlightHeapifyState();
        break;
      case "siftCheck":
        highlightHeapifyState();
        break;
      case "siftSwap":
      case "siftSwapDone":
      case "removeSwap":
      case "removeSwapDone":
        if (step.type === "siftSwap" || step.type === "siftSwapDone") highlightHeapifyState();
        mark(step.swapA, "swap");
        mark(step.swapB, "swap");
        break;
      case "siftRecurse":
      case "siftSatisfied":
      case "siftComplete":
        highlightHeapifyState();
        break;
      case "appendNode":
        mark(step.appendIndex, "current");
        break;
      case "bubbleCompare":
        mark(step.i, "current");
        mark(step.parent, "parent");
        break;
      case "bubbleSwap":
        mark(step.swapA, "swap");
        mark(step.swapB, "swap");
        break;
      case "bubbleAdvance":
        mark(step.i, "current");
        break;
      case "bubbleStop":
        mark(step.parent, "parent");
        break;
      case "removePop":
        if (this.arrayElements.length) mark(0, "current");
        break;
      case "siftDownRestart":
        mark(0, "current");
        break;
      case "operationComplete":
        if (this.arrayElements.length) mark(0, "current");
        break;
      default:
        break;
    }
  }

  setSnippet(key) {
    if (!heapSnippets[key]) return;
    this.currentSnippet = key;
    this.codeTabs.forEach(tab => {
      tab.classList.toggle("active", tab.dataset.snippet === key);
    });
    this.codeLineMap = renderCodeBlock(this.codeBlock, heapSnippets[key]);
    highlightLines(this.codeLineMap, this.activeCodeLines);
  }

  highlightCode(lines) {
    this.activeCodeLines = Array.isArray(lines) ? [...lines] : [];
    highlightLines(this.codeLineMap, this.activeCodeLines);
  }

  updateOperationUI() {
    const operation = this.getSelectedOperation();
    const showInsert = operation === "insert";
    if (this.insertField) {
      this.insertField.classList.toggle("hidden", !showInsert);
    }
    this.setSnippet(operation === "heapify" ? "build" : operation);
  }

  getSelectedHeapType() {
    const checked = this.heapTypeInputs.find(input => input.checked);
    return checked ? checked.value : DEFAULT_HEAP_TYPE;
  }

  getSelectedOperation() {
    const checked = this.operationInputs.find(input => input.checked);
    return checked ? checked.value : DEFAULT_OPERATION;
  }

  showMessage(text, isError = false) {
    if (!this.messageEl) return;
    this.messageEl.textContent = text || "";
    this.messageEl.classList.toggle("error", !!isError);
  }

  setStepInfo(text) {
    if (!this.stepInfoEl) return;
    this.stepInfoEl.textContent = text || "";
  }

  updateControls() {
    if (this.isRunning) {
      this.startBtn.disabled = true;
      this.stepBtn.disabled = !this.isPaused;
      this.toggleBtn.disabled = false;
      this.toggleBtn.textContent = this.isPaused ? "Resume" : "Pause";
    } else {
      this.startBtn.disabled = false;
      this.stepBtn.disabled = false;
      this.toggleBtn.disabled = true;
      this.toggleBtn.textContent = "Pause";
    }
  }
}

function computeHeapPositions(count) {
  const positions = new Map();
  if (!Number.isInteger(count) || count <= 0) return positions;

  const available = VIEWBOX_WIDTH - TREE_LAYOUT.marginX * 2;

  for (let idx = 0; idx < count; idx++) {
    const depth = Math.floor(Math.log2(idx + 1));
    const levelStart = (1 << depth) - 1;
    const offset = idx - levelStart;
    const slots = 1 << depth;
    const slotWidth = available / slots;
    const x = TREE_LAYOUT.marginX + slotWidth * (offset + 0.5);
    const y = TREE_LAYOUT.top + depth * TREE_LAYOUT.verticalSpacing;
    positions.set(idx, { x, y });
  }

  return positions;
}

function buildHighlightMap(step = {}, total) {
  const map = new Map();
  if (!step) return map;

  const add = (index, cls) => {
    if (!Number.isInteger(index) || index < 0 || index >= total) return;
    if (!map.has(index)) map.set(index, new Set());
    map.get(index).add(cls);
  };

  const pairs = [
    ["i", "current"],
    ["parent", "parent"],
    ["left", "child"],
    ["right", "child"],
    ["largest", "largest"],
    ["swapA", "swap"],
    ["swapB", "swap"],
    ["heapEnd", "end"],
    ["appendIndex", "current"]
  ];

  pairs.forEach(([field, cls]) => add(step[field], cls));

  return map;
}
