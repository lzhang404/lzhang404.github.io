import { examples } from "./examples.js";

const VIEWBOX = { width: 960, height: 520 };
const LAYOUT = { marginX: 60, top: 60, verticalSpacing: 110 };

const svg = document.getElementById("viz");
const picker = document.getElementById("example-picker");
const stepsHost = document.getElementById("steps");
const stepMessage = document.getElementById("step-message");
const exampleDescription = document.getElementById("example-description");
const vizNote = document.getElementById("viz-note");

let activeExample = examples[0];
let activeStepIndex = 0;
let nodeElements = new Map();
let edgeElements = new Map();

function init() {
  renderPicker();
  setExample(activeExample.id);
}

function renderPicker() {
  picker.innerHTML = "";
  examples.forEach((ex) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = ex.title;
    btn.className = "example-button";
    btn.setAttribute("role", "tab");
    btn.setAttribute("data-example", ex.id);
    btn.addEventListener("click", () => setExample(ex.id));
    picker.appendChild(btn);
  });
}

function setExample(exampleId) {
  const next = examples.find((ex) => ex.id === exampleId) ?? examples[0];
  activeExample = next;
  activeStepIndex = 0;
  highlightActiveExampleButton();
  exampleDescription.textContent = next.description;
  vizNote.textContent = next.note;
  renderTree(next.tree);
  renderSteps(next.steps);
  setStep(0);
}

function highlightActiveExampleButton() {
  picker.querySelectorAll(".example-button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.example === activeExample.id);
  });
}

function renderTree(tree) {
  if (!tree) return;
  const { nodes, edges } = flattenTree(tree);
  const { positions } = layoutTree(tree);

  svg.innerHTML = "";
  nodeElements = new Map();
  edgeElements = new Map();

  edges.forEach((edge) => {
    const from = positions.get(edge.fromId);
    const to = positions.get(edge.toId);
    if (!from || !to) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${from.x} ${from.y} L ${to.x} ${to.y}`);
    path.classList.add("tree-edge");
    path.dataset.edgeId = edge.id;
    svg.appendChild(path);
    edgeElements.set(edge.id, path);
  });

  nodes.forEach((node) => {
    const pos = positions.get(node.id);
    if (!pos) return;
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.classList.add("tree-node");
    group.dataset.nodeId = node.id;
    group.setAttribute("transform", `translate(${pos.x}, ${pos.y})`);

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", "26");
    group.appendChild(circle);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.textContent = node.label;
    group.appendChild(label);

    if (node.annotation) {
      const annotation = document.createElementNS("http://www.w3.org/2000/svg", "text");
      annotation.classList.add("node-annotation");
      annotation.setAttribute("y", "32");
      annotation.textContent = node.annotation;
      group.appendChild(annotation);
    }

    svg.appendChild(group);
    nodeElements.set(node.id, group);
  });
}

function renderSteps(steps) {
  stepsHost.innerHTML = "";
  steps.forEach((step, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "step-button";
    btn.innerHTML = `<strong>${step.title}</strong><span>${step.detail}</span>`;
    btn.addEventListener("click", () => setStep(index));
    stepsHost.appendChild(btn);
  });
}

function setStep(index) {
  activeStepIndex = index;
  const step = activeExample.steps[index];
  if (!step) return;
  stepMessage.textContent = step.detail;
  stepsHost.querySelectorAll(".step-button").forEach((btn, idx) => {
    btn.classList.toggle("active", idx === index);
  });
  resetHighlights();
  applyHighlights(step.highlight ?? {});
}

function resetHighlights() {
  nodeElements.forEach((group) => {
    group.classList.remove("node-current", "node-visited", "node-target");
  });
  edgeElements.forEach((path) => {
    path.classList.remove("path", "active");
  });
}

function applyHighlights({ current, visited = [], target = [], edgePath = [], edgeActive = [] }) {
  visited.forEach((id) => nodeElements.get(id)?.classList.add("node-visited"));
  const targetNodes = Array.isArray(target) ? target : [target];
  targetNodes
    .filter(Boolean)
    .forEach((id) => nodeElements.get(id)?.classList.add("node-target"));
  if (current) {
    const currentNodes = Array.isArray(current) ? current : [current];
    currentNodes.forEach((id) => nodeElements.get(id)?.classList.add("node-current"));
  }
  edgePath.forEach((id) => edgeElements.get(id)?.classList.add("path"));
  edgeActive.forEach((id) => edgeElements.get(id)?.classList.add("active"));
}

function flattenTree(node, parentId = null, nodes = [], edges = []) {
  if (!node) return { nodes, edges };
  nodes.push(node);
  if (parentId) {
    edges.push({ id: `${parentId}-${node.id}`, fromId: parentId, toId: node.id });
  }
  (node.children || []).forEach((child) => flattenTree(child, node.id, nodes, edges));
  return { nodes, edges };
}

function layoutTree(root) {
  const positions = new Map();
  if (!root) return { positions };
  const leafCounts = new Map();

  const measure = (node) => {
    if (!node) return 0;
    if (!node.children || node.children.length === 0) {
      leafCounts.set(node.id, 1);
      return 1;
    }
    let sum = 0;
    node.children.forEach((child) => {
      sum += measure(child);
    });
    const value = Math.max(sum, 1);
    leafCounts.set(node.id, value);
    return value;
  };

  const totalLeaves = measure(root);
  const totalWidth = VIEWBOX.width - LAYOUT.marginX * 2;

  const assign = (node, startX, width, depth) => {
    if (!node) return;
    const x = startX + width / 2;
    const y = LAYOUT.top + depth * LAYOUT.verticalSpacing;
    positions.set(node.id, { x, y });

    if (!node.children || node.children.length === 0) {
      return;
    }
    const nodeLeaves = leafCounts.get(node.id) || 1;
    let cursor = startX;
    node.children.forEach((child) => {
      const childLeaves = leafCounts.get(child.id) || 1;
      const childWidth = (childLeaves / nodeLeaves) * width;
      assign(child, cursor, childWidth, depth + 1);
      cursor += childWidth;
    });
  };

  assign(root, LAYOUT.marginX, totalWidth, 0);
  return { positions };
}

init();
