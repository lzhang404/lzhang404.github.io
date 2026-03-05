// src/visualizer.js
import { qs, el, renderCodeBlock } from "./dom.js";
import { mergeSortCode } from "./codeSnippets.js";
import { generateMergeSortSteps } from "./steps.js";

export class MergeSortVisualizer {
  constructor() {
    this.levelsContainer = qs("#levels-container");
    this.infoEl = qs("#merge-info");
    this.codeBlock = qs("#code-block");
    this.messageEl = qs("#message");
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
    this.stepDelay = 1100;

    this.initialValues = [];
    this.currentArray = [];

    this.codeLineMap = renderCodeBlock(this.codeBlock, mergeSortCode);
    this.bindEvents();
    this.mergedSnapshots = new Map(); 
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

  escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  setCaption(varsText = "", infoText = "") {
    if (!this.infoEl) return;
    const info = infoText || "";
    const vars = varsText || "";
    if (!vars) {
      this.infoEl.textContent = info;
      return;
    }
    this.infoEl.innerHTML = `<div class="caption-vars">${this.escapeHtml(vars)}</div><div class="caption-info">${this.escapeHtml(info)}</div>`;
  }

  parseInput(text) {
    if (!text || !text.trim()) return { success: false, message: "Please provide at least one number." };
    const tokens = text.split(/[\s,]+/).map(t => t.trim()).filter(Boolean);
    if (!tokens.length) return { success: false, message: "Please provide at least one number." };
    const nums = [];
    for (const t of tokens) {
      if (!/^[-+]?\d+$/.test(t)) return { success: false, message: `Invalid number: "${t}".` };
      nums.push(parseInt(t, 10));
    }
    return { success: true, values: nums };
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

  togglePause() { this.isPaused ? this.resume() : this.pause(); }

  reset() {
    if (this.timer) clearTimeout(this.timer);
    this.isRunning = false;
    this.isPaused = false;
    this.steps = [];
    this.stepIndex = 0;

    const parsed = this.parseInput(this.inputEl.value);
    if (parsed.success) {
      this.initialValues = parsed.values.slice(); // set BEFORE render
      const initialLevels = parsed.values.length
        ? [[{ left: 0, right: parsed.values.length - 1, values: parsed.values.slice() }]]
        : [];
      this.renderLevels(initialLevels, { segments: [] },
        parsed.values.length ? "Ready to start merge sort." : "Array is empty.");
      this.setCaption("", parsed.values.length ? "Ready to start merge sort." : "Array is empty.");
    } else {
      this.levelsContainer.innerHTML = "";
      this.setCaption("", parsed.message);
    }
    this.highlightCode([]);
    this.updateControls();
    this.showMessage("");
    this.mergedSnapshots.clear();
  }

  prepareSteps(force = false) {
    if (!force && this.steps.length) return true;

    const parsed = this.parseInput(this.inputEl.value);
    if (!parsed.success) {
      this.showMessage(parsed.message, true);
      this.steps = [];
      this.stepIndex = 0;
      this.setCaption("", parsed.message);
      return false;
    }

    this.showMessage("");
    this.initialValues = parsed.values.slice();
    this.steps = generateMergeSortSteps(parsed.values);
    this.stepIndex = 0;
    this.mergedSnapshots.clear();
    this.highlightCode([]);

    const initialLevels = parsed.values.length
      ? [[{ left: 0, right: parsed.values.length - 1, values: parsed.values.slice() }]]
      : [];
    this.renderLevels(
      initialLevels,
      { segments: [] },
      parsed.values.length
        ? "Ready. Click Step to follow merge sort or Start to autoplay."
        : "Array is empty."
    );
    this.setCaption(
      "",
      parsed.values.length
        ? "Ready. Click Step to follow merge sort or Start to autoplay."
        : "Array is empty."
    );
    return true;
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
    this.currentArray = step.array || [];

    if (step.type === "mergeComplete" && step.highlight && step.highlight.segments) {
      const seg = step.highlight.segments.find(s => s.role === "merged");
      if (seg) {
        const key = `${seg.depth}:${seg.left}:${seg.right}`;
        // store the exact values at merge completion (not a reference to currentArray)
        this.mergedSnapshots.set(
          key,
          this.currentArray.slice(seg.left, seg.right + 1)
        );
      }
    }
    this.renderLevels(
      step.levels || [],
      step.highlight || { segments: [] },
      step.info || "",
      step.buffers || null,
      step.type || ""
    );
    this.setCaption(step.varsText || "", step.info || "");
  }

  renderLevels(levels, highlight, info, buffers, stepType) {
    this.levelsContainer.innerHTML = "";

    const highlightMap = new Map();
    (highlight.segments || []).forEach(seg => {
      const key = `${seg.depth}:${seg.left}:${seg.right}`;
      if (!highlightMap.has(key)) highlightMap.set(key, []);
      highlightMap.get(key).push(seg.role);
    });

    (levels || []).forEach((segments, depth) => {
      if (!segments || !segments.length) return;

      const row = el("div", "level-row");
      const label = el("div", "level-label");
      label.textContent = `Level ${depth}`;
      row.appendChild(label);

      const segmentsWrap = el("div", "segments");

      segments.forEach(seg => {
        const segEl = el("div", "segment");
        const key = `${depth}:${seg.left}:${seg.right}`;
        const roles = highlightMap.get(key) || [];

        roles.forEach(role => {
          if (role === "current") segEl.classList.add("segment-current");
          else if (role === "parent") segEl.classList.add("segment-parent");
          else if (role === "left") segEl.classList.add("segment-left");
          else if (role === "right") segEl.classList.add("segment-right");
          else if (role === "merge-left") segEl.classList.add("segment-merge-left");
          else if (role === "merge-right") segEl.classList.add("segment-merge-right");
          else if (role === "merge-target" || role === "segment-placing") {
            segEl.classList.add("segment-merge-target");
            if (role === "segment-placing") segEl.classList.add("segment-placing");
          } else if (role === "merged") segEl.classList.add("segment-merged");
        });

        const rangeEl = el("div", "segment-range");
        rangeEl.textContent = `[${seg.left}, ${seg.right}]`;
        segEl.appendChild(rangeEl);  
        
        const isActiveMergeTarget =
          buffers && buffers.ctx &&
          depth === buffers.ctx.depth &&
          seg.left === buffers.ctx.left &&
          seg.right === buffers.ctx.right;

        const snapKey = `${depth}:${seg.left}:${seg.right}`;
        let valuesToShow;

        if (isActiveMergeTarget) {
          // Only the currently merging segment shows live writes
          valuesToShow = (this.currentArray || []).slice(seg.left, seg.right + 1);
        } else if (this.mergedSnapshots.has(snapKey)) {
          // Once merged, the snapshot is frozen forever for this depth/segment
          valuesToShow = this.mergedSnapshots.get(snapKey).slice();
        } else {
          // Not merged yet -> show the original input values
          valuesToShow = (this.initialValues || []).slice(seg.left, seg.right + 1);
        }

        const valuesWrap = el("div", "segment-values");
        valuesToShow.forEach(v => {
          const valueEl = el("span");
          valueEl.textContent = v;
          valuesWrap.appendChild(valueEl);
        });
        segEl.appendChild(valuesWrap);

        if (isActiveMergeTarget) {
          const bufferBox = el("div");
          bufferBox.style.marginTop = "0.5rem";
          bufferBox.style.display = "grid";
          bufferBox.style.gridTemplateColumns = "1fr 1fr";
          bufferBox.style.gap = "0.5rem";

          const makeBuf = (label, arr, activeIdx, side) => {
            const box = el("div", `buffer ${side === "left" ? "buffer-left" : "buffer-right"}`);
            const title = el("div", "buffer-label"); title.textContent = label;
            const cells = el("div", "buffer-cells");
            arr.forEach((val, idx) => {
              const cell = el("span", "cell");
              cell.textContent = val;
              if (idx < activeIdx) cell.classList.add("exhausted");
              if (idx === activeIdx) cell.classList.add("compare");
              cells.appendChild(cell);
            });
            box.append(title, cells);
            return box;
          };

          const leftBuf  = (buffers.leftBuf  || []).slice();
          const rightBuf = (buffers.rightBuf || []).slice();
          const i = buffers.i || 0;
          const j = buffers.j || 0;

          bufferBox.append(
            makeBuf("Left buffer", leftBuf, i, "left"),
            makeBuf("Right buffer", rightBuf, j, "right")
          );
          segEl.appendChild(bufferBox);
        }

        segmentsWrap.appendChild(segEl);
      });

      row.appendChild(segmentsWrap);
      this.levelsContainer.appendChild(row);
    });

    this.infoEl.textContent = info || "";
  }

  highlightCode(lines) {
    const first = Array.isArray(lines) ? (lines[0] ?? null) : (typeof lines === "number" ? lines : null);
    this.codeLineMap?.forEach((el, n) => {
      if (first !== null && n === first) el.classList.add("active");
      else el.classList.remove("active");
    });
  }

  finish() {
    this.isRunning = false;
    this.isPaused = false;
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
