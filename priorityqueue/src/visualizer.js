import { qs, qsa, el, renderCodeBlock, highlightLines } from "./dom.js";
import { prioritySnippets } from "./codeSnippets.js";
import { generatePriorityQueueSteps } from "./steps.js";

const DEFAULT_OPERATION = "build";
const DEFAULT_TYPE = "max";

export class PriorityQueueVisualizer {
  constructor() {
    this.arrayContainer = qs("#array-container");
    this.codeBlock = qs("#code-block");
    this.messageEl = qs("#message");
    this.stepInfoEl = qs("#step-info");
    this.inputEl = qs("#array-input");
    this.enqueueInput = qs("#enqueue-value");
    this.startBtn = qs("#start-btn");
    this.stepBtn = qs("#step-btn");
    this.toggleBtn = qs("#toggle-btn");
    this.resetBtn = qs("#reset-btn");
    this.typeInputs = qsa("input[name='pq-type']");
    this.operationInputs = qsa("input[name='pq-operation']");
    this.enqueueField = qs("#enqueue-field");
    this.codeTabs = qsa(".code-tabs .tab");

    this.steps = [];
    this.stepIndex = 0;
    this.timer = null;
    this.isRunning = false;
    this.isPaused = false;
    this.stepDelay = 820;

    this.arrayElements = [];
    this.activeCodeLines = [];
    this.currentSnippet = DEFAULT_OPERATION;

    this.codeLineMap = renderCodeBlock(this.codeBlock, prioritySnippets[this.currentSnippet]);

    this.bindEvents();
    this.updateOperationUI();
    this.reset();
  }

