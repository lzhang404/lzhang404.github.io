import {
  toEdgeId,
  cloneTree,
  getNode,
  transplant,
} from "./tree.js";

function snapshotState({
  currentId,
  visited,
  edges,
  highlightEdge = null,
  foundId = null,
  targetId = null,
  parentId = null,
  nodeClasses = {},
  annotations = {},
  hiddenNodes = [],
  tree = null,
  message = "",
  codeLines = [],
}) {
  return {
    codeLines,
    message,
    state: {
      currentId,
      visited: Array.from(visited ?? []),
      edges: Array.from(edges ?? []),
      highlightEdge,
      foundId,
      targetId,
      parentId,
      nodeClasses,
      annotations,
      hiddenNodes,
      tree,
    },
  };
}

function parseKey(value) {
  const key = Number(value);
  return Number.isFinite(key) ? key : null;
}

export function generateSearchSteps(tree, keyValue) {
  const steps = [];
  if (!tree) return steps;

  const key = parseKey(keyValue);
  if (key == null) return steps;

  const visited = new Set();
  const edges = new Set();
  let currentId = tree.root ?? null;

  if (currentId == null) {
    steps.push(
      snapshotState({
        codeLines: [2],
        message: "The tree is empty; there is no root to inspect.",
      })
    );
    return steps;
  }

  while (true) {
    if (currentId == null) {
      steps.push(
        snapshotState({
          codeLines: [2, 3],
          message: `Reached a null child; key ${key} is not in the tree.`,
          visited,
          edges,
        })
      );
      break;
    }

    const node = getNode(tree, currentId);
    if (!node) break;
    visited.add(currentId);

    steps.push(
      snapshotState({
        codeLines: [2],
        message: `Check whether node ${node.value} matches the key ${key}.`,
        currentId,
        visited,
        edges,
      })
    );

    if (node.value === key) {
      steps.push(
        snapshotState({
          codeLines: [3],
          message: `Node ${node.value} equals the key; return this node.`,
          currentId,
          visited,
          edges,
          foundId: currentId,
        })
      );
      break;
    }

    if (key < node.value) {
      const nextId = node.left;
      const edgeId = toEdgeId(node.id, nextId);
      if (edgeId) edges.add(edgeId);
      steps.push(
        snapshotState({
          codeLines: [4, 5],
          message:
            nextId == null
              ? `Key ${key} is smaller; recurse into the left child which is null.`
              : `Key ${key} is smaller; move to left child ${getNode(tree, nextId)?.value}.`,
          currentId,
          visited,
          edges,
          highlightEdge: edgeId,
        })
      );
      currentId = nextId ?? null;
      continue;
    }

    const nextId = node.right;
    const edgeId = toEdgeId(node.id, nextId);
    if (edgeId) edges.add(edgeId);
    steps.push(
      snapshotState({
        codeLines: [6, 7],
        message:
          nextId == null
            ? `Key ${key} is greater; recurse into the right child which is null.`
            : `Key ${key} is greater; move to right child ${getNode(tree, nextId)?.value}.`,
        currentId,
        visited,
        edges,
        highlightEdge: edgeId,
      })
    );
    currentId = nextId ?? null;
  }

  return steps;
}

