import { qs, renderCodeBlock, highlightLines } from "./dom.js";
import { parseGraphInput, computeCircularLayout, validateStartNode } from "./graphUtils.js";
import { GraphRenderer } from "./graphRenderer.js";
import { traversalSnippets } from "./codeSnippets.js";

const STEP_DELAY = 900;

export class TraversalBase {
  constructor({ snippetKey, structureLabel, defaultEdges, defaultStart, allowDirected = true }) {
    this.allowDirected = allowDirected;
    this.defaultEdges = defaultEdges;
    this.defaultStart = defaultStart;
    this.structureLabel = structureLabel;
    this.currentSnippetKey = snippetKey;

    this.edgesInput = qs("#edge-input");
    this.startInput = qs("#start-node");
    this.directedInput = qs("#directed-toggle");
    this.messageEl = qs("#message");
    this.stepInfoEl = qs("#step-info");
    this.statusEl = qs("#status");
    this.structureLabelEl = qs("#structure-label");
    this.structureItemsEl = qs("#structure-items");
    this.secondaryLabelEl = qs("#secondary-label");
    this.secondaryItemsEl = qs("#secondary-items");
    this.codeBlock = qs("#code-block");
    this.codeTabs = Array.from(document.querySelectorAll(".code-tabs .tab"));
    const svg = qs("#graph-canvas");
    this.renderer = new GraphRenderer(svg);

    this.startBtn = qs("#start-btn");
    this.stepBtn = qs("#step-btn");
    this.toggleBtn = qs("#toggle-btn");
    this.resetBtn = qs("#reset-btn");

    this.steps = [];
    this.stepIndex = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.timer = null;
    this.parsedGraph = null;

    if (!this.allowDirected && this.directedInput) {
      this.directedInput.checked = false;
      this.directedInput.disabled = true;
      const label = this.directedInput.closest("label");
      if (label) label.classList.add("disabled");
    }

    if (this.structureLabelEl) {
      this.structureLabelEl.textContent = structureLabel;
    }

    this.renderSnippet(this.currentSnippetKey);
    this.bindEvents();
    this.reset(true);
  }

