import { qs, el, renderCodeBlock } from "./dom.js";
import { radixCode } from "./codeSnippets.js";
import { generateRadixSteps } from "./steps.js";

export default class RadixSortVisualizer {
  constructor() {
    // DOM
    this.codeBlock      = qs("#code-block");
    this.messageEl      = qs("#message");
    this.inputEl        = qs("#array-input");
    this.startBtn       = qs("#start-btn");
    this.stepBtn        = qs("#step-btn");
    this.toggleBtn      = qs("#toggle-btn");
    this.resetBtn       = qs("#reset-btn");
    this.passEl         = qs("#radix-pass");

    // tables & captions
    this.arrayTable     = qs("#array-table");
    this.bucketTable    = qs("#bucket-table");
    this.arrayCaptionEl = qs("#array-caption");

    // state
    this.steps = [];
    this.stepIndex = 0;
    this.timer = null;
    this.isRunning = false;
    this.isPaused = false;
    this.stepDelay = 1000;
    this.collectedIndices = new Set();

    this.initial = [];
    this.codeLineMap = renderCodeBlock(this.codeBlock, radixCode);

    this.bind();
    this.reset();
  }

  bind() {
    this.startBtn.addEventListener("click", () => this.start());
    this.stepBtn.addEventListener("click", () => this.stepOnce());
    this.toggleBtn.addEventListener("click", () => this.togglePause());
    this.resetBtn.addEventListener("click", () => this.reset());
  }

  showMessage(text, isError=false) {
    this.messageEl.textContent = text || "";
    this.messageEl.classList.toggle("error", !!isError);
  }

  parseInput(text) {
    if (!text || !text.trim()) return { success:false, message:"Please provide at least one number." };
    const tokens = text.split(/[\s,]+/).map(t => t.trim()).filter(Boolean);
    const nums = [];
    for (const t of tokens) {
      nums.push(parseInt(t, 10));
    }
    return { success:true, values:nums };
  }

  // ---------- lifecycle ----------
  start() {
    if (this.isRunning) return;
    if (!this.prepareSteps(true)) return;
    this.isRunning = true; this.isPaused = false;
    this.updateControls();
    this.playNext();
  }

  stepOnce() {
    if (this.isRunning) return;
    if (!this.steps.length && !this.prepareSteps(false)) return;
    if (!this.steps.length) return;
    if (this.stepIndex >= this.steps.length) return this.finish();

    const step = this.steps[this.stepIndex];
    this.applyStep(step);
    this.stepIndex++;

    if (this.stepIndex >= this.steps.length) this.finish();
    this.updateControls();
  }

  reset() {
    if (this.timer) clearTimeout(this.timer);
    this.isRunning = false; this.isPaused = false;
    this.steps = []; this.stepIndex = 0;

    const parsed = this.parseInput(this.inputEl.value);
    if (parsed.success) {
      this.initial = parsed.values.slice();
      this.renderArrayTable(this.initial);
    } else {
      this.arrayTable.innerHTML = "";
    }
    this.renderBucketTable(Array.from({length:10},()=>[]));
    this.setArrayCaption("unsorted");
    this.highlightCode([]);
    this.setPass(1, 1);
    this.updateControls();
    this.showMessage("");
    this.collectedIndices.clear();
  }

  prepareSteps(force = false) {
    if (!force && this.steps.length) return true;

    const parsed = this.parseInput(this.inputEl.value);
    if (!parsed.success) {
      this.showMessage(parsed.message, true);
      this.steps = [];
      this.stepIndex = 0;
      return false;
    }

    this.showMessage("");
    this.initial = parsed.values.slice();
    this.renderArrayTable(this.initial);
    this.renderBucketTable(Array.from({ length: 10 }, () => []));
    this.setArrayCaption("unsorted");
    this.setPass(1, 1);
    this.collectedIndices.clear();
    this.highlightCode([]);

    this.steps = generateRadixSteps(this.initial);
    this.stepIndex = 0;
    return true;
  }

  togglePause(){ this.isPaused ? this.resume() : this.pause(); }
  pause(){ if(!this.isRunning||this.isPaused) return; this.isPaused=true; if(this.timer) clearTimeout(this.timer); this.updateControls(); }
  resume(){ if(!this.isRunning||!this.isPaused) return; this.isPaused=false; this.updateControls(); this.playNext(); }

  playNext() {
    if (!this.isRunning || this.isPaused) return;
    if (this.stepIndex >= this.steps.length) return this.finish();

    const step = this.steps[this.stepIndex];
    this.applyStep(step);
    this.stepIndex++;

    if (this.stepIndex >= this.steps.length) return this.finish();
    this.timer = setTimeout(() => this.playNext(), this.stepDelay);
  }

  finish() {
    this.isRunning = false; this.isPaused = false;
    this.updateControls();
  }

  // ---------- captions ----------
  setArrayCaption(text){ if(this.arrayCaptionEl) this.arrayCaptionEl.textContent = text; }
  setPass(pass, exp) {
    if (!this.passEl) return;
    if (pass === "done") this.passEl.textContent = "complete ✓";
    else this.passEl.textContent = `pass = ${pass} (place = ${exp})`;
  }

