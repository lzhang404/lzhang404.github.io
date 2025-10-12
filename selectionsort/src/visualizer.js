import { qs, el, renderCodeBlock } from "./dom.js";
import { selectionSortCode } from "./codeSnippets.js";
import { generateSelectionSortSteps } from "./steps.js";

export class SelectionSortVisualizer {
  constructor() {
    this.arrayContainer = qs("#array-container");
    this.codeBlock = qs("#code-block");
    this.messageEl = qs("#message");
    this.inputEl = qs("#array-input");
    this.startBtn = qs("#start-btn");
    this.toggleBtn = qs("#toggle-btn");
    this.resetBtn = qs("#reset-btn");

    this.steps = [];
    this.stepIndex = 0;
    this.timer = null;
    this.isRunning = false;
    this.isPaused = false;
    this.initialArray = [];
    this.arrayElements = [];
    this.codeLineMap = new Map();
    this.sortedIndices = new Set();
    this.stepDelay = 900;

    this.codeLineMap = renderCodeBlock(this.codeBlock, selectionSortCode);
    this.bindEvents();
    this.reset();
  }

  bindEvents() {
    this.startBtn.addEventListener("click", () => this.start());
    this.toggleBtn.addEventListener("click", () => this.togglePause());
    this.resetBtn.addEventListener("click", () => this.reset());
  }

  showMessage(text, isError = false) {
    this.messageEl.textContent = text || "";
    this.messageEl.classList.toggle("error", !!isError);
  }

  parseInput(text) {
    if (!text || !text.trim())
      return { success: false, message: "Please provide at least one number." };
    const tokens = text.split(/[\s,]+/).map(t => t.trim()).filter(Boolean);
    if (!tokens.length)
      return { success: false, message: "Please provide at least one number." };

    const values = [];
    for (const t of tokens) {
      if (!/^[-+]?\d+$/.test(t))
        return { success: false, message: `Invalid number: "${t}".` };
      values.push(parseInt(t, 10));
    }
    return { success: true, values };
  }

  start() {
    if (this.isRunning) return;

    const parsed = this.parseInput(this.inputEl.value);
    if (!parsed.success) return this.showMessage(parsed.message, true);

    this.showMessage("");
    this.initialArray = parsed.values.slice();
    this.renderArray(this.initialArray);

    this.steps = generateSelectionSortSteps(this.initialArray);
    this.stepIndex = 0;
    this.sortedIndices.clear();
    this.isRunning = true;
    this.isPaused = false;

    this.updateControls();
    this.playNextStep();
  }

  togglePause() { this.isPaused ? this.resume() : this.pause(); }

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
    this.sortedIndices.clear();

    const defaults = this.parseInput(this.inputEl.value);
    if (defaults.success) {
      this.initialArray = defaults.values.slice();
      this.renderArray(this.initialArray);
    } else {
      this.arrayContainer.innerHTML = "";
    }

    this.highlightCode([]);
    this.clearPointers();
    this.updateControls();
    this.showMessage("");
  }

  renderArray(values) {
    this.arrayContainer.innerHTML = "";
    this.arrayElements = values.map((v, idx) => {
      const cell = el("div", "array-item");
      cell.dataset.index = String(idx);

      const pointerEl = el("div", "pointer-labels");
      const valueEl = el("div", "value"); valueEl.textContent = v;
      const indexEl = el("div", "index"); indexEl.textContent = `idx ${idx}`;

      cell.append(pointerEl, valueEl, indexEl);
      this.arrayContainer.appendChild(cell);
      return cell;
    });
  }

  playNextStep() {
    if (!this.isRunning || this.isPaused) return;
    if (this.stepIndex >= this.steps.length) return this.finish();

    const step = this.steps[this.stepIndex];
    this.applyStep(step);
    this.stepIndex += 1;

    if (this.stepIndex >= this.steps.length) return this.finish();
    this.timer = setTimeout(() => this.playNextStep(), this.stepDelay);
  }

  applyStep(step) {
    this.highlightCode(step.codeLines || []);
    this.updateArrayValues(step.array);

    this.clearHighlights();
    this.clearPointers();
    this.applyPointers(step);

    if (step.type === "iterationComplete") {
      for (let k = 0; k <= step.i; k++) this.sortedIndices.add(k);
    }
    if (step.type === "done") {
      for (let k = 0; k < this.arrayElements.length; k++) this.sortedIndices.add(k);
    }

    this.applyHighlights(step);
    this.updateSortedHighlights();
  }

  updateArrayValues(values) {
    values.forEach((v, i) => {
      const el = this.arrayElements[i];
      if (!el) return;
      const node = el.querySelector(".value");
      if (node) node.textContent = v;
    });
  }

  clearHighlights() {
    this.arrayElements.forEach(el =>
      el.classList.remove("current", "compare", "min", "swap")
    );
  }

  clearPointers() {
    this.arrayElements.forEach(el => {
      const p = el.querySelector(".pointer-labels");
      if (p) p.innerHTML = "";
    });
  }

  setPointer(label, index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.arrayElements.length) return;
    const el = this.arrayElements[index];
    const p = el.querySelector(".pointer-labels");
    if (!p) return;
    const badge = document.createElement("span");
    badge.className = `pointer pointer-${label}`;
    badge.textContent = label;
    p.appendChild(badge);
  }

  applyPointers(step) {
    const maybe = (lab, val) => { if (Number.isInteger(val)) this.setPointer(lab, val); };
    if ("i" in step) maybe("i", step.i);
    if ("j" in step) maybe("j", step.j);
  }

  applyHighlights(step) {
    const hi = (idx, cls) => {
      if (!Number.isInteger(idx) || idx < 0 || idx >= this.arrayElements.length) return;
      this.arrayElements[idx].classList.add(cls);
    };

    switch (step.type) {
      case "outerLoopStart":
        hi(step.i, "current"); break;
      case "setMin":
        hi(step.i, "current"); hi(step.minIdx, "min"); break;
      case "innerLoopCheck":
      case "compare":
        hi(step.i, "current"); hi(step.minIdx, "min"); hi(step.j, "compare"); break;
      case "updateMin":
        hi(step.i, "current"); hi(step.j, "min"); break;
      case "checkSwap":
        hi(step.i, "current"); hi(step.minIdx, "min"); break;
      case "swap":
        hi(step.i, "swap"); hi(step.minIdx, "swap"); break;
      default: break;
    }
  }

  updateSortedHighlights() {
    this.arrayElements.forEach((el, idx) => {
      if (this.sortedIndices.has(idx)) el.classList.add("sorted");
      else el.classList.remove("sorted");
    });
  }

  highlightCode(lines) {
    this.codeLineMap.forEach(el => el.classList.remove("active"));
    (lines || []).forEach(n => {
      const el = this.codeLineMap.get(n);
      if (el) el.classList.add("active");
    });
  }

  finish() {
    this.isRunning = false;
    this.isPaused = false;
    this.clearPointers();
    this.updateControls();
  }

  updateControls() {
    if (this.isRunning) {
      this.startBtn.disabled = true;
      this.toggleBtn.disabled = false;
      this.toggleBtn.textContent = this.isPaused ? "Resume" : "Pause";
    } else {
      this.startBtn.disabled = false;
      this.toggleBtn.disabled = true;
      this.toggleBtn.textContent = "Pause";
    }
  }
}
