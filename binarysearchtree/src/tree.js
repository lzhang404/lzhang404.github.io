const VIEWBOX = { width: 960, height: 520 };
const DEFAULT_LAYOUT = {
  marginX: 60,
  top: 60,
  verticalSpacing: 110,
};

export function toEdgeId(fromId, toId) {
  if (fromId == null || toId == null) return null;
  return `${fromId}-${toId}`;
}

export function buildTree(values) {
  const nodes = [];
  let root = null;

  values.forEach((raw) => {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;

    const id = nodes.length;
    const node = { id, value, left: null, right: null, parent: null };
    nodes.push(node);

    if (root == null) {
      root = id;
      return;
    }

    let currentId = root;
    while (true) {
      const current = nodes[currentId];
      if (!current) break;
      if (value < current.value) {
        if (current.left == null) {
          current.left = id;
          node.parent = currentId;
          break;
        }
        currentId = current.left;
      } else {
        if (current.right == null) {
          current.right = id;
          node.parent = currentId;
          break;
        }
        currentId = current.right;
      }
    }
  });

  return { nodes, root };
}

export function cloneTree(tree) {
  if (!tree) return { nodes: [], root: null };
  const nodes = tree.nodes.map((node) =>
    node
      ? {
          id: node.id,
          value: node.value,
          left: node.left,
          right: node.right,
          parent: node.parent,
        }
      : node
  );
  return { nodes, root: tree.root };
}

export function computePositions(tree, config = {}) {
  const layout = { ...DEFAULT_LAYOUT, ...config };
  const positions = new Map();
  if (!tree || tree.root == null) {
    return { positions, layout };
  }

  const depthMap = new Map();
  const assignDepth = (id, depth) => {
    if (id == null) return;
    const node = tree.nodes[id];
    if (!node) return;
    depthMap.set(id, depth);
    assignDepth(node.left, depth + 1);
    assignDepth(node.right, depth + 1);
  };
  assignDepth(tree.root, 0);

  const order = [];
  const inOrder = (id) => {
    if (id == null) return;
    const node = tree.nodes[id];
    if (!node) return;
    inOrder(node.left);
    order.push(id);
    inOrder(node.right);
  };
  inOrder(tree.root);

  const viewWidth = VIEWBOX.width;
  const available = viewWidth - layout.marginX * 2;
  const centerX = layout.marginX + available / 2;

  order.forEach((id, idx) => {
    const depth = depthMap.get(id) ?? 0;
    const x =
      order.length > 1
        ? layout.marginX + (available * idx) / (order.length - 1)
        : centerX;
    const y = layout.top + depth * layout.verticalSpacing;
    positions.set(id, { x, y });
  });

  return { positions, layout };
}

export function getNode(tree, id) {
  if (!tree || id == null) return null;
  return tree.nodes[id] ?? null;
}

export function transplant(tree, fromId, toId) {
  if (!tree) return;
  const node = getNode(tree, fromId);
  if (!node) return;
  const parentId = node.parent;
  if (parentId == null) {
    tree.root = toId;
  } else {
    const parent = getNode(tree, parentId);
    if (parent.left === fromId) {
      parent.left = toId;
    } else if (parent.right === fromId) {
      parent.right = toId;
    }
  }
  if (toId != null) {
    const replacement = getNode(tree, toId);
    if (replacement) {
      replacement.parent = parentId;
    }
  }
}