  // ---------- renderers ----------
  renderArrayTable(values) {
    this.arrayTable.innerHTML = "";
    values.forEach((v, idx) => {
      const row = el("div", "vrow");
      const c1  = el("div", "vcell index"); c1.textContent = `${idx}`;
      const c2  = el("div", "vcell value");
      const chip = el("span", "chip"); chip.textContent = v;
      if (this.collectedIndices.has(idx)) chip.classList.add("collected-chip");
      c2.appendChild(chip);
      row.append(c1, c2);
      this.arrayTable.appendChild(row);
    });
  }

  updateArrayTable(values, copyIndex = null) {
    this.renderArrayTable(values);
    if (Number.isInteger(copyIndex)) {
      const row = this.arrayTable.children[copyIndex];
      if (row) row.querySelector(".vcell.value")?.classList.add("copy-mark");
      setTimeout(()=> row?.querySelector(".vcell.value")?.classList.remove("copy-mark"), 250);
    }
  }

  renderBucketTable(buckets) {
    this.bucketTable.innerHTML = "";
    for (let d = 0; d < 10; d++) {
      const row = el("div", "vrow");
      const c1  = el("div", "vcell index"); c1.textContent = `${d}`;
      const c2  = el("div", "vcell value");
      (buckets[d] || []).forEach(num => {
        const chip = el("span", "chip"); chip.textContent = num;
        if (num === null) chip.classList.add("chip-removed");
        c2.appendChild(chip);
      });
      row.append(c1, c2);
      this.bucketTable.appendChild(row);
    }
  }

  highlightCode(lines) {
    this.codeLineMap?.forEach((el) => el.classList.remove("active"));
    (lines || []).forEach((n) => {
      const el = this.codeLineMap?.get(n);
      if (el) el.classList.add("active");
    });
  }

  // ---------- step application ----------
  applyStep(step) {
    this.highlightCode(step.codeLines || []);

    if (step.array) this.updateArrayTable(step.array);

    switch (step.type) {
      case "passStart":
        this.setPass(step.pass, step.exp);
        this.collectedIndices.clear();
        this.showMessage(`Start distributing (${step.exp}s digit)`);
        this.setArrayCaption(``);
        break;

      case "bucketPlace":
        this.showMessage(`Placing ${step.value} into bucket ${step.digit}`);
        if (step.buckets) this.renderBucketTable(step.buckets);
        // quick highlight for the placed chip
        {
          const bucketRow = this.bucketTable.children[step.digit];
          const chips = bucketRow?.querySelectorAll(".chip");
          const chip = [...(chips||[])].find(c => c.textContent == String(step.value));
          if (chip) {
            chip.classList.add("highlight-chip");
            setTimeout(() => chip.classList.remove("highlight-chip"), 350);
          }
        }
        break;

      case "bucketCollectStart":
        this.showMessage(`Collecting from bucket ${step.digit}`);
        if (step.buckets) this.renderBucketTable(step.buckets);
        break;

      case "collectOne":
        this.showMessage(`Copy ${step.value} → array[${step.toIndex}]`);
        if (step.buckets) this.renderBucketTable(step.buckets);
        if (Number.isInteger(step.toIndex)) {
          this.collectedIndices.add(step.toIndex);
          this.updateArrayTable(step.array);
        }
        break;

      case "passEnd":
        this.showMessage(`Pass finished for ${step.exp}s digit`);
        this.setArrayCaption(`sorted for ${step.exp}s digit`);
        this.renderBucketTable(Array.from({length:10},()=>[]));
        break;

      case "negativesAdjustStart": {
        const neg = (step.negatives ?? []).join(", ");
        const non = (step.nonNegatives ?? []).join(", ");
        this.showMessage(`Split negatives: [${neg}]  |  non-negatives: [${non}]`);
        break;
      }

      case "negativesReverse": {
        const neg = (step.negatives ?? []).join(", ");
        const non = (step.nonNegatives ?? []).join(", ");
        this.showMessage(`Reversed negatives: [${neg}]  |  non-negatives: [${non}]`);
        break;
      }

      case "negativesConcat": {
        const neg = (step.negatives ?? []).join(", ");
        const non = (step.nonNegatives ?? []).join(", ");
        const fin = (step.final ?? []).join(", ");
        this.showMessage(`Final = negatives + non-negatives  [${fin}]`);
        // keep array table in sync (arr already mutated in steps.js)
        if (step.array) this.updateArrayTable(step.array);
        break;
      }
      case "done":
        this.setPass("done", "");
        this.showMessage("All digits processed");
        this.setArrayCaption("fully sorted");
        break;


    }
  }

  // ---------- controls ----------
  updateControls() {
    if (this.isRunning) {
      this.startBtn.disabled = true;
      this.startBtn.classList.add("disabled");
      this.stepBtn.disabled = true;
      this.toggleBtn.disabled = false;
      this.toggleBtn.textContent = this.isPaused ? "Resume" : "Pause";
    } else {
      this.startBtn.disabled = false;
      this.startBtn.classList.remove("disabled");
      this.stepBtn.disabled = false;
      this.toggleBtn.disabled = true;
      this.toggleBtn.textContent = "Pause";
    }
  }
}
