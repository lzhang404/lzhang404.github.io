import { makeEdgeKey } from "./graphUtils.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const NODE_RADIUS = 40;

export class GraphRenderer {
  constructor(svg) {
    this.svg = svg;
    this.graph = null;
    this.layout = null;
    this.nodeEls = new Map();
    this.edgeEls = new Map();
    this.weightEls = new Map();

    this.ensureStructure();
  }

  ensureStructure() {
    if (!this.svg) return;
    this.svg.innerHTML = "";
    this.defs = document.createElementNS(SVG_NS, "defs");
    this.edgesLayer = document.createElementNS(SVG_NS, "g");
    this.nodesLayer = document.createElementNS(SVG_NS, "g");
    this.labelsLayer = document.createElementNS(SVG_NS, "g");
    this.weightsLayer = document.createElementNS(SVG_NS, "g");

    this.svg.append(this.defs, this.edgesLayer, this.weightsLayer, this.nodesLayer, this.labelsLayer);
  }

  render(graph, layout) {
    this.graph = graph;
    this.layout = layout;
    this.nodeEls.clear();
    this.edgeEls.clear();
    this.weightEls.clear();

    if (!graph || !layout) return;

    const { width, height } = layout;
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    if (graph.directed) {
      this.createArrowMarker();
    }

    this.edgesLayer.innerHTML = "";
    this.weightsLayer.innerHTML = "";
    this.nodesLayer.innerHTML = "";
    this.labelsLayer.innerHTML = "";

    for (const edge of graph.edges) {
      const line = document.createElementNS(SVG_NS, "line");
      const fromPos = layout.layout.get(edge.from);
      const toPos = layout.layout.get(edge.to);
      if (!fromPos || !toPos) continue;

      const coords = computeEdgeEndpoints(fromPos, toPos, {
        directed: graph.directed,
      });
      line.setAttribute("x1", coords.x1.toFixed(2));
      line.setAttribute("y1", coords.y1.toFixed(2));
      line.setAttribute("x2", coords.x2.toFixed(2));
      line.setAttribute("y2", coords.y2.toFixed(2));
      line.setAttribute("class", "graph-edge");
      if (graph.directed) {
        line.setAttribute("marker-end", `url(#${this.arrowId})`);
      }
      this.edgesLayer.appendChild(line);
      this.edgeEls.set(edge.key, line);

      if (graph.weighted) {
        const weightLabel = document.createElementNS(SVG_NS, "text");
        weightLabel.setAttribute("class", "edge-weight");
        const mid = midpoint(coords, fromPos, toPos, graph.directed);
        weightLabel.setAttribute("x", mid.x.toFixed(2));
        weightLabel.setAttribute("y", mid.y.toFixed(2));
        weightLabel.textContent = String(edge.weight);
        this.weightsLayer.appendChild(weightLabel);
        this.weightEls.set(edge.key, weightLabel);
      }
    }

    for (const node of graph.nodes) {
      const pos = layout.layout.get(node);
      if (!pos) continue;

      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("cx", pos.x.toFixed(2));
      circle.setAttribute("cy", pos.y.toFixed(2));
      circle.setAttribute("r", NODE_RADIUS);
      circle.setAttribute("class", "graph-node");
      this.nodesLayer.appendChild(circle);
      this.nodeEls.set(node, circle);

      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("class", "graph-label");
      label.setAttribute("x", pos.x.toFixed(2));
      label.setAttribute("y", pos.y.toFixed(2));
      label.textContent = node;
      this.labelsLayer.appendChild(label);
    }
  }

  createArrowMarker() {
    this.defs.innerHTML = "";
    this.arrowId = `arrow-head-${Math.random().toString(36).slice(2)}`;

    const marker = document.createElementNS(SVG_NS, "marker");
    marker.setAttribute("id", this.arrowId);
    marker.setAttribute("markerWidth", "12");
    marker.setAttribute("markerHeight", "12");
    marker.setAttribute("refX", "10");
    marker.setAttribute("refY", "6");
    marker.setAttribute("orient", "auto");
    marker.setAttribute("markerUnits", "strokeWidth");

    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", "M2 1 L10 6 L2 11 Z");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("class", "graph-edge");

    marker.appendChild(path);
    this.defs.appendChild(marker);
  }

  setState(state = {}) {
    const {
      visited = [],
      frontier = [],
      current = null,
      source = null,
      activeEdges = [],
      relaxedEdges = [],
      emphasizedNodes = [],
    } = state;

    const visitedSet = toSet(visited);
    const frontierSet = toSet(frontier);
    const relaxedSet = toSet(relaxedEdges);
    const activeSet = toSet(activeEdges);
    const emphasizedSet = toSet(emphasizedNodes);

    for (const [node, circle] of this.nodeEls.entries()) {
      circle.classList.remove("visited", "frontier", "current", "source", "emphasis");
      if (node === current) {
        circle.classList.add("visited", "current");
      } else if (visitedSet.has(node)) {
        circle.classList.add("visited");
      }
      if (frontierSet.has(node)) circle.classList.add("frontier");
    if (node === source) {
      circle.classList.add("source");
    }
      if (emphasizedSet.has(node) && node !== source) {
        circle.classList.add("emphasis");
      }
    }

    for (const [key, edgeEl] of this.edgeEls.entries()) {
      edgeEl.classList.remove("active", "relaxed");
      if (activeSet.has(key)) edgeEl.classList.add("active");
      if (relaxedSet.has(key)) edgeEl.classList.add("relaxed");
    }

    for (const [key, label] of this.weightEls.entries()) {
      if (relaxedSet.has(key)) {
        label.classList.add("relaxed");
      } else {
        label.classList.remove("relaxed");
      }
    }
  }

  edgeKey(from, to) {
    if (!this.graph) return "";
    return makeEdgeKey(from, to, this.graph.directed);
  }
}

function toSet(value) {
  if (!value) return new Set();
  if (value instanceof Set) return value;
  if (Array.isArray(value)) return new Set(value);
  return new Set([value]);
}

function computeEdgeEndpoints(fromPos, toPos, { directed }) {
  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const dist = Math.hypot(dx, dy) || 1;

  const offStart = directed ? NODE_RADIUS * 0.85 : NODE_RADIUS * 0.6;
  const offEnd = NODE_RADIUS * 0.95;

  return {
    x1: fromPos.x + (dx / dist) * offStart,
    y1: fromPos.y + (dy / dist) * offStart,
    x2: toPos.x - (dx / dist) * offEnd,
    y2: toPos.y - (dy / dist) * offEnd,
  };
}

function midpoint(coords, fromPos, toPos, directed) {
  const midX = (coords.x1 + coords.x2) / 2;
  const midY = (coords.y1 + coords.y2) / 2;

  if (!directed) {
    return { x: midX, y: midY };
  }

  const baseMidX = (fromPos.x + toPos.x) / 2;
  const baseMidY = (fromPos.y + toPos.y) / 2;
  return {
    x: (midX + baseMidX) / 2,
    y: (midY + baseMidY) / 2,
  };
}
