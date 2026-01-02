import { TraversalBase } from "./traversalBase.js";
import { makeEdgeKey } from "./graphUtils.js";

const DEFAULT_EDGES = [
  "A B",
  "A C",
  "B D",
  "B E",
  "C F",
  "E G",
  "C H",
].join("\n");

class DFSVisualizer extends TraversalBase {
  constructor() {
    super({
      snippetKey: "dfsStack",
      structureLabel: "Stack (top → right)",
      defaultEdges: DEFAULT_EDGES,
      defaultStart: "A",
      allowDirected: true,
    });
    this.modeSelect = document.getElementById("mode-select");
    this.mode = this.modeSelect?.value ?? "stack";
    this.visitOrder = [];

    this.modeSelect?.addEventListener("change", () => {
      this.mode = this.modeSelect.value;
      const label = this.mode === "recursive"
        ? "Call stack (top → right)"
        : "Stack (top → right)";
      if (this.structureLabelEl) {
        this.structureLabelEl.textContent = label;
      }
      const snippetKey = this.mode === "recursive" ? "dfsRecursive" : "dfsStack";
      this.renderSnippet(snippetKey);
      this.reset(true);
    });
  }

  generateSteps(graph, start) {
    this.visitOrder = [];
    if (this.mode === "recursive") {
      return this.generateRecursiveSteps(graph, start);
    }
    return this.generateStackSteps(graph, start);
  }

  afterStep(step) {
    if (step.newVisit) {
      this.visitOrder.push(step.newVisit);
    }
    const items = this.visitOrder.map(node => node);
    if (this.secondaryItemsEl) {
      this.updateSecondaryStructure(items);
      if (this.secondaryLabelEl) {
        this.secondaryLabelEl.textContent = "Visited order";
      }
    }
  }

  generateStackSteps(graph, start) {
    const { adjacency, directed } = graph;
    const stack = [start];
    const visited = new Set();
    const steps = [];

    const initialState = {
      graphState: {
        visited: [],
        frontier: stack.slice(),
        source: start,
      },
      structureItems: stack.slice(),
      secondaryItems: [],
    };

    steps.push({
      status: `Push start node ${start} onto the stack.`,
      structureItems: stack.slice(),
      graphState: {
        visited: [],
        frontier: stack.slice(),
        source: start,
      },
      codeLines: [4],
    });

    while (stack.length) {
      const current = stack.pop();
      let stackSnapshot = stack.slice();

      steps.push({
        status: `Pop ${current} from the stack.`,
        structureItems: stackSnapshot,
        graphState: {
          visited: Array.from(visited),
          frontier: stackSnapshot,
          current,
          source: start,
        },
        codeLines: [7, 8],
      });

      if (visited.has(current)) {
        steps.push({
          status: `${current} is already visited. Continue.`,
          structureItems: stackSnapshot,
          graphState: {
            visited: Array.from(visited),
            frontier: stackSnapshot,
            current,
            source: start,
          },
          codeLines: [9, 10, 11],
        });
        continue;
      }

      visited.add(current);
      steps.push({
        status: `Mark ${current} as visited.`,
        structureItems: stackSnapshot,
        graphState: {
          visited: Array.from(visited),
          frontier: stackSnapshot,
          current,
          source: start,
        },
        codeLines: [12],
        newVisit: current,
      });

      const neighbors = (adjacency.get(current) || []).map(({ node }) => node);
      if (!neighbors.length) {
        steps.push({
          status: `${current} has no neighbors to explore.`,
          structureItems: stackSnapshot,
          graphState: {
            visited: Array.from(visited),
            frontier: stackSnapshot,
            current,
            source: start,
          },
          codeLines: [14],
        });
        continue;
      }

      const ordered = neighbors.slice().reverse();
      for (const neighbor of ordered) {
        const edgeKey = makeEdgeKey(current, neighbor, directed);
        steps.push({
          status: `Check neighbor ${neighbor} of ${current}.`,
          structureItems: stackSnapshot,
          graphState: {
            visited: Array.from(visited),
            frontier: stackSnapshot,
            current,
            source: start,
            activeEdges: [edgeKey],
            emphasizedNodes: [neighbor],
          },
          codeLines: [14],
        });

        if (visited.has(neighbor)) {
          steps.push({
            status: `${neighbor} already visited. Do not push.`,
            structureItems: stackSnapshot,
            graphState: {
              visited: Array.from(visited),
              frontier: stackSnapshot,
              current,
              source: start,
              activeEdges: [edgeKey],
            },
            codeLines: [15],
          });
          continue;
        }

        stack.push(neighbor);
        stackSnapshot = stack.slice();
        steps.push({
          status: `Push ${neighbor} onto the stack.`,
          structureItems: stackSnapshot,
          graphState: {
            visited: Array.from(visited),
            frontier: stackSnapshot,
            current,
            source: start,
            activeEdges: [edgeKey],
          },
          codeLines: [15, 16, 17],
        });
      }
    }

    steps.push({
      status: "Stack empty. DFS complete.",
      structureItems: [],
      graphState: {
        visited: Array.from(visited),
        frontier: [],
        source: start,
      },
      codeLines: [6],
    });

    return { success: true, steps, initialState };
  }