  bindEvents() {
    this.startBtn?.addEventListener("click", () => this.start());
    this.stepBtn?.addEventListener("click", () => this.stepOnce());
    this.toggleBtn?.addEventListener("click", () => this.togglePause());
    this.resetBtn?.addEventListener("click", () => this.reset());
    this.directedInput?.addEventListener("change", () => this.reset(true));

    this.codeTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const key = tab.dataset.snippet;
        if (!key || key === this.currentSnippetKey) return;
        this.setSnippet(key);
      });
    });
  }

  renderSnippet(key) {
    const lines = traversalSnippets[key];
    if (!lines) return;
    if (this.codeTabs.length) {
      this.codeTabs.forEach(tab => {
        tab.classList.toggle("active", tab.dataset.snippet === key);
      });
    }
    this.codeLineMap = renderCodeBlock(this.codeBlock, lines);
    this.currentSnippetKey = key;
  }

  setSnippet(key) {
    this.renderSnippet(key);
    this.highlightCode([]);
    this.setStatus("");
  }

  highlightCode(lines) {
    if (!this.codeLineMap) return;
    highlightLines(this.codeLineMap, lines);
  }

  setMessage(text, isError = false) {
    if (!this.messageEl) return;
    this.messageEl.textContent = text ?? "";
    this.messageEl.classList.toggle("error", Boolean(isError));
  }

  setStepInfo(text) {
    if (!this.stepInfoEl) return;
    this.stepInfoEl.textContent = text ?? "";
  }

  updateControls() {
    const running = this.isRunning && !this.isPaused;
    if (this.startBtn) this.startBtn.disabled = this.isRunning;
    if (this.stepBtn) this.stepBtn.disabled = running;
    if (this.toggleBtn) {
      this.toggleBtn.disabled = !this.isRunning;
      this.toggleBtn.textContent = this.isPaused ? "Resume" : "Pause";
    }
  }

  reset(skipMessage = false) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    this.isPaused = false;
    this.steps = [];
    this.stepIndex = 0;

    if (this.edgesInput && this.defaultEdges && !this.edgesInput.value.trim()) {
      this.edgesInput.value = this.defaultEdges;
    }
    if (this.startInput && this.defaultStart && !this.startInput.value.trim()) {
      this.startInput.value = this.defaultStart;
    }

    if (!skipMessage) this.setMessage("");
    this.setStepInfo("Configure the graph and press Start to animate the traversal.");
    this.highlightCode([]);
    this.structureItemsEl.innerHTML = "";
    if (this.secondaryItemsEl) this.secondaryItemsEl.innerHTML = "";
    this.updateControls();

    const parsed = this.parseGraph(false);
    if (parsed.success && parsed.graph) {
      this.renderer.render(parsed.graph, computeCircularLayout(parsed.graph.nodes));
      this.applyInitialState(parsed.initialState || {});
    } else {
      this.renderer.render({ nodes: [], edges: [], directed: false, weighted: false }, computeCircularLayout([]));
    }
  }

  parseGraph(forceMessage = true) {
    if (!this.edgesInput) {
      return { success: false, message: "Input textarea not found." };
    }

    const directed = this.allowDirected ? Boolean(this.directedInput?.checked) : false;
    const graphResult = parseGraphInput(this.edgesInput.value, {
      directed,
      weighted: this.isWeighted(),
    });
    if (!graphResult.success) {
      if (forceMessage) this.setMessage(graphResult.message, true);
      this.parsedGraph = null;
      return graphResult;
    }

    const graph = graphResult.graph;
    const startNode = this.startInput?.value.trim();
    const startCheck = validateStartNode(graph, startNode);
    if (!startCheck.success) {
      if (forceMessage) this.setMessage(startCheck.message, true);
      this.parsedGraph = null;
      return { success: false, message: startCheck.message };
    }

    const layout = computeCircularLayout(graph.nodes);
    this.parsedGraph = { graph, layout, start: startNode };
    return { success: true, graph, layout, start: startNode };
  }

  start() {
    if (this.isRunning) return;
    if (!this.prepareSteps(true)) return;

    this.isRunning = true;
    this.isPaused = false;
    this.updateControls();
    this.playNext();
  }

  stepOnce() {
    if (this.isRunning && !this.isPaused) return;
    if (!this.prepareSteps(false)) return;
    if (!this.steps.length || this.stepIndex >= this.steps.length) return;
    const hasMore = this.advanceStep();
    if (!hasMore && this.stepIndex >= this.steps.length) {
      this.setMessage("Traversal complete!");
    }
  }

  togglePause() {
    if (!this.isRunning) return;
    if (this.isPaused) {
      this.isPaused = false;
      this.updateControls();
      this.playNext();
    } else {
      this.isPaused = true;
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
      this.updateControls();
    }
  }

  playNext() {
    if (this.isPaused || !this.isRunning) return;
    const keepGoing = this.advanceStep();
    if (!keepGoing) {
      this.finishRun();
      return;
    }
    this.timer = setTimeout(() => this.playNext(), STEP_DELAY);
  }

  finishRun() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.updateControls();
    this.setMessage("Traversal complete!");
  }

  advanceStep() {
    if (!this.steps.length || this.stepIndex >= this.steps.length) {
      return false;
    }

    const step = this.steps[this.stepIndex];
    this.applyStep(step);
    this.stepIndex += 1;
    return this.stepIndex < this.steps.length;
  }

  prepareSteps(force = false) {
    if (!force && this.steps.length && this.stepIndex < this.steps.length) return true;

    const parsed = this.parseGraph(true);
    if (!parsed.success) {
      this.steps = [];
      this.stepIndex = 0;
      return false;
    }

    this.renderer.render(parsed.graph, parsed.layout);

    const build = this.generateSteps(parsed.graph, parsed.start);
    if (!build.success) {
      this.steps = [];
      this.stepIndex = 0;
      if (build.message) this.setMessage(build.message, true);
      return false;
    }

    this.steps = build.steps;
    this.stepIndex = 0;
    this.applyInitialState(build.initialState || {});
    this.setMessage("");
    if (!build.initialState || typeof build.initialState.stepInfo !== "string") {
      this.setStepInfo("Ready to traverse.");
    }
    return true;
  }

  applyInitialState(initialState) {
    this.renderer.setState(initialState.graphState || {});
    this.updatePrimaryStructure(initialState.structureItems || []);
    if (this.secondaryItemsEl) {
      this.updateSecondaryStructure(initialState.secondaryItems || []);
    }
    if (typeof initialState.stepInfo === "string") {
      this.setStepInfo(initialState.stepInfo);
    }
    this.setStatus(initialState.statusText || "");
  }

  applyStep(step) {
    if (!step) return;
    this.renderer.setState(step.graphState || {});
    this.updatePrimaryStructure(step.structureItems || []);
    if (this.secondaryItemsEl) {
      this.updateSecondaryStructure(step.secondaryItems || []);
    }
    this.setStepInfo(step.status || "");
    this.highlightCode(step.codeLines || []);
    this.setStatus(step.statusText || "");
    if (typeof step.message === "string") {
      this.setMessage(step.message, Boolean(step.error));
    }
    this.afterStep(step);
  }

  updatePrimaryStructure(items) {
    if (!this.structureItemsEl) return;
    this.structureItemsEl.innerHTML = "";
    items.forEach(label => {
      const div = document.createElement("div");
      div.className = "structure-item";
      div.textContent = label;
      this.structureItemsEl.appendChild(div);
    });
  }

  updateSecondaryStructure(items) {
    if (!this.secondaryItemsEl) return;
    this.secondaryItemsEl.innerHTML = "";
    items.forEach(label => {
      const div = document.createElement("div");
      div.className = "structure-item";
      div.textContent = label;
      this.secondaryItemsEl.appendChild(div);
    });
  }

  setStatus(text) {
    if (!this.statusEl) return;
    this.statusEl.textContent = text ?? "";
  }

  afterStep(_step) {
    // Optional hook for subclasses.
  }

  // Subclasses must implement:
  // generateSteps(graph, startNode): { success, steps, initialState?, message? }
  // isWeighted(): boolean (optional, defaults to false)

  isWeighted() {
    return false;
  }
}