export function generateInsertionSteps(tree, keyValue, options = {}) {
  const { showParent = false } = options;
  const lines = {
    emptyTree: [2, 3],
    inspect: [2],
    goLeft: [4, 5],
    goRight: [6, 7],
    duplicate: [8],
    attach: [7],
    null: [2, 3, 7],
    ...options.lines,
  };
  const steps = [];
  if (!tree) return steps;

  const key = parseKey(keyValue);
  if (key == null) return steps;

  const visited = new Set();
  const edges = new Set();

  if (tree.root == null) {
    const newTree = cloneTree(tree);
    const id = newTree.nodes.length;
    newTree.nodes.push({ id, value: key, left: null, right: null, parent: null });
    newTree.root = id;
    steps.push(
      snapshotState({
        codeLines: lines.emptyTree,
        message: "Tree is empty; create a new root node.",
        tree: newTree,
        foundId: id,
        annotations: { [id]: "new root" },
      })
    );
    return steps;
  }

  let currentId = tree.root;
  let parentId = null;
  let direction = null;

  while (currentId != null) {
    const node = getNode(tree, currentId);
    if (!node) break;
    visited.add(currentId);

    steps.push(
      snapshotState({
        codeLines: lines.inspect,
        message: `Inspect node ${node.value}.`,
        currentId,
        visited,
        edges,
        parentId: showParent ? parentId : null,
      })
    );

    if (node.value === key) {
      steps.push(
        snapshotState({
          codeLines: lines.duplicate,
          message: `Node ${node.value} already stores ${key}; duplicate insertion skipped.`,
          currentId,
          visited,
          edges,
          foundId: currentId,
          parentId: showParent ? parentId : null,
        })
      );
      return steps;
    }

    parentId = currentId;

    if (key < node.value) {
      direction = "left";
      const nextId = node.left;
      const edgeId = toEdgeId(node.id, nextId);
      if (edgeId) edges.add(edgeId);
      steps.push(
        snapshotState({
          codeLines: lines.goLeft,
          message:
            nextId == null
              ? `Key ${key} < ${node.value}; insert(null, ${key})`
              : `Key ${key} < ${node.value}; insert(${getNode(tree, nextId)?.value}, ${key}); continue to left child ${getNode(tree, nextId)?.value}.`,
          currentId,
          visited,
          edges,
          highlightEdge: edgeId,
          parentId: showParent ? parentId : null,
        })
      );
      if (nextId == null) break;
      currentId = nextId;
      continue;
    }

    direction = "right";
    const nextId = node.right;
    const edgeId = toEdgeId(node.id, nextId);
    if (edgeId) edges.add(edgeId);
      steps.push(
        snapshotState({
          codeLines: lines.goRight,
          message: nextId == null
              ? `Key ${key} > ${node.value}; insert(null, ${key})`
              : `Key ${key} > ${node.value}; insert(${getNode(tree, nextId)?.value}, ${key}); continue to right child ${getNode(tree, nextId)?.value}.`,
              currentId,
        visited,
        edges,
        highlightEdge: edgeId,
        parentId: showParent ? parentId : null,
      })
    );
    if (nextId == null){
      steps.push(
        snapshotState({
          codeLines: lines.null,
          message:
            `insert as the right child of ${getNode(tree, currentId)?.value}`, 
        currentId,
        visited,
        edges,
        highlightEdge: edgeId,
        parentId: showParent ? parentId : null,
      })
    );
      break;
    }
    currentId = nextId;
  }

  const newTree = cloneTree(tree);
  const newId = newTree.nodes.length;
  newTree.nodes.push({ id: newId, value: key, left: null, right: null, parent: parentId });

  const parent = getNode(newTree, parentId);
  if (direction === "left") {
    parent.left = newId;
  } else {
    parent.right = newId;
  }

  steps.push(
    snapshotState({
      codeLines: lines.attach,
      message: `Inserted node ${key} as the ${direction} child of ${parent?.value}.`,
      tree: newTree,
      visited,
      edges,
      highlightEdge: toEdgeId(parentId, newId),
      foundId: newId,
      parentId: showParent ? parentId : null,
      annotations: { [newId]: "inserted" },
    })
  );

  return steps;
}

function findMinimum(key, tree, startId, pathSteps, { visited, edges, showParent, lines = {} }) {
  let currentId = startId;
  let parentId = getNode(tree, currentId)?.parent ?? null;
  while (true) {
    const node = getNode(tree, currentId);
    if (!node) break;
    visited.add(currentId);
    const isSuccessor = node.left == null;
    pathSteps.push(
      snapshotState({
        codeLines: isSuccessor ? lines.findSuccessor : lines.walkLeft,
        message: isSuccessor
          ? `Successor candidate ${node.value} has no left child; stop searching.`
          : `Move left from ${node.value} to continue searching for the inorder successor of ${key}.`,
        currentId,
        visited,
        edges,
        parentId: showParent ? parentId : null,
      })
    );
    if (node.left == null) break;
    const edgeId = toEdgeId(node.id, node.left);
    if (edgeId) edges.add(edgeId);
    parentId = currentId;
    currentId = node.left;
  }
  return currentId;
}

