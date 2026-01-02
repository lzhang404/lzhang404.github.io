import { TraversalBase } from "./traversalBase.js";
import { makeEdgeKey } from "./graphUtils.js";

const DEFAULT_EDGES = [
  "A B",
  "A C",
  "B D",
  "B E",
  "C F",
  "E G",
  "F H",
].join("\n");

class BFSVisualizer extends TraversalBase {
  constructor() {
    super({
      snippetKey: "bfs",
      structureLabel: "Queue (front → left)",
      defaultEdges: DEFAULT_EDGES,
      defaultStart: "A",
      allowDirected: true,
    });
    this.visitOrder = [];
  }

  generateSteps(graph, start) {
    const { adjacency, directed } = graph;
    const visited = new Set([start]);
    const queue = [start];
    const steps = [];
    this.visitOrder = [start];

    const initialState = {
      graphState: {
        visited: Array.from(visited),
        frontier: queue.slice(),
        source: start,
      },
      structureItems: queue.slice(),
      secondaryItems: [start],
    };

    steps.push({
      status: `Enqueue start node ${start}.`,
      structureItems: queue.slice(),
      graphState: {
        visited: Array.from(visited),
        frontier: queue.slice(),
        source: start,
      },
      codeLines: [2, 3, 4, 5],
    });

    while (queue.length) {
      const current = queue.shift();
      let queueSnapshot = queue.slice();

      steps.push({
        status: `Dequeue ${current} and explore its neighbors.`,
        structureItems: queueSnapshot,
        graphState: {
          visited: Array.from(visited),
          frontier: queueSnapshot,
          current,
          source: start,
        },
        codeLines: [7, 8, 9],
      });

      const neighbors = adjacency.get(current) || [];
      if (!neighbors.length) {
        steps.push({
          status: `${current} has no outgoing edges.`,
          structureItems: queueSnapshot,
          graphState: {
            visited: Array.from(visited),
            frontier: queueSnapshot,
            current,
            source: start,
          },
          codeLines: [11],
        });
        continue;
      }

      for (const { node: neighbor } of neighbors) {
        const edgeKey = makeEdgeKey(current, neighbor, directed);
        steps.push({
          status: `Inspect neighbor ${neighbor} of ${current}.`,
          structureItems: queueSnapshot,
          graphState: {
            visited: Array.from(visited),
            frontier: queueSnapshot,
            current,
            source: start,
            activeEdges: [edgeKey],
            emphasizedNodes: [neighbor],
          },
          codeLines: [11, 12],
        });

        if (visited.has(neighbor)) {
          steps.push({
            status: `${neighbor} is already visited. Skip enqueue.`,
            structureItems: queueSnapshot,
            graphState: {
              visited: Array.from(visited),
              frontier: queueSnapshot,
              current,
              source: start,
              activeEdges: [edgeKey],
            },
            codeLines: [12],
          });
          continue;
        }

        visited.add(neighbor);
        queue.push(neighbor);
        queueSnapshot = queue.slice();

        steps.push({
          status: `Visit ${neighbor}, mark visited, and enqueue to process later.`,
          structureItems: queueSnapshot,
          graphState: {
            visited: Array.from(visited),
            frontier: queueSnapshot,
            current,
            source: start,
            activeEdges: [edgeKey],
          },
          codeLines: [13, 14],
          newVisit: neighbor,
        });
      }
    }

    steps.push({
      status: "Queue empty. BFS traversal complete.",
      structureItems: [],
      graphState: {
        visited: Array.from(visited),
        frontier: [],
        source: start,
      },
      codeLines: [7],
    });

    return { success: true, steps, initialState };
  }

  afterStep(step) {
    if (!this.secondaryItemsEl) return;
    if (step.newVisit && !this.visitOrder.includes(step.newVisit)) {
      this.visitOrder.push(step.newVisit);
    }
    this.updateSecondaryStructure(this.visitOrder);
    if (this.secondaryLabelEl) {
      this.secondaryLabelEl.textContent = "Visited order";
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new BFSVisualizer();
});
