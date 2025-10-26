import { qs, renderCodeBlock, highlightLines } from "./dom.js";
import { buildTree, computePositions } from "./tree.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export class BstBaseVisualizer {
  constructor({
    parseOperationInput = () => ({ ok: true, payload: {} }),
    generateSteps,
    codeSnippet,
    onTreeBuilt,
    selectors = {},
  }) {
    if (typeof generateSteps !== "function") {
      throw new Error("generateSteps must be provided.");
    }

    this.parseOperationInput = parseOperationInput;
    this.generateSteps = generateSteps;
    this.codeSnippet = codeSnippet ?? [];
    this.onTreeBuilt = onTreeBuilt;

    this.valuesInput = qs(selectors.values ?? "#values-input");
    this.msg = qs(selectors.message ?? "#message");
    this.stepMsg = qs(selectors.stepMessage ?? "#step-message");
    this.buildBtn = qs(selectors.build ?? "#build-btn");
    this.stepBtn = qs(selectors.step ?? "#step-btn");
    this.autoBtn = qs(selectors.auto ?? "#auto-btn");
    this.resetBtn = qs(selectors.reset ?? "#reset-btn");
    this.speed = qs(selectors.speed ?? "#speed");
    this.vizNote = qs(selectors.note ?? "#viz-note");

    this.svg = qs(selectors.svg ?? "#viz");
    this.gEdges = document.createElementNS(SVG_NS, "g");
    this.gNodes = document.createElementNS(SVG_NS, "g");
    this.svg.append(this.gEdges, this.gNodes);

    this.codeMap = null;
    const codeHost = qs(selectors.codeBlock ?? "#code-block");
    if (codeHost) {
      this.codeMap = renderCodeBlock(codeHost, this.codeSnippet);
    }

    this.tree = { nodes: [], root: null };
    this.basePositions = new Map();
    this.layoutConfig = { verticalSpacing: 110 };

    this.steps = [];
    this.index = 0;
    this.timer = null;

    this.bind();
    this.rebuild();
  }

  bind() {
    this.buildBtn?.addEventListener("click", () => this.rebuild());
    this.resetBtn?.addEventListener("click", () => this.rebuild());
    this.stepBtn?.addEventListener("click", () => this.stepOnce());
    this.autoBtn?.addEventListener("click", () => this.toggleAuto());
  }

  parseValues() {
    const raw = (this.valuesInput?.value ?? "").trim();
    if (!raw) return { ok: true, values: [] };
    const tokens = raw.split(/[, \t\r\n]+/).filter(Boolean);
    if (!tokens.length) return { ok: true, values: [] };
    const numbers = tokens.map((v) => Number(v));
    if (numbers.some((n) => !Number.isFinite(n))) {
      return {
        ok: false,
        message: "Enter numbers separated by commas or spaces.",
      };
    }
    return { ok: true, values: numbers };
  }

  rebuild() {
    this.stopAuto();

    const parsedValues = this.parseValues();
    if (!parsedValues.ok) {
      this.handleError(parsedValues.message);
      return;
    }

    this.tree = buildTree(parsedValues.values);
    const { positions, layout } = computePositions(this.tree);
    this.basePositions = positions;
    this.layoutConfig = layout;

    if (typeof this.onTreeBuilt === "function") {
      this.onTreeBuilt(this.tree);
    }

    const opInput = this.parseOperationInput(this.tree);
    if (!opInput.ok) {
      this.handleError(opInput.message ?? "Invalid operation input.");
      return;
    }

    this.msg.textContent = "";
    this.steps =
      this.generateSteps({
        tree: this.tree,
        input: opInput.payload,
      }) ?? [];
    this.index = 0;

    if (!this.steps.length) {
      this.layout(this.tree, this.basePositions, {});
      this.stepMsg.textContent = "";
      highlightLines(this.codeMap, []);
      return;
    }

    this.renderStep(this.steps[0]);
    this.index = 1;
  }

  handleError(message) {
    if (this.msg) this.msg.textContent = message ?? "";
    this.steps = [];
    this.index = 0;
    this.tree = { nodes: [], root: null };
    this.basePositions = new Map();
    this.layoutConfig = { ...this.layoutConfig, verticalSpacing: 110 };
    this.layout(this.tree, this.basePositions, {});
    if (this.stepMsg) this.stepMsg.textContent = "";
    highlightLines(this.codeMap, []);
  }

  renderStep(step) {
    if (!step) return;
    highlightLines(this.codeMap, step.codeLines ?? []);
    if (this.stepMsg) this.stepMsg.textContent = step.message ?? "";

    const state = step.state ?? {};
    const treeForStep = state.tree ?? this.tree;
    const positions =
      treeForStep === this.tree
        ? this.basePositions
        : computePositions(treeForStep).positions;

    this.layout(treeForStep, positions, state);
  }

  layout(tree, positions, state = {}) {
    this.clear(this.gEdges);
    this.clear(this.gNodes);

    if (!tree?.nodes?.length) return;

    const visited = new Set(state.visited ?? []);
    const edgeSet = new Set(state.edges ?? []);
    const activeEdge = state.highlightEdge ?? null;
    const nodeClasses = state.nodeClasses ?? {};
    const annotations = state.annotations ?? {};
    const hiddenNodes = new Set(state.hiddenNodes ?? []);

    tree.nodes.forEach((node) => {
      if (!node) return;
      if (hiddenNodes.has(node.id)) return;
      const pos = positions.get(node.id);
      if (!pos) return;

      const drawEdge = (toId) => {
        if (toId == null || hiddenNodes.has(toId)) return;
        const destPos = positions.get(toId);
        if (!destPos) return;
        const edgeId = `${node.id}-${toId}`;
        const line = document.createElementNS(SVG_NS, "line");
        line.setAttribute("class", "tree-edge");
        if (edgeSet.has(edgeId)) line.classList.add("path");
        if (activeEdge === edgeId) line.classList.add("active");
        line.setAttribute("x1", pos.x);
        line.setAttribute("y1", pos.y);
        line.setAttribute("x2", destPos.x);
        line.setAttribute("y2", destPos.y);
        this.gEdges.appendChild(line);
      };

      drawEdge(node.left);
      drawEdge(node.right);
    });

    const currentId = state.currentId ?? null;
    const targetId = state.targetId ?? null;
    const foundId = state.foundId ?? null;
    const parentId = state.parentId ?? null;

    tree.nodes.forEach((node) => {
      if (!node) return;
      if (hiddenNodes.has(node.id)) return;
      const pos = positions.get(node.id);
      if (!pos) return;

      const group = document.createElementNS(SVG_NS, "g");
      group.setAttribute("class", "tree-node");
      group.setAttribute("transform", `translate(${pos.x}, ${pos.y})`);
      group.dataset.id = String(node.id);

      if (visited.has(node.id)) group.classList.add("node-visited");
      if (currentId === node.id) group.classList.add("node-current");
      if (targetId === node.id) group.classList.add("node-target");
      if (foundId === node.id) group.classList.add("node-found");
      if (parentId === node.id) group.classList.add("node-parent");

      const extraClasses = nodeClasses[node.id];
      if (Array.isArray(extraClasses)) {
        extraClasses.forEach((cls) => group.classList.add(cls));
      }

      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("r", 26);
      circle.setAttribute("cx", 0);
      circle.setAttribute("cy", 0);
      group.appendChild(circle);

      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("x", 0);
      label.setAttribute("y", 2);
      label.textContent = String(node.value);
      group.appendChild(label);

      const annotationText = annotations[node.id];
      if (annotationText) {
        const note = document.createElementNS(SVG_NS, "text");
        note.setAttribute("x", 0);
        note.setAttribute("y", 42);
        note.setAttribute("class", "node-annotation");
        note.textContent = annotationText;
        group.appendChild(note);
      }

      this.gNodes.appendChild(group);
    });
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
    this.stepOnce();
    if (this.index >= this.steps.length) return;
    const delay = Number(this.speed?.value) || 700;
    this.timer = setInterval(() => this.stepOnce(), delay);
    if (this.autoBtn) this.autoBtn.textContent = "Stop";
  }

  stopAuto() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.autoBtn) this.autoBtn.textContent = "Auto";
  }

  clear(group) {
    if (!group) return;
    while (group.firstChild) group.removeChild(group.firstChild);
  }
}