  generateRecursiveSteps(graph, start) {
    const { adjacency, directed } = graph;
    const visited = new Set();
    const steps = [];
    const callStack = [];

    const initialState = {
      graphState: {
        visited: [],
        frontier: [],
        source: start,
      },
      structureItems: [`dfs(${start})`],
      secondaryItems: [],
    };

    steps.push({
      status: `Call dfs(${start}).`,
      structureItems: [`dfs(${start})`],
      graphState: {
        visited: [],
        frontier: [start],
        source: start,
      },
      codeLines: [9, 10, 11, 12],
    });

    const visitOrder = [];

    const dfs = (node, parent = null) => {
      callStack.push(`dfs(${node})`);
      steps.push({
        status: `Enter dfs(${node}).`,
        structureItems: callStack.slice(),
        graphState: {
          visited: Array.from(visited),
          frontier: callStack.map(label => extractNode(label)),
          current: node,
          source: start,
        },
        codeLines: [1, 2],
      });

      if (!visited.has(node)) {
        visited.add(node);
        visitOrder.push(node);
        steps.push({
          status: `Mark ${node} as visited.`,
          structureItems: callStack.slice(),
          secondaryItems: visitOrder.slice(),
          graphState: {
            visited: Array.from(visited),
            frontier: callStack.map(label => extractNode(label)),
            current: node,
            source: start,
          },
          codeLines: [2],
          newVisit: node,
        });
      }

      const neighbors = adjacency.get(node) || [];
      for (const { node: neighbor } of neighbors) {
        const edgeKey = makeEdgeKey(node, neighbor, directed);
        steps.push({
          status: `Inspect neighbor ${neighbor} of ${node}.`,
          structureItems: callStack.slice(),
          secondaryItems: visitOrder.slice(),
          graphState: {
            visited: Array.from(visited),
            frontier: callStack.map(label => extractNode(label)),
            current: node,
            source: start,
            activeEdges: [edgeKey],
            emphasizedNodes: [neighbor],
          },
          codeLines: [4, 5],
        });

        if (visited.has(neighbor)) {
          steps.push({
            status: `${neighbor} is already visited. Skip recursion.`,
            structureItems: callStack.slice(),
            secondaryItems: visitOrder.slice(),
            graphState: {
              visited: Array.from(visited),
              frontier: callStack.map(label => extractNode(label)),
              current: node,
              source: start,
              activeEdges: [edgeKey],
            },
            codeLines: [5],
          });
          continue;
        }

        steps.push({
          status: `Recurse into ${neighbor}.`,
          structureItems: [...callStack.slice(), `dfs(${neighbor})`],
          secondaryItems: visitOrder.slice(),
          graphState: {
            visited: Array.from(visited),
            frontier: [...callStack.map(label => extractNode(label)), neighbor],
            current: node,
            source: start,
            activeEdges: [edgeKey],
          },
          codeLines: [6],
        });

        dfs(neighbor, node);

        steps.push({
          status: `Backtrack to ${node} after exploring ${neighbor}.`,
          structureItems: callStack.slice(),
          secondaryItems: visitOrder.slice(),
          graphState: {
            visited: Array.from(visited),
            frontier: callStack.map(label => extractNode(label)),
            current: node,
            source: start,
          },
          codeLines: [7],
        });
      }

      callStack.pop();
    };

    dfs(start, null);

    steps.push({
      status: "All recursive calls have returned.",
      structureItems: [],
      secondaryItems: visitOrder.slice(),
      graphState: {
        visited: Array.from(visited),
        frontier: [],
        source: start,
      },
      codeLines: [7],
    });

    return { success: true, steps, initialState };
  }
}

function extractNode(label) {
  const match = /\(([^)]+)\)/.exec(label);
  return match ? match[1] : label;
}

window.addEventListener("DOMContentLoaded", () => {
  new DFSVisualizer();
});
