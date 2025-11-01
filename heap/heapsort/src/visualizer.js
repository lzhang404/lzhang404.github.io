import { qs, el, renderCodeBlock } from "./dom.js";
import { heapSortCode } from "./codeSnippets.js";
import { generateHeapSortSteps } from "./steps.js";

export class HeapSortVisualizer {
  constructor() {
    this.arrayContainer = qs("#array-container");
    this.codeBlock = qs("#code-block");
    this.messageEl = qs("#message");
    this.stepInfoEl = qs("#step-info");
    this.inputEl = qs("#array-input");
    this.startBtn = qs("#start-btn");
    this.stepBtn = qs("#step-btn");
    this.toggleBtn = qs("#toggle-btn");
    this.resetBtn = qs("#reset-btn");

    this.steps = [];
    this.stepIndex = 0;
    this.timer = null;
    this.isRunning = false;
    this.isPaused = false;
    this.stepDelay = 900;

    this.initialArray = [];
    this.arrayElements = [];
    this.codeLineMap = renderCodeBlock(this.codeBlock, heapSortCode);

    this.bindEvents();
    this.reset();
  }

  bindEvents() {
    this.startBtn.addEventListener("click", () => this.start());
    this.stepBtn.addEventListener("click", () => this.stepOnce());
    this.toggleBtn.addEventListener("click", () => this.togglePause());
    this.resetBtn.addEventListener("click", () => this.reset());
  }

  showMessage(text, isError = false) {
    this.messageEl.textContent = text || "";
    this.messageEl.classList.toggle("error", !!isError);
  }

  setStepInfo(text) {
    if (!this.stepInfoEl) return;
    this.stepInfoEl.textContent = text || "";
  }

  parseInput(text) {
    if (!text || !text.trim()) {
      return { success: false, message: "Please provide at least one number." };
    }
    const tokens = text.split(/[\s,]+/).map(t => t.trim()).filter(Boolean);
    if (!tokens.length) {
      return { success: false, message: "Please provide at least one number." };
    }

    const values = [];
    for (const token of tokens) {
      if (!/^[-+]?\d+$/.test(token)) {
        return { success: false, message: `Invalid number: "${token}".` };
      }
      values.push(parseInt(token, 10));
    }
    return { success: true, values };
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
    this.isRunning = false;
    this.isPaused = false;
    this.steps = [];
    this.stepIndex = 0;

    const parsed = this.parseInput(this.inputEl.value);
    if (parsed.success) {
      this.initialArray = parsed.values.slice();
      this.renderArray(this.initialArray);
      this.setStepInfo("Press Start for autoplay or Step to advance manually.");
    } else {
      this.arrayContainer.innerHTML = "";
      this.arrayElements = [];
      this.setStepInfo(parsed.message);
    }

    this.highlightCode([]);
    this.clearHighlights();
    this.clearPointers();
    this.updateHeapRegion(0);
    this.updateSortedHighlights([]);
    this.updateControls();
    this.showMessage("");
  }

