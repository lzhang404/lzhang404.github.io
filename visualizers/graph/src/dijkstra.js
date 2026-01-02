import { TraversalBase } from "./traversalBase.js";
import { makeEdgeKey } from "./graphUtils.js";

const DEFAULT_EDGES = [
  "A B 4",
  "A C 2",
  "B C 5",
  "B D 10",
  "C E 3",
  "E D 4",
  "D F 11",
  "E F 2",
].join("\n");

class DijkstraVisualizer extends TraversalBase {
  constructor() {
    super({
      snippetKey: "dijkstra",
      structureLabel: "Priority queue (min distance first)",
      defaultEdges: DEFAULT_EDGES,
      defaultStart: "A",
      allowDirected: true,
    });
    this.distanceTableBody = document.getElementById("distance-body");
    this.visitedOrder = [];
  }

  isWeighted() {
    return true;
  }

  afterStep(step) {
    if (step.distanceSnapshot) {
      this.renderDistanceTable(step.distanceSnapshot, step.updatedNode);
    }
    if (step.newVisit) {
      this.visitedOrder.push(step.newVisit);
    }
    if (this.secondaryItemsEl) {
      this.updateSecondaryStructure(this.visitedOrder.slice());
      if (this.secondaryLabelEl) {
        this.secondaryLabelEl.textContent = "Settled nodes";
      }
    }
  }

  reset(skipMessage = false) {
    this.visitedOrder = [];
    if (this.distanceTableBody) {
      this.distanceTableBody.innerHTML = "";
    }
    super.reset(skipMessage);
  }

