// src/visualizer.js
import { qs, el, renderCodeBlock } from "./dom.js";
import { quickSortCode } from "./codeSnippets.js";
import { generateQuickSortSteps } from "./steps.js";

export class QuickSortVisualizer {
  constructor() {
    this.arrayContainer = qs("#array-container");
    this.codeBlock = qs("#code-block");
    this.messageEl = qs("#message");
    this.inputEl = qs("#array-input");
    this.startBtn = qs("#start-btn");
    this.stepBtn = qs("#step-btn");
    this.toggleBtn = qs("#toggle-btn");
    this.resetBtn = qs("#reset-btn");
    this.pivotStatusEl = qs("#pivot-status");
    this.stepInfoEl = qs("#step-info");

    this.steps = [];
    this.stepIndex = 0;
    this.timer = null;
    this.isRunning = false;
    this.isPaused = false;
    this.initialArray = [];
    this.arrayElements = [];
    this.codeLineMap = new Map();
    this.sortedIndices = new Set();
    this.stepDelay = 800;

    this.codeLineMap = renderCodeBlock(this.codeBlock, quickSortCode);
    this.bindEvents();
    this.reset();
  }

  bindEvents() {
    this.startBtn.addEventListener("click", () => this.start());
    this.stepBtn.addEventListener("click", () => this.stepOnce());
    this.toggleBtn.addEventListener("click", () => this.togglePause());
    this.resetBtn.addEventListener("click", () => this.reset());
  }

  showMessage(text, isError=false) {
    this.messageEl.textContent = text || "";
    this.messageEl.classList.toggle("error", !!isError);
  }

  setStepInfo(text) {
    if (!this.stepInfoEl) return;
    this.stepInfoEl.textContent = text || "";
  }

  parseInput(text) {
    if (!text || !text.trim()) return { success:false, message:"Please provide at least one number." };
    const tokens = text.split(/[\s,]+/).map(s=>s.trim()).filter(Boolean);
    if (!tokens.length) return { success:false, message:"Please provide at least one number." };
    const numbers = [];
    for (const t of tokens) {
      if (!/^[-+]?\d+$/.test(t)) return { success:false, message:`Invalid number: "${t}".` };
      numbers.push(parseInt(t,10));
    }
    return { success:true, values:numbers };
  }

  start() {
    if (this.isRunning) return;
    if (!this.prepareSteps(true)) return;
    this.isRunning = true;
    this.isPaused = false;

    this.updateControls();
    this.playNextStep();
  }

  stepOnce() {
    if (this.isRunning) return;
    if (!this.steps.length && !this.prepareSteps(false)) return;
    if (!this.steps.length) return;
    if (this.stepIndex >= this.steps.length) return this.finish();

    const step = this.steps[this.stepIndex];
    this.applyStep(step);
    this.stepIndex += 1;

    if (this.stepIndex >= this.steps.length) this.finish();
    this.updateControls();
  }

  togglePause() { if (!this.isRunning) return; this.isPaused ? this.resume() : this.pause(); }
  pause() { if (!this.isRunning || this.isPaused) return; this.isPaused = true; if (this.timer) clearTimeout(this.timer); this.updateControls(); }
  resume() { if (!this.isRunning || !this.isPaused) return; this.isPaused = false; this.updateControls(); this.playNextStep(); }

  reset() {
    if (this.timer) clearTimeout(this.timer);
    this.isRunning = false; this.isPaused = false;
    this.steps = []; this.stepIndex = 0; this.sortedIndices.clear();

    const parsed = this.parseInput(this.inputEl.value);
    if (parsed.success) { this.initialArray = parsed.values.slice(); this.renderArray(this.initialArray); }
    else { this.arrayContainer.innerHTML = ""; }

    this.highlightCode([]); this.clearPointers();
    this.setPivotStatus(undefined, undefined, undefined);
    this.setStepInfo("Press Start for autoplay or Step to advance manually.");
    this.updateControls(); this.showMessage("");
  }

  prepareSteps(force = false) {
    if (!force && this.steps.length) return true;

    const parsed = this.parseInput(this.inputEl.value);
    if (!parsed.success) {
      this.showMessage(parsed.message, true);
      this.steps = [];
      this.stepIndex = 0;
      this.setStepInfo(parsed.message);
      return false;
    }

    this.showMessage("");
    this.initialArray = parsed.values.slice();
    this.renderArray(this.initialArray);
    this.steps = generateQuickSortSteps(this.initialArray);
    this.stepIndex = 0;
    this.sortedIndices.clear();

    this.highlightCode([]);
    this.clearPointers();
    this.clearHighlights();
    this.updateSortedHighlights();
    this.setPivotStatus(undefined, undefined, undefined);
    if (this.steps.length) this.setStepInfo("Ready. Click Step to follow quick sort or Start to autoplay.");
    else this.setStepInfo("Array is empty.");
    return true;
  }

  renderArray(values) {
    this.arrayContainer.innerHTML = "";
    this.arrayElements = values.map((v, idx) => {
      const cell = el("div", "array-item"); cell.dataset.index = String(idx);

      const pointers = el("div", "pointer-labels");
      const valueEl = el("div", "value"); valueEl.textContent = v;
      const indexEl = el("div", "index"); indexEl.textContent = `idx ${idx}`;

      cell.append(pointers, valueEl, indexEl);
      this.arrayContainer.appendChild(cell);
      return cell;
    });
  }