export function generateRemovalSteps(tree, keyValue, options = {}) {
  const { showParent = false } = options;
  const lines = {
    empty: [2],
    inspect: [2],
    goLeft: [4, 5],
    goRight: [6, 7],
    notFound: [18],
    found: [8],
    caseRight: [9, 10],
    caseLeft: [11, 12],
    findSuccessor: [13],
    walkLeft: [13],
    copyValue: [14],
    removeSuccessor: [15],
    ...options.lines,
  };
  const steps = [];
  if (!tree) return steps;

  const key = parseKey(keyValue);
  if (key == null) return steps;

  const visited = new Set();
  const edges = new Set();
  let currentId = tree.root ?? null;
  let parentId = null;

  if (currentId == null) {
    steps.push(
      snapshotState({
        codeLines: lines.empty,
        message: "Tree is empty; nothing to remove.",
      })
    );
    return steps;
  }

  while (currentId != null) {
    const node = getNode(tree, currentId);
    if (!node) break;
    visited.add(currentId);
    steps.push(
      snapshotState({
        codeLines: lines.inspect,
        message: `Inspect node ${node.value}.`,
        currentId,
        visited,
        edges,
        parentId: showParent ? parentId : null,
      })
    );
    if (node.value === key) break;

    parentId = currentId;
    if (key < node.value) {
      const nextId = node.left;
      const edgeId = toEdgeId(node.id, nextId);
      if (edgeId) edges.add(edgeId);
      steps.push(
        snapshotState({
          codeLines: lines.goLeft,
          message:
            nextId == null
              ? `Key ${key} is smaller; left child is null so the key is absent.`
              : `Key ${key} is smaller; move left toward ${getNode(tree, nextId)?.value}.`,
          currentId,
          visited,
          edges,
          highlightEdge: edgeId,
          parentId: showParent ? parentId : null,
        })
      );
      currentId = nextId ?? null;
      continue;
    }

    const nextId = node.right;
    const edgeId = toEdgeId(node.id, nextId);
    if (edgeId) edges.add(edgeId);
    steps.push(
      snapshotState({
        codeLines: lines.goRight,
        message:
          nextId == null
            ? `Key ${key} is greater; right child is null so the key is absent.`
            : `Key ${key} is greater; move right toward ${getNode(tree, nextId)?.value}.`,
        currentId,
        visited,
        edges,
        highlightEdge: edgeId,
        parentId: showParent ? parentId : null,
      })
    );
    currentId = nextId ?? null;
  }

  const node = getNode(tree, currentId);
  if (!node || node.value !== key) {
    steps.push(
      snapshotState({
        codeLines: lines.notFound,
        message: `Key ${key} was not found; the tree remains unchanged.`,
        visited,
        edges,
        parentId: showParent ? parentId : null,
      })
    );
    return steps;
  }

  steps.push(
    snapshotState({
      codeLines: lines.found,
      message: `Found node ${node.value}; evaluate removal cases.`,
      currentId,
      visited,
      edges,
      targetId: currentId,
      parentId: showParent ? node.parent : null,
    })
  );

  const workingTree = cloneTree(tree);
  const workingNode = getNode(workingTree, currentId);

  if (workingNode.left == null) {
    const replacement = workingNode.right;
    transplant(workingTree, workingNode.id, replacement);
    steps.push(
      snapshotState({
        codeLines: lines.caseRight,
        message:
          replacement == null
            ? `Node ${workingNode.value} has no left child; replace it with its right subtree (null).`
            : `Node ${workingNode.value} has no left child; promote right child ${getNode(workingTree, replacement)?.value}.`,
        tree: workingTree,
        edges,
        visited,
        targetId: workingNode.id,
        parentId: showParent ? getNode(workingTree, workingNode.id)?.parent ?? null : null,
      })
    );
    return steps;
  }

  if (workingNode.right == null) {
    const replacement = workingNode.left;
    transplant(workingTree, workingNode.id, replacement);
    steps.push(
      snapshotState({
        codeLines: lines.caseLeft,
        message: `Node ${workingNode.value} has no right child; promote left child ${getNode(workingTree, replacement)?.value}.`,
        tree: workingTree,
        edges,
        visited,
        targetId: workingNode.id,
        parentId: showParent ? getNode(workingTree, workingNode.id)?.parent ?? null : null,
      })
    );
    return steps;
  }

  // Two-child case: find successor.
  const successorPathSteps = [];
  const successorId = findMinimum(
    key,
    tree,
    workingNode.right,
    successorPathSteps,
    { visited, edges, showParent, lines }
  );
  steps.push(...successorPathSteps);

  const successorNode = getNode(tree, successorId);
  if (!successorNode) return steps;

  steps.push(
    snapshotState({
      codeLines: lines.findSuccessor,
      message: `Successor is node ${successorNode.value}; prepare to transplant.`,
      currentId: successorId,
      visited,
      edges,
      targetId: workingNode.id,
      parentId: showParent ? successorNode.parent : null,
    })
  );

  const successorValue = successorNode.value;

  const valueUpdatedTree = cloneTree(tree);
  const updatedTarget = getNode(valueUpdatedTree, workingNode.id);
  const updatedSuccessor = getNode(valueUpdatedTree, successorId);

  if (updatedTarget && updatedSuccessor) {
    const oldValue = updatedTarget.value;
    updatedTarget.value = updatedSuccessor.value;
    steps.push(
      snapshotState({
        codeLines: lines.copyValue,
        message: `Copy successor value ${successorValue} into node ${oldValue}.`,
        tree: valueUpdatedTree,
        visited,
        edges,
        targetId: updatedTarget.id,
        nodeClasses: {
          [updatedTarget.id]: ["node-found"],
          [updatedSuccessor.id]: ["node-target"],
        },
        annotations: {
          [updatedTarget.id]: ``,
          [updatedSuccessor.id]: "delete next",
        },
        parentId: showParent ? updatedTarget.parent : null,
      })
    );

    steps.push(
      snapshotState({
        codeLines: lines.removeSuccessor,
        message: `Treat successor node ${successorValue} as the next deletion target.`,
        tree: valueUpdatedTree,
        visited,
        edges,
        targetId: updatedSuccessor.id,
        nodeClasses: {
          [updatedSuccessor.id]: ["node-target"],
        },
        annotations: {
          [updatedSuccessor.id]: "delete next",
        },
        parentId: showParent ? updatedSuccessor.parent : null,
      })
    );
  }

  const removalTree = cloneTree(valueUpdatedTree);
  const removalTarget = getNode(removalTree, workingNode.id);
  const removalSuccessor = getNode(removalTree, successorId);
  if (!removalTarget || !removalSuccessor) return steps;

  const removalParentId = removalSuccessor.parent;
  const removalParent = getNode(removalTree, removalParentId);
  const replacementId = removalSuccessor.right ?? null;

  if (removalParent) {
    if (removalParent.left === removalSuccessor.id) {
      removalParent.left = replacementId;
    } else if (removalParent.right === removalSuccessor.id) {
      removalParent.right = replacementId;
    }
  }

  if (replacementId != null) {
    const replacementNode = getNode(removalTree, replacementId);
    if (replacementNode) {
      replacementNode.parent = removalParent ? removalParent.id : null;
    }
  }

  if (removalParentId === removalTarget.id) {
    removalTarget.right = replacementId;
  }

  removalSuccessor.parent = null;
  removalSuccessor.left = null;
  removalSuccessor.right = null;

  const replacementValue =
    replacementId != null ? getNode(removalTree, replacementId)?.value ?? null : null;

  steps.push(
    snapshotState({
      codeLines: lines.removeSuccessor,
      message:
        replacementId == null
          ? `Remove successor node ${successorValue}; it was a leaf so detach it.`
          : `Remove successor node ${successorValue}; promote its right child ${replacementValue}.`,
      tree: removalTree,
      visited,
      edges,
      targetId: removalTarget.id,
      parentId: showParent ? (removalParent ? removalParent.id : removalTarget.id) : null,
      nodeClasses: {
        [removalTarget.id]: ["node-found"],
      },
      annotations: {
        [removalTarget.id]: `keeps ${removalTarget.value}`,
      },
      hiddenNodes: [removalSuccessor.id],
    })
  );

  return steps;
}