  prepareSteps(force = false) {
    if (!force && this.steps.length) return true;

    const parsed = this.parseInput(this.inputEl.value);
    if (!parsed.success) {
      this.showMessage(parsed.message, true);
      this.setStepInfo(parsed.message);
      this.steps = [];
      this.stepIndex = 0;
      return false;
    }

    this.showMessage("");
    this.initialArray = parsed.values.slice();
    this.renderArray(this.initialArray);

    this.steps = generateHeapSortSteps(this.initialArray);
    this.stepIndex = 0;

    this.highlightCode([]);
    this.clearHighlights();
    this.clearPointers();
    this.updateHeapRegion(0);
    this.updateSortedHighlights([]);

    if (this.steps.length) {
      this.setStepInfo("Ready. Click Step to follow heap sort or Start to autoplay.");
    } else {
      this.setStepInfo("Array is empty.");
    }

    return true;
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

  playNextStep() {
    if (!this.isRunning || this.isPaused) return;
    if (this.stepIndex >= this.steps.length) {
      this.finish();
      return;
    }

    const step = this.steps[this.stepIndex];
    this.applyStep(step);
    this.stepIndex += 1;

    if (this.stepIndex >= this.steps.length) {
      this.finish();
      return;
    }

    this.timer = setTimeout(() => this.playNextStep(), this.stepDelay);
  }

  stepOnce() {
    if (!this.steps.length) {
      if (!this.prepareSteps(false)) return;
    }
    if (!this.steps.length) return;
    if (this.stepIndex >= this.steps.length) {
      this.finish();
      return;
    }

    const step = this.steps[this.stepIndex];
    this.applyStep(step);
    this.stepIndex += 1;

    if (this.stepIndex >= this.steps.length) {
      this.finish();
    }
  }

  applyStep(step) {
    this.highlightCode(step.codeLines || []);
    this.updateArrayValues(step.array);
    this.updateHeapRegion(step.heapSize ?? this.arrayElements.length);
    this.updateSortedHighlights(step.sorted || []);

    this.clearHighlights();
    this.clearPointers();
    this.applyPointers(step);
    this.applyHighlights(step);

    this.setStepInfo(step.info || "");
  }

  updateArrayValues(values) {
    values.forEach((value, idx) => {
      const cell = this.arrayElements[idx];
      if (!cell) return;
      const valueEl = cell.querySelector(".value");
      if (valueEl) valueEl.textContent = value;
    });
  }

  updateHeapRegion(heapSize) {
    const size = Number.isInteger(heapSize) ? heapSize : this.arrayElements.length;
    this.arrayElements.forEach((cell, idx) => {
      if (idx < size) cell.classList.add("heap");
      else cell.classList.remove("heap");
    });
  }

  updateSortedHighlights(sortedIndices) {
    const sortedSet = new Set(sortedIndices || []);
    this.arrayElements.forEach((cell, idx) => {
      if (sortedSet.has(idx)) cell.classList.add("sorted");
      else cell.classList.remove("sorted");
    });
  }

  clearHighlights() {
    this.arrayElements.forEach(cell => {
      cell.classList.remove("current", "candidate", "child", "swap");
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
    const container = cell.querySelector(".pointer-labels");
    if (!container) return;

    const badge = document.createElement("span");
    badge.className = `pointer ${className}`;
    badge.textContent = label;
    container.appendChild(badge);
  }

  applyPointers(step) {
    const pointerConfigs = [
      { field: "i", label: "i", className: "pointer-i" },
      { field: "largest", label: "max", className: "pointer-max" },
      { field: "left", label: "L", className: "pointer-l" },
      { field: "right", label: "R", className: "pointer-r" },
      { field: "heapEnd", label: "end", className: "pointer-end" }
    ];
    pointerConfigs.forEach(({ field, label, className }) => {
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

    switch (step.type) {
      case "buildLoop":
      case "heapifyStart":
      case "heapifySatisfied":
      case "heapifyComplete":
      case "heapifyAfterExtract":
      case "recurse":
        mark(step.i, "current");
        if (Number.isInteger(step.left)) mark(step.left, "child");
        if (Number.isInteger(step.right)) mark(step.right, "child");
        if (Number.isInteger(step.largest) && step.largest !== step.i) mark(step.largest, "candidate");
        break;
      case "compareLeft":
        mark(step.i, "current");
        mark(step.left, "child");
        mark(step.largest, "candidate");
        break;
      case "leftOutOfBounds":
        mark(step.i, "current");
        break;
      case "compareRight":
        mark(step.i, "current");
        mark(step.right, "child");
        mark(step.largest, "candidate");
        break;
      case "rightOutOfBounds":
        mark(step.i, "current");
        break;
      case "updateLargest":
        mark(step.i, "current");
        mark(step.largest, "candidate");
        break;
      case "checkSwap":
        mark(step.i, "current");
        mark(step.largest, "candidate");
        break;
      case "swapNodes":
      case "swapDone":
      case "swapRoot":
      case "swapRootDone":
        mark(step.swapA, "swap");
        mark(step.swapB, "swap");
        break;
      case "extractMax":
        mark(step.i, "current");
        mark(step.heapEnd, "candidate");
        break;
      default:
        break;
    }
  }

  highlightCode(lines) {
    this.codeLineMap.forEach(node => node.classList.remove("active"));
    (lines || []).forEach(line => {
      const el = this.codeLineMap.get(line);
      if (el) el.classList.add("active");
    });
  }

  finish() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.updateControls();
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