  playNextStep() {
    if (!this.isRunning || this.isPaused) return;
    if (this.stepIndex >= this.steps.length) { this.finish(); return; }

    const step = this.steps[this.stepIndex];
    this.applyStep(step);
    this.stepIndex += 1;

    if (this.stepIndex >= this.steps.length) { this.finish(); return; }
    this.timer = setTimeout(() => this.playNextStep(), this.stepDelay);
  }

  applyStep(step) {
    this.highlightCode(step.codeLines || []);
    this.updateArrayValues(step.array);
    this.clearHighlights();
    this.clearPointers();
    this.applyPointers(step);

    if (step.type === "done") {
      for (let i = 0; i < this.arrayElements.length; i++) this.sortedIndices.add(i);
    }

    this.applyHighlights(step);
    this.updateSortedHighlights();
    this.updatePivotStatus(step);
    this.setStepInfo(step.info || "");
  }

  updateArrayValues(values) {
    values.forEach((v, i) => {
      const el = this.arrayElements[i]; if (!el) return;
      const node = el.querySelector(".value"); if (node) node.textContent = v;
    });
  }

  clearHighlights(){ this.arrayElements.forEach(el=>el.classList.remove("current","compare","pivot","swap","sorted")); }
  clearPointers(){ this.arrayElements.forEach(el=>{ const p=el.querySelector(".pointer-labels"); if (p) p.innerHTML=""; }); }

  setPointer(label, index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.arrayElements.length) return;
    const el = this.arrayElements[index]; if (!el) return;
    const p = el.querySelector(".pointer-labels"); if (!p) return;
    const badge = el.ownerDocument.createElement("span");
    badge.className = `pointer pointer-${label}`;
    badge.textContent = label;
    p.appendChild(badge);
  }

  applyPointers(step) {
    const maybe = (lab, val) => { if (Number.isInteger(val)) this.setPointer(lab, val); };
    if ("pivotIndex" in step) maybe("p", step.pivotIndex);
    if ("i" in step) maybe("i", step.i);
    if ("j" in step) maybe("j", step.j);
    if (step.type === "bounds" || step.type === "baseReturn") {
      if (Number.isInteger(step.low)) maybe("i", step.low);
      if (Number.isInteger(step.high)) maybe("j", step.high);
    }
  }

  setPivotStatus(value, low, high, midIndex) {
    const line1 = `low = ${Number.isInteger(low) ? low : ""}, high = ${Number.isInteger(high) ? high : ""}`;
    const line2 = (typeof value === "number")
      ? `pivot value = ${value} (mid = ${Number.isInteger(midIndex) ? midIndex : "—"})`
      : "pivot value = ";
    this.pivotStatusEl.innerHTML = `${line1}, ${line2}`;
  }

  updatePivotStatus(step) {
    if (Object.prototype.hasOwnProperty.call(step, "pivotValue")) {
      this.setPivotStatus(step.pivotValue, step.low, step.high, step.pivotIndex);
    } else if (Object.prototype.hasOwnProperty.call(step, "low") || Object.prototype.hasOwnProperty.call(step, "high")) {
      this.setPivotStatus(undefined, step.low, step.high, step.pivotIndex);
    }
  }

  applyHighlights(step) {
    const hi = (idx, cls) => {
      if (!Number.isInteger(idx) || idx < 0 || idx >= this.arrayElements.length) return;
      this.arrayElements[idx].classList.add(cls);
    };

    switch (step.type) {
      case "choosePivot": hi(step.pivotIndex,"pivot"); break;
      case "initPointers":
      case "stopCheck":
        hi(step.pivotIndex,"pivot"); if (Number.isInteger(step.i)) hi(step.i,"current"); if (Number.isInteger(step.j)) hi(step.j,"compare"); break;
      case "scanLeftCheck":
      case "scanLeftInc":
        hi(step.pivotIndex,"pivot"); if (Number.isInteger(step.i)) hi(step.i,"current"); break;
      case "scanRightCheck":
      case "scanRightInc":
        hi(step.pivotIndex,"pivot"); if (Number.isInteger(step.j)) hi(step.j,"compare"); break;
      case "touchCompare":
        hi(step.pivotIndex,"pivot"); if (Number.isInteger(step.i)) hi(step.i,"current"); if (Number.isInteger(step.j)) hi(step.j,"compare"); break;
      case "swapLR":
        hi(step.pivotIndex,"pivot"); hi(step.i,"swap"); hi(step.j,"swap"); break;
      case "advancePointers":
        hi(step.pivotIndex,"pivot"); if (Number.isInteger(step.i)) hi(step.i,"current"); if (Number.isInteger(step.j)) hi(step.j,"compare"); break;
      case "returnIdx": hi(step.pivotIndex,"pivot"); break;
      case "bounds":
      case "baseReturn":
        if (Number.isInteger(step.low)) hi(step.low,"current");
        if (Number.isInteger(step.high)) hi(step.high,"compare");
        break;
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
    (lines || []).forEach(n => { const el = this.codeLineMap.get(n); if (el) el.classList.add("active"); });
  }

  finish() {
    this.isRunning = false; this.isPaused = false;
    this.clearPointers();
    this.highlightCode([]);
    this.setPivotStatus(undefined, undefined, undefined, undefined);
    this.updateControls();
  }

  updateControls() {
    if (this.isRunning) {
      this.startBtn.disabled = true;
      this.stepBtn.disabled = true;
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