export function generateTraversalSteps(tree, order) {
  const steps = [];
  if (!tree) return steps;
  if (tree.root == null) {
    steps.push(
      snapshotState({
        message: "Tree is empty; traversal yields no nodes.",
        codeLines: [1],
      })
    );
    return steps;
  }

  const orderName = (order ?? "inorder").toLowerCase();
  const edges = new Set();
  const visitedSequence = [];
  const sequenceValues = [];
  const visitAnnotations = new Map();
  const completedNodes = new Set();
  const activePhases = new Map();

  const lineMap = {
    inorder: { base: [2], left: [3], visit: [4], right: [5], complete: [5] },
    preorder: { base: [9], visit: [10], left: [11], right: [12], complete: [12] },
    postorder: { base: [15], left: [16], right: [17], visit: [18], complete: [18] },
    levelorder: { base: [22], visit: [25], enqueue: [27, 28], complete: [29] },
  };

  const labels = {
    inorder: "Inorder",
    preorder: "Preorder",
    postorder: "Postorder",
    levelorder: "Level order",
  };

  const phaseClassMap = {
    left: "node-phase-left",
    visit: "node-phase-visit",
    right: "node-phase-right",
    complete: "node-phase-complete",
  };

  const lines = lineMap[orderName] ?? lineMap.inorder;

  function buildAnnotationSnapshot(extra = {}) {
    const base = {};
    visitAnnotations.forEach((text, id) => {
      base[id] = text;
    });
    return { ...base, ...extra };
  }

  function setActivePhase(nodeId, phase) {
    if (nodeId == null) return;
    if (!phase) {
      activePhases.delete(nodeId);
    } else {
      activePhases.set(nodeId, phase);
    }
  }

  function clearActivePhase(nodeId) {
    if (nodeId == null) return;
    activePhases.delete(nodeId);
  }

  function pushPhase({
    nodeId = null,
    codeLines = [],
    message = "",
    annotations = {},
  }) {
    const nodeClasses = {};
    activePhases.forEach((phaseName, id) => {
      const cls = phaseClassMap[phaseName];
      if (!cls) return;
      const classes = nodeClasses[id] ? [...nodeClasses[id]] : [];
      classes.push(cls);
      if (phaseName === "visit") classes.push("node-traversed");
      nodeClasses[id] = classes;
    });
    completedNodes.forEach((id) => {
      const classes = nodeClasses[id] ? [...nodeClasses[id]] : [];
      classes.push(phaseClassMap.complete);
      nodeClasses[id] = classes;
    });
    steps.push(
      snapshotState({
        codeLines,
        message,
        currentId: nodeId,
        visited: visitedSequence,
        edges,
        nodeClasses,
        annotations: buildAnnotationSnapshot(annotations),
      })
    );
  }

  function addVisit(node, codeLines, message) {
    visitedSequence.push(node.id);
    sequenceValues.push(node.value);
    const orderNumber = visitedSequence.length;
    const annotation = `#${orderNumber}`;
    visitAnnotations.set(node.id, annotation);
    setActivePhase(node.id, "visit");
    pushPhase({
      nodeId: node.id,
      codeLines,
      message,
      annotations: { [node.id]: annotation },
    });
  }

  function addEdge(parentId, childId) {
    if (parentId == null || childId == null) return;
    const edgeId = toEdgeId(parentId, childId);
    if (edgeId) edges.add(edgeId);
  }

  function inorder(id) {
    const node = getNode(tree, id);
    if (!node) return;
    setActivePhase(node.id, "left");
    pushPhase({
      nodeId: node.id,
      codeLines: lines.left ?? [],
      message:
        node.left == null
          ? `Left child of ${node.value} is null; return immediately.`
          : `Traverse left subtree of ${node.value}; call inorder(${getNode(tree, node.left)?.value}).`,
    });
    if (node.left != null) {
      addEdge(node.id, node.left);
      inorder(node.left);
    }
    addVisit(node, lines.visit ?? [], `Visit node ${node.value}; add to traversal output.`);
    setActivePhase(node.id, "right");
    pushPhase({
      nodeId: node.id,
      codeLines: lines.right ?? [],
      message:
        node.right == null
          ? `Right child of ${node.value} is null; return to ${node.value}.`
          : `Traverse right subtree of ${node.value}; call inorder(${getNode(tree, node.right)?.value}).`,
    });
    if (node.right != null) {
      addEdge(node.id, node.right);
      inorder(node.right);
    }
    clearActivePhase(node.id);
    completedNodes.add(node.id);
    pushPhase({
      nodeId: node.id,
      codeLines: lines.complete ?? [],
      message: `Finished processing ${node.value}; return to parent.`,
    });
  }

  function preorder(id) {
    const node = getNode(tree, id);
    if (!node) return;
    addVisit(
      node,
      lines.visit ?? [],
      `Visit node ${node.value} before traversing its subtrees.`
    );
    setActivePhase(node.id, "left");
    pushPhase({
      nodeId: node.id,
      codeLines: lines.left ?? [],
      message:
        node.left == null
          ? `Left child of ${node.value} is null; nothing to traverse.`
          : `Traverse left subtree of ${node.value}; call preorder(${getNode(tree, node.left)?.value}).`,
    });
    if (node.left != null) {
      addEdge(node.id, node.left);
      preorder(node.left);
    }
    setActivePhase(node.id, "right");
    pushPhase({
      nodeId: node.id,
      codeLines: lines.right ?? [],
      message:
        node.right == null
          ? `Right child of ${node.value} is null; return to ${node.value}.`
          : `Traverse right subtree of ${node.value}; call preorder(${getNode(tree, node.right)?.value}).`,
    });
    if (node.right != null) {
      addEdge(node.id, node.right);
      preorder(node.right);
    }
    clearActivePhase(node.id);
    completedNodes.add(node.id);
    pushPhase({
      nodeId: node.id,
      codeLines: lines.complete ?? [],
      message: `Finished processing ${node.value}; return to parent.`,
    });
  }

  function postorder(id) {
    const node = getNode(tree, id);
    if (!node) return;
    setActivePhase(node.id, "left");
    pushPhase({
      nodeId: node.id,
      codeLines: lines.left ?? [],
      message:
        node.left == null
          ? `Left child of ${node.value} is null; nothing to traverse.`
          : `Traverse left subtree of ${node.value}; call postorder(${getNode(tree, node.left)?.value}).`,
    });
    if (node.left != null) {
      addEdge(node.id, node.left);
      postorder(node.left);
    }
    setActivePhase(node.id, "right");
    pushPhase({
      nodeId: node.id,
      codeLines: lines.right ?? [],
      message:
        node.right == null
          ? `Right child of ${node.value} is null; return to ${node.value}.`
          : `Traverse right subtree of ${node.value}; call postorder(${getNode(tree, node.right)?.value}).`,
    });
    if (node.right != null) {
      addEdge(node.id, node.right);
      postorder(node.right);
    }
    addVisit(
      node,
      lines.visit ?? [],
      `Children of ${node.value} processed; visit node and output value.`
    );
    clearActivePhase(node.id);
    completedNodes.add(node.id);
    pushPhase({
      nodeId: node.id,
      codeLines: lines.complete ?? [],
      message: `Finished processing ${node.value}; return to parent.`,
    });
  }

  function levelOrder(startId) {
    const queue = [startId];
    while (queue.length) {
      const nodeId = queue.shift();
      const node = getNode(tree, nodeId);
      if (!node) continue;

      const childMessages = [];
      if (node.left != null) {
        queue.push(node.left);
        addEdge(node.id, node.left);
        childMessages.push(`enqueue left child ${getNode(tree, node.left)?.value}`);
      } else {
        childMessages.push("left child is null");
      }
      if (node.right != null) {
        queue.push(node.right);
        addEdge(node.id, node.right);
        childMessages.push(`enqueue right child ${getNode(tree, node.right)?.value}`);
      } else {
        childMessages.push("right child is null");
      }

      addVisit(
        node,
        lines.visit ?? [],
        `Dequeue node ${node.value}; visit it. ${childMessages.join("; ")}.`
      );
      clearActivePhase(node.id);
      completedNodes.add(node.id);
      pushPhase({
        nodeId: node.id,
        codeLines: lines.complete ?? [],
        message: `Finished processing ${node.value}; continue with the queue.`,
      });
    }
  }

  switch (orderName) {
    case "preorder":
      preorder(tree.root);
      break;
    case "postorder":
      postorder(tree.root);
      break;
    case "levelorder":
      levelOrder(tree.root);
      break;
    default:
      inorder(tree.root);
  }

  activePhases.clear();

  const sequenceText = sequenceValues.join(", ") || "∅";
  const summaryAnnotations = buildAnnotationSnapshot();
  const summaryClasses = {};
  completedNodes.forEach((id) => {
    summaryClasses[id] = [phaseClassMap.complete];
  });

  steps.push(
    snapshotState({
      codeLines: [],
      message: `${labels[orderName] ?? "Traversal"} order: ${sequenceText}.`,
      visited: visitedSequence,
      edges,
      nodeClasses: summaryClasses,
      annotations: summaryAnnotations,
    })
  );

  return steps;
}

