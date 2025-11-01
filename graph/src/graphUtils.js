const EDGE_SPLIT_REGEX = /\s*(?:->|--|—|-)\s*/g;

export function makeEdgeKey(from, to, directed) {
  return directed ? `${from}->${to}` : [from, to].sort().join("__");
}

export function parseGraphInput(rawEdges, { directed = false, weighted = false } = {}) {
  const lines = rawEdges
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { success: false, message: "Enter at least one edge to build a graph." };
  }

  const nodeSet = new Set();
  const adjacency = new Map();
  const displayEdgeMap = new Map();

  function ensureNode(node) {
    if (!adjacency.has(node)) adjacency.set(node, []);
  }

  for (const [index, rawLine] of lines.entries()) {
    const sanitized = rawLine.replace(EDGE_SPLIT_REGEX, " ");
    const tokens = sanitized.split(/[\s,]+/).filter(Boolean);

    if (weighted) {
      if (tokens.length < 3) {
        return {
          success: false,
          message: `Unable to parse line ${index + 1}: expected "u v w".`
        };
      }
    } else {
      if (tokens.length < 2) {
        return {
          success: false,
          message: `Unable to parse line ${index + 1}: expected "u v".`
        };
      }
    }

    const from = tokens[0];
    const to = tokens[1];
    if (!from || !to) {
      return {
        success: false,
        message: `Line ${index + 1} is missing a node identifier.`
      };
    }

    const weight = weighted ? Number(tokens[2]) : 1;
    if (weighted && (Number.isNaN(weight) || !Number.isFinite(weight))) {
      return {
        success: false,
        message: `Line ${index + 1} has an invalid weight value.`
      };
    }

    nodeSet.add(from);
    nodeSet.add(to);
    ensureNode(from);
    ensureNode(to);

    adjacency.get(from).push({ node: to, weight });
    if (!directed) {
      adjacency.get(to).push({ node: from, weight });
    }

    const displayKey = makeEdgeKey(from, to, directed);
    if (!displayEdgeMap.has(displayKey)) {
      displayEdgeMap.set(displayKey, { from, to, weight, key: displayKey });
    }
  }

  const nodes = Array.from(nodeSet);
  nodes.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  nodes.forEach(node => {
    const arr = adjacency.get(node) ?? [];
    arr.sort((a, b) => a.node.localeCompare(b.node, undefined, { sensitivity: "base" }));
    adjacency.set(node, arr);
  });

  return {
    success: true,
    graph: {
      nodes,
      adjacency,
      edges: Array.from(displayEdgeMap.values()),
      directed,
      weighted,
    }
  };
}

export function validateStartNode(graph, start) {
  if (!start) {
    return { success: false, message: "Enter a start node label." };
  }
  if (!graph.nodes.includes(start)) {
    return {
      success: false,
      message: `Node "${start}" is not present in the parsed graph.`
    };
  }
  return { success: true };
}

export function computeCircularLayout(nodes, { width = 720, height = 480 } = {}) {
  const layout = new Map();
  const count = nodes.length;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.38 + (count < 4 ? 40 : 0);
  const angleStep = (Math.PI * 2) / Math.max(count, 1);

  nodes.forEach((node, index) => {
    const angle = angleStep * index - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    layout.set(node, { x, y });
  });

  return { width, height, layout };
}