  generateSteps(graph, start) {
    const { adjacency, directed, nodes } = graph;
    const INF = Number.POSITIVE_INFINITY;
    const dist = new Map(nodes.map(node => [node, INF]));
    const parent = new Map();
    const treeEdges = new Set();
    const steps = [];
    const queue = [{ node: start, dist: 0 }];
    const visited = new Set();

    dist.set(start, 0);

    const initialState = {
      graphState: {
        visited: [],
        frontier: queue.map(item => item.node),
        source: start,
        relaxedEdges: [],
      },
      structureItems: formatQueue(queue),
      secondaryItems: [],
      stepInfo: `Priority queue seeded with ${start} at distance 0.`,
      statusText: `current u = ${start}, current v = —, d = 0, dist[u] = ${formatDist(dist.get(start))}, dist[v] = —`,
    };

    steps.push({
      status: `Initialize distances.`,
      structureItems: formatQueue(queue),
      statusText: `current u = ${start}, current v = —, d = 0, dist[u] = ${formatDist(dist.get(start))}, dist[v] = —`,
      graphState: {
        visited: [],
        frontier: queue.map(item => item.node),
        source: start,
        relaxedEdges: [],
      },
      codeLines: [4],
      distanceSnapshot: snapshotDistances(nodes, dist, parent),
    });

    steps.push({
      status: `Set dist(${start}) = 0 and push to the priority queue.`,
      structureItems: formatQueue(queue),
      statusText: `current u = ${start}, current v = —, d = 0, dist[u] = ${formatDist(dist.get(start))}, dist[v] = —`,
      graphState: {
        visited: [],
        frontier: queue.map(item => item.node),
        source: start,
        relaxedEdges: [],
      },
      codeLines: [10, 11],
      distanceSnapshot: snapshotDistances(nodes, dist, parent),
    });

    while (queue.length) {
      queue.sort((a, b) => a.dist - b.dist);
      const queueBeforePop = formatQueue(queue);
      const current = queue.shift();
      const queueNodes = queue.map(item => item.node);
      const queueDisplay = formatQueue(queue);
      const recordedDist = dist.get(current.node);

      steps.push({
        status: `Extract node ${current.node} with tentative distance ${current.dist}.`,
        structureItems: queueBeforePop,
        statusText: `current u = ${current.node}, current v = —, d = ${formatDist(current.dist)}, dist[u] = ${formatDist(recordedDist)}, dist[v] = —`,
        graphState: {
          visited: Array.from(visited),
          frontier: queueNodes,
          current: current.node,
          source: start,
          relaxedEdges: Array.from(treeEdges),
        },
        codeLines: [14],
        distanceSnapshot: snapshotDistances(nodes, dist, parent),
      });

      if (current.dist !== recordedDist) {
        steps.push({
          status: `Skip outdated entry for ${current.node} (queued ${current.dist}, current ${recordedDist}).`,
          structureItems: formatQueue(queue),
          graphState: {
            visited: Array.from(visited),
            frontier: queueNodes,
            current: null,
            source: start,
            relaxedEdges: Array.from(treeEdges),
          },
          codeLines: [12, 13],
          distanceSnapshot: snapshotDistances(nodes, dist, parent),
          statusText: `current u = ${current.node}, current v = —, d = ${formatDist(current.dist)}, dist[u] = ${formatDist(recordedDist)}, dist[v] = —`,
        });
        continue;
      }

      visited.add(current.node);
      const frontierAfterSettled = queue.map(item => item.node);

      steps.push({
        status: `Settle ${current.node}; its shortest distance is now fixed.`,
        structureItems: formatQueue(queue),
        statusText: `current u = ${current.node}, current v = —, d = ${formatDist(current.dist)}, dist[u] = ${formatDist(dist.get(current.node))}, dist[v] = —`,
        graphState: {
          visited: Array.from(visited),
          frontier: frontierAfterSettled,
          current: current.node,
          source: start,
          relaxedEdges: Array.from(treeEdges),
        },
        codeLines: [15],
        distanceSnapshot: snapshotDistances(nodes, dist, parent),
        newVisit: current.node,
      });

      const neighbors = adjacency.get(current.node) || [];
      if (!neighbors.length) {
        steps.push({
          status: `${current.node} has no outgoing edges to relax.`,
          structureItems: formatQueue(queue),
          statusText: `current u = ${current.node}, current v = —, d = ${formatDist(current.dist)}, dist[u] = ${formatDist(dist.get(current.node))}, dist[v] = —`,
          graphState: {
            visited: Array.from(visited),
            frontier: frontierAfterSettled,
            current: null,
            source: start,
            relaxedEdges: Array.from(treeEdges),
          },
          codeLines: [15],
          distanceSnapshot: snapshotDistances(nodes, dist, parent),
        });
        continue;
      }

      for (const { node: neighbor, weight } of neighbors) {
        const candidate = current.dist + weight;
        const edgeKey = makeEdgeKey(current.node, neighbor, directed);

        steps.push({
          status: `Assess edge ${current.node} → ${neighbor} (weight ${weight}). Proposed distance ${candidate}.`,
          structureItems: formatQueue(queue),
          statusText: `current u = ${current.node}, current v = ${neighbor}, d = ${formatDist(current.dist)}, dist[u] = ${formatDist(dist.get(current.node))}, dist[v] = ${formatDist(dist.get(neighbor))}`,
          graphState: {
            visited: Array.from(visited),
            frontier: frontierAfterSettled,
            current: null,
            source: start,
            activeEdges: [edgeKey],
            relaxedEdges: Array.from(treeEdges),
            emphasizedNodes: [neighbor],
          },
          codeLines: [18],
          distanceSnapshot: snapshotDistances(nodes, dist, parent),
        });

        if (candidate >= dist.get(neighbor)) {
          steps.push({
            status: `No update required for ${neighbor}; current best is ${dist.get(neighbor)}.`,
            structureItems: formatQueue(queue),
            statusText: `current u = ${current.node}, current v = ${neighbor}, d = ${formatDist(current.dist)}, dist[u] = ${formatDist(dist.get(current.node))}, dist[v] = ${formatDist(dist.get(neighbor))}`,
            graphState: {
              visited: Array.from(visited),
              frontier: frontierAfterSettled,
              current: null,
              source: start,
              activeEdges: [edgeKey],
              relaxedEdges: Array.from(treeEdges),
            },
            codeLines: [20],
            distanceSnapshot: snapshotDistances(nodes, dist, parent),
          });
          continue;
        }

        const previousParent = parent.get(neighbor);
        if (previousParent) {
          treeEdges.delete(makeEdgeKey(previousParent, neighbor, directed));
        }
        parent.set(neighbor, current.node);
        treeEdges.add(edgeKey);
        dist.set(neighbor, candidate);
        queue.push({ node: neighbor, dist: candidate });

        steps.push({
          status: `Update ${neighbor}: new distance ${candidate} via ${current.node}.`,
          structureItems: formatQueue(queue),
          statusText: `current u = ${current.node}, current v = ${neighbor}, d = ${formatDist(current.dist)}, dist[u] = ${formatDist(dist.get(current.node))}, dist[v] = ${formatDist(dist.get(neighbor))}`,
          graphState: {
            visited: Array.from(visited),
            frontier: queue.map(item => item.node),
            current: null,
            source: start,
            activeEdges: [edgeKey],
            relaxedEdges: Array.from(treeEdges),
          },
          codeLines: [22, 23, 24, 25],
          distanceSnapshot: snapshotDistances(nodes, dist, parent),
          updatedNode: neighbor,
        });
      }
    }

    steps.push({
      status: "Priority queue empty. Dijkstra's algorithm complete.",
      structureItems: [],
      graphState: {
        visited: Array.from(visited),
        frontier: [],
        source: start,
        relaxedEdges: Array.from(treeEdges),
      },
      codeLines: [10],
      distanceSnapshot: snapshotDistances(nodes, dist, parent),
      statusText: `current u = —, current v = —, d = —, dist[u] = —, dist[v] = —`,
    });

    return { success: true, steps, initialState };
  }

  renderDistanceTable(entries, updatedNode) {
    if (!this.distanceTableBody) return;
    this.distanceTableBody.innerHTML = "";
    entries.forEach(({ node, dist, parent }) => {
      const tr = document.createElement("tr");
      if (updatedNode && updatedNode === node) {
        tr.classList.add("updated");
      }
      const distText = Number.isFinite(dist) ? String(dist) : "∞";
      const cells = [
        node,
        distText,
        parent ?? "—",
      ];
      cells.forEach(text => {
        const td = document.createElement("td");
        td.textContent = text;
        if (updatedNode && updatedNode === node) {
          td.classList.add("updated");
        }
        tr.appendChild(td);
      });
      this.distanceTableBody.appendChild(tr);
    });
  }
}

function formatQueue(queue) {
  if (!queue.length) return [];
  const copy = queue.slice().sort((a, b) => a.dist - b.dist);
  return copy.map(item => `${item.node} (${item.dist})`);
}

function formatDist(value) {
  return Number.isFinite(value) ? value : "∞";
}

function snapshotDistances(nodes, dist, parent) {
  return nodes.map(node => ({
    node,
    dist: dist.get(node),
    parent: parent.get(node) ?? "—",
  }));
}

window.addEventListener("DOMContentLoaded", () => {
  new DijkstraVisualizer();
});