export function generateHeightSteps(tree) {
  const steps = [];
  if (!tree) return steps;
  if (tree.root == null) {
    steps.push(
      snapshotState({
        codeLines: [2],
        message: "An empty tree has height -1 by convention.",
      })
    );
    return steps;
  }

  const visited = new Set();
  const heights = new Map();
  const buildHeightAnnotations = (extra = {}) => {
    const base = {};
    heights.forEach((value, nodeId) => {
      base[nodeId] = `h=${value}`;
    });
    return { ...base, ...extra };
  };
  const buildHeightClasses = (extra = {}) => {
    const base = {};
    heights.forEach((_, nodeId) => {
      base[nodeId] = ["node-height"];
    });
    Object.entries(extra).forEach(([key, value]) => {
      const list = Array.isArray(value) ? value : [value];
      base[key] = (base[key] ?? []).concat(list);
    });
    return base;
  };

  function compute(id, depth = 0, trace = []) {
    if (id == null) {
      steps.push(
        snapshotState({
          codeLines: [2, 3],
          message: `Reached a null child; contribute height -1.`,
          visited,
          edges: new Set(),
          annotations: buildHeightAnnotations(),
          nodeClasses: buildHeightClasses(),
        })
      );
      return -1;
    }
    const node = getNode(tree, id);
    if (!node) return -1;
    visited.add(id);

    steps.push(
      snapshotState({
        codeLines: [2],
        message: `Compute height of node ${node.value} (depth ${depth}).`,
        currentId: id,
        visited,
        edges: new Set(),
        annotations: buildHeightAnnotations(),
        nodeClasses: buildHeightClasses(),
      })
    );

    const leftHeight = compute(node.left, depth + 1, [...trace, id]);
    const rightHeight = compute(node.right, depth + 1, [...trace, id]);
    const height = Math.max(leftHeight, rightHeight) + 1;
    heights.set(id, height);

    steps.push(
      snapshotState({
        codeLines: [4, 5],
        message: `Height at node ${node.value} is max(${leftHeight}, ${rightHeight}) + 1 = ${height}.`,
        currentId: id,
        visited,
        nodeClasses: buildHeightClasses(),
        annotations: buildHeightAnnotations(),
      })
    );
    return height;
  }

  const h = compute(tree.root, 0, []);

  steps.push(
    snapshotState({
      codeLines: [6],
      message: `Tree height is ${h}.`,
      foundId: tree.root,
      nodeClasses: buildHeightClasses({
        [tree.root]: ["node-height", "node-found"],
      }),
      annotations: buildHeightAnnotations(),
    })
  );

  return steps;
}

export function generateParentOperationSteps(tree, { mode, keyValue }) {
  if (mode === "insert") {
    return generateInsertionSteps(tree, keyValue, {
      showParent: true,
      lines: {
        emptyTree: [13, 14],
        inspect: [4, 5],
        goLeft: [6, 7],
        goRight: [8, 9],
        duplicate: [10, 11],
        attach: [15, 16],
      },
    });
  }
  if (mode === "remove") {
    return generateRemovalSteps(tree, keyValue, {
      showParent: true,
      lines: {
        empty: [21, 22],
        inspect: [23, 24],
        goLeft: [25],
        goRight: [26],
        notFound: [28],
        found: [29],
        caseRight: [29, 30, 31, 32, 33],
        caseLeft: [29, 30, 31, 32, 33],
        findSuccessor: [35, 36],
        walkLeft: [37, 38, 39],
        copyValue: [41],
        removeSuccessor: [42, 43],
      },
    });
  }
  return [];
}