  bindEvents() {
    this.startBtn.addEventListener("click", () => this.start());
    this.stepBtn.addEventListener("click", () => this.stepOnce());
    this.toggleBtn.addEventListener("click", () => this.togglePause());
    this.resetBtn.addEventListener("click", () => this.reset());

    this.typeInputs.forEach(input => {
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

    this.highlightCode([]);
    this.showMessage("");
    this.setStepInfo("Press Step to follow priority queue operations one action at a time.");

    const parsed = this.parseArrayInput(this.inputEl?.value || "");
    if (parsed.success) {
      this.renderArray(parsed.values);
      this.updateHeapRegion(parsed.values.length);
    } else {
      this.renderArray([]);
    }
    this.clearHighlights();
    this.clearPointers();
    this.updateControls();
  }

  prepareSteps(force = false) {
    const operation = this.getSelectedOperation();
    const heapType = this.getSelectedHeapType();

    if (!force && this.steps.length && this.stepIndex < this.steps.length) return true;

    const parsed = this.parseArrayInput(this.inputEl?.value || "");
    if (!parsed.success) {
      this.showMessage(parsed.message, true);
      this.renderArray([]);
      this.steps = [];
      this.stepIndex = 0;
      this.updateControls();
      return false;
    }

    let enqueueValue = null;
    if (operation === "enqueue") {
      const parsedValue = this.parseEnqueueValue(this.enqueueInput?.value ?? "");
      if (!parsedValue.success) {
        this.showMessage(parsedValue.message, true);
        return false;
      }
      enqueueValue = parsedValue.value;
    }

    this.showMessage("");
    this.setSnippet(operation);

    this.steps = generatePriorityQueueSteps(parsed.values, {
      operation,
      heapType,
      enqueueValue
    });
    this.stepIndex = 0;
    this.isRunning = false;
    this.isPaused = false;

    this.renderArray(parsed.values);
    this.updateHeapRegion(parsed.values.length);
    this.highlightCode([]);

    if (this.steps.length) {
      this.setStepInfo("Ready. Use Step or Start to visualize the operation.");
    } else {
      this.setStepInfo("No steps generated.");
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
    if (this.stepIndex >= this.steps.length) this.finish();
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
      return { success: false, message: "Enter at least one integer to initialise the queue." };
    }
    const tokens = text.split(/[\s,]+/).map(t => t.trim()).filter(Boolean);
    if (!tokens.length) {
      return { success: false, message: "Enter at least one integer to initialise the queue." };
    }
    const values = [];
    for (const token of tokens) {
      if (!/^[-+]?\d+$/.test(token)) {
        return { success: false, message: `Invalid number \"${token}\".` };
      }
      values.push(parseInt(token, 10));
    }
    return { success: true, values };
  }

  parseEnqueueValue(value) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return { success: false, message: "Provide a value to enqueue." };
    if (!/^[-+]?\d+$/.test(trimmed)) {
      return { success: false, message: `Invalid enqueue value \"${trimmed}\".` };
    }
    return { success: true, value: parseInt(trimmed, 10) };
  }

  renderArray(values) {
    this.arrayContainer.innerHTML = "";
    this.arrayElements = values.map((value, idx) => {
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
  }

  clearHighlights() {
    this.arrayElements.forEach(cell => {
      cell.classList.remove("current", "candidate", "parent", "child", "swap", "front");
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
    const pointerConfigs = [
      { field: "i", label: "i", className: "pointer-i" },
      { field: "parent", label: "p", className: "pointer-parent" },
      { field: "left", label: "L", className: "pointer-left" },
      { field: "right", label: "R", className: "pointer-right" }
    ];
    pointerConfigs.forEach(({ field, label, className }) => {
      const idx = step[field];
      if (Number.isInteger(idx)) this.setPointer(label, idx, className);
    });

    if (step.operation && step.heapSize > 0 && step.operation !== "build") {
      this.setPointer("front", 0, "pointer-front");
    }
    if (step.type === "peekFront" || step.type === "peekComplete") {
      this.setPointer("front", step.front ?? 0, "pointer-front");
    }
  }

  applyHighlights(step) {
    const mark = (idx, cls) => {
      if (!Number.isInteger(idx)) return;
      if (idx < 0 || idx >= this.arrayElements.length) return;
      this.arrayElements[idx].classList.add(cls);
    };

    switch (step.type) {
      case "heapifyLoop":
        mark(step.i, "current");
        break;
      case "siftStart":
        mark(step.i, "parent");
        if (Number.isInteger(step.left)) mark(step.left, "child");
        if (Number.isInteger(step.right)) mark(step.right, "child");
        break;
      case "siftCompareLeft":
        mark(step.i, "parent");
        mark(step.left, "child");
        break;
      case "siftCompareRight":
        mark(step.i, "parent");
        mark(step.right, "child");
        break;
      case "updateBest":
        mark(step.best, "candidate");
        break;
      case "siftCheck":
        mark(step.i, "parent");
        if (Number.isInteger(step.best) && step.best !== step.i) mark(step.best, "candidate");
        break;
      case "siftSwap":
      case "siftSwapDone":
      case "removeSwap":
      case "removeSwapDone":
        mark(step.swapA, "swap");
        mark(step.swapB, "swap");
        break;
      case "siftRecurse":
      case "siftSatisfied":
      case "siftComplete":
        mark(step.i, "parent");
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
        if (this.arrayElements.length) mark(0, "front");
        break;
      case "operationComplete":
        if (this.arrayElements.length && step.operation !== "build") mark(0, "front");
        break;
      case "peekFront":
      case "peekComplete":
        mark(step.front ?? 0, "front");
        break;
      default:
        break;
    }
  }

  setSnippet(key) {
    if (!prioritySnippets[key]) return;
    this.currentSnippet = key;
    this.codeTabs.forEach(tab => {
      tab.classList.toggle("active", tab.dataset.snippet === key);
    });
    this.codeLineMap = renderCodeBlock(this.codeBlock, prioritySnippets[key]);
    highlightLines(this.codeLineMap, this.activeCodeLines);
  }

  highlightCode(lines) {
    this.activeCodeLines = Array.isArray(lines) ? [...lines] : [];
    highlightLines(this.codeLineMap, this.activeCodeLines);
  }

  updateOperationUI() {
    const operation = this.getSelectedOperation();
    const showEnqueue = operation === "enqueue";
    if (this.enqueueField) this.enqueueField.classList.toggle("hidden", !showEnqueue);
    this.setSnippet(operation);
  }

  getSelectedHeapType() {
    const checked = this.typeInputs.find(input => input.checked);
    return checked ? checked.value : DEFAULT_TYPE;
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
