const POINTER_ORDERS = {
  append: [
    { key: "head", label: "head" },
    { key: "tail", label: "tail" },
    { key: "cur", label: "cur" },
    { key: "new", label: "newNode" },
  ],
  prepend: [
    { key: "head", label: "head" },
    { key: "tail", label: "tail" },
    { key: "new", label: "newNode" },
  ],
  insertAfter: [
    { key: "head", label: "head" },
    { key: "tail", label: "tail" },
    { key: "target", label: "target" },
    { key: "new", label: "newNode" },
  ],
  removeAfter: [
    { key: "head", label: "head" },
    { key: "tail", label: "tail" },
    { key: "target", label: "target" },
    { key: "cur", label: "removed" },
  ],
  removeByValue: [
    { key: "head", label: "head" },
    { key: "tail", label: "tail" },
    { key: "prev", label: "prev" },
    { key: "cur", label: "cur" },
  ],
  traverse: [
    { key: "head", label: "head" },
    { key: "cur", label: "cur" },
    { key: "tail", label: "tail" },
  ],
};

export function pointerConfig(operation) {
  return POINTER_ORDERS[operation] ?? [];
}

export function createList(values, startId = 0) {
  let nextId = startId;
  const nodes = values.map((value) => ({
    id: nextId++,
    data: Number(value),
    prev: null,
    next: null,
  }));

  for (let i = 0; i < nodes.length - 1; i += 1) {
    nodes[i].next = nodes[i + 1].id;
    nodes[i + 1].prev = nodes[i].id;
  }

  return {
    kind: "dll",
    head: nodes[0]?.id ?? null,
    tail: nodes.at(-1)?.id ?? null,
    nodes,
    nextId,
  };
}

function cloneList(list) {
  return {
    kind: "dll",
    head: list.head,
    tail: list.tail,
    nodes: list.nodes.map((node) => ({
      id: node.id,
      data: node.data,
      prev: node.prev ?? null,
      next: node.next ?? null,
    })),
  };
}

function nodeById(list, id) {
  return list.nodes.find((node) => node.id === id) ?? null;
}

function cloneListForViz(list) {
  const nodes = list.nodes.map((node) => ({
    id: node.id,
    data: node.data,
    prev: node.prev ?? null,
    next: node.next ?? null,
  }));

  const order = [];
  const visited = new Set();
  let cur = list.head;
  while (cur != null && !visited.has(cur)) {
    order.push(cur);
    visited.add(cur);
    const node = nodes.find((n) => n.id === cur);
    cur = node?.next ?? null;
  }

  const orderSet = new Set(order);
  const detached = nodes.filter((n) => !orderSet.has(n.id)).map((n) => n.id);

  return {
    kind: "dll",
    head: list.head,
    tail: list.tail,
    nodes,
    order,
    detached,
  };
}

function ensureLinks(list) {
  let tail = null;
  let prev = null;
  const visited = new Set();
  let cur = list.head;

  while (cur != null && !visited.has(cur)) {
    visited.add(cur);
    const node = nodeById(list, cur);
    if (!node) break;
    node.prev = prev;
    tail = node.id;
    prev = node.id;
    cur = node.next ?? null;
  }

  list.tail = tail;
}

function sanitizeList(list) {
  const visited = [];
  const seen = new Set();
  let cur = list.head;

  while (cur != null && !seen.has(cur)) {
    seen.add(cur);
    visited.push(cur);
    const node = nodeById(list, cur);
    cur = node?.next ?? null;
  }

  const nodes = visited
    .map((id) => nodeById(list, id))
    .filter(Boolean)
    .map((node) => ({
      id: node.id,
      data: node.data,
      prev: node.prev ?? null,
      next: node.next ?? null,
    }));

  const sanitized = {
    kind: "dll",
    head: list.head,
    tail: list.tail,
    nodes,
  };
  ensureLinks(sanitized);
  return sanitized;
}

function addStep(steps, list, codeLines, message, pointers, pointerLabels = null) {
  steps.push({
    codeLines,
    message,
    list: cloneListForViz(list),
    pointers: { ...pointers },
    pointerLabels: pointerLabels ? { ...pointerLabels } : undefined,
  });
}

function pointerState(base, overrides = {}) {
  return {
    head: base.head ?? null,
    tail: base.tail ?? null,
    cur: null,
    prev: null,
    target: null,
    new: null,
    ...overrides,
  };
}

function createNode(id, data) {
  return { id, data, prev: null, next: null };
}

function generateAppendSteps(steps, list, params, ctx) {
  const value = params?.value;
  if (!Number.isFinite(value)) return;

  const newNodeId = ctx.nextId++;
  const newNode = createNode(newNodeId, value);
  list.nodes.push(newNode);

  addStep(steps, list, [2], `Create new node with data ${value}.`, pointerState(list, { new: newNodeId }));

  if (list.head == null) {
    addStep(steps, list, [3], "List is empty, head is nullptr.", pointerState(list, { new: newNodeId }));
    list.head = newNodeId;
    list.tail = newNodeId;
    addStep(
      steps,
      list,
      [4, 5],
      "Set both head and tail to the new node.",
      pointerState(list, { head: list.head, tail: list.tail, new: newNodeId })
    );
    return;
  }

  let curId = list.head;
  addStep(steps, list, [8], "Initialize cur to the head node.", pointerState(list, { cur: curId, new: newNodeId }));

  while (true) {
    const curNode = nodeById(list, curId);
    const hasNext = curNode?.next != null;
    addStep(
      steps,
      list,
      [9],
      hasNext ? "cur->next is not nullptr; keep traversing." : "cur->next is nullptr; cur is at tail.",
      pointerState(list, { cur: curId, new: newNodeId })
    );
    if (!hasNext) break;
    curId = curNode?.next ?? null;
    addStep(steps, list, [10], "Advance cur to next node.", pointerState(list, { cur: curId, new: newNodeId }));
  }

  const curNode = nodeById(list, curId);
  if (curNode) {
    curNode.next = newNodeId;
    newNode.prev = curNode.id;
  }
  list.tail = newNodeId;

  addStep(steps, list, [12], "Link cur->next to newNode.", pointerState(list, { cur: curId, new: newNodeId }));
  addStep(
    steps,
    list,
    [13, 14],
    "Set newNode->prev to cur and move tail to newNode.",
    pointerState(list, { cur: curId, new: newNodeId, tail: list.tail })
  );
}

function generatePrependSteps(steps, list, params, ctx) {
  const value = params?.value;
  if (!Number.isFinite(value)) return;

  const newNodeId = ctx.nextId++;
  const newNode = createNode(newNodeId, value);
  list.nodes.push(newNode);

  addStep(steps, list, [2], `Create new node with data ${value}.`, pointerState(list, { new: newNodeId }));

  newNode.next = list.head;
  addStep(steps, list, [3], "Point newNode->next to current head.", pointerState(list, { new: newNodeId }));

  if (list.head != null) {
    const headNode = nodeById(list, list.head);
    if (headNode) headNode.prev = newNodeId;
    addStep(
      steps,
      list,
      [4, 5],
      "Current head exists; set head->prev to newNode.",
      pointerState(list, { head: list.head, new: newNodeId })
    );
  }

  list.head = newNodeId;
  addStep(steps, list, [7], "Move head to newNode.", pointerState(list, { head: list.head, new: newNodeId, tail: list.tail }));

  if (list.tail == null) {
    list.tail = newNodeId;
    addStep(
      steps,
      list,
      [8, 9],
      "List was empty; set tail to newNode.",
      pointerState(list, { head: list.head, tail: list.tail, new: newNodeId })
    );
  }
}

function generateInsertAfterSteps(steps, list, params, ctx) {
  const value = params?.value;
  const targetValue = params?.targetValue;
  if (!Number.isFinite(value) || !Number.isFinite(targetValue)) return;

  const newNodeId = ctx.nextId++;
  const newNode = createNode(newNodeId, value);
  list.nodes.push(newNode);

  addStep(steps, list, [6], `Allocate new node with data ${value}.`, pointerState(list, { target: list.head, new: newNodeId }));

  let targetId = list.head;
  addStep(
    steps,
    list,
    [2],
    "Start searching for targetValue at head.",
    pointerState(list, { target: targetId, new: newNodeId })
  );

  while (targetId != null) {
    const targetNode = nodeById(list, targetId);
    const matches = targetNode?.data === targetValue;
    addStep(
      steps,
      list,
      [3],
      matches ? `Found targetValue ${targetValue}.` : `target->data (${targetNode?.data}) != ${targetValue}; continue.`,
      pointerState(list, { target: targetId, new: newNodeId })
    );
    if (matches) break;
    targetId = targetNode?.next ?? null;
    addStep(
      steps,
      list,
      [4],
      targetId == null ? "Reached end; targetValue not found yet." : "Advance target to next.",
      pointerState(list, { target: targetId, new: newNodeId })
    );
  }

  if (targetId == null) {
    addStep(steps, list, [5], "target is nullptr; abort insertion.", pointerState(list, { new: newNodeId }));
    list.nodes = list.nodes.filter((node) => node.id !== newNodeId);
    addStep(steps, list, [5], "Discard allocated newNode; list unchanged.", pointerState(list, {}));
    return;
  }

  const targetNode = nodeById(list, targetId);
  newNode.next = targetNode?.next ?? null;
  addStep(steps, list, [7], "Set newNode->next to target->next.", pointerState(list, { target: targetId, new: newNodeId }));

  newNode.prev = targetId;
  addStep(steps, list, [8], "Set newNode->prev to target.", pointerState(list, { target: targetId, new: newNodeId }));

  if (targetNode?.next != null) {
    const rightNode = nodeById(list, targetNode.next);
    if (rightNode) rightNode.prev = newNodeId;
    addStep(
      steps,
      list,
      [9, 10],
      "target->next exists; set target->next->prev to newNode.",
      pointerState(list, { target: targetId, new: newNodeId })
    );
  } else {
    list.tail = newNodeId;
    addStep(
      steps,
      list,
      [11, 12],
      "target was tail; move tail to newNode.",
      pointerState(list, { target: targetId, new: newNodeId, tail: list.tail })
    );
  }

  if (targetNode) targetNode.next = newNodeId;
  addStep(steps, list, [14], "Link target->next to newNode.", pointerState(list, { target: targetId, new: newNodeId }));
}

function generateRemoveAfterSteps(steps, list, params) {
  const targetValue = params?.targetValue;
  if (!Number.isFinite(targetValue)) return;

  let targetId = list.head;
  addStep(steps, list, [2], "Start at head to find targetValue.", pointerState(list, { target: targetId }));

  while (targetId != null) {
    const targetNode = nodeById(list, targetId);
    const matches = targetNode?.data === targetValue;
    addStep(
      steps,
      list,
      [3],
      matches ? `target->data == ${targetValue}; stop.` : `target->data (${targetNode?.data}) != ${targetValue}; continue.`,
      pointerState(list, { target: targetId })
    );
    if (matches) break;
    targetId = targetNode?.next ?? null;
    addStep(
      steps,
      list,
      [4],
      targetId == null ? "Reached end; targetValue not found." : "Advance target to target->next.",
      pointerState(list, { target: targetId })
    );
  }

  if (targetId == null) {
    addStep(steps, list, [6], "target is nullptr; nothing removed.", pointerState(list, {}));
    return;
  }

  const targetNode = nodeById(list, targetId);
  if (!targetNode || targetNode.next == null) {
    addStep(steps, list, [5], "target->next is nullptr; nothing after target.", pointerState(list, { target: targetId }));
    return;
  }

  const removedId = targetNode.next;
  const removedNode = nodeById(list, removedId);
  addStep(
    steps,
    list,
    [7],
    `Store node after target (${removedNode?.data}) as removed.`,
    pointerState(list, { target: targetId, cur: removedId })
  );

  targetNode.next = removedNode?.next ?? null;
  addStep(steps, list, [8], "Link target->next to removed->next.", pointerState(list, { target: targetId, cur: removedId }));

  if (removedNode?.next != null) {
    const rightNode = nodeById(list, removedNode.next);
    if (rightNode) rightNode.prev = targetId;
    addStep(
      steps,
      list,
      [8, 9],
      "Set removed->next->prev to target.",
      pointerState(list, { target: targetId, cur: removedId })
    );
  } else {
    list.tail = targetId;
    addStep(
      steps,
      list,
      [11, 12],
      "Removed node was tail; update tail to target.",
      pointerState(list, { target: targetId, cur: removedId, tail: list.tail })
    );
  }

  if (removedNode) {
    removedNode.prev = null;
    removedNode.next = null;
  }
  list.nodes = list.nodes.filter((node) => node.id !== removedId);
  addStep(steps, list, [14], "Delete removed node.", pointerState(list, { target: targetId, tail: list.tail }));
}

function generateRemoveByValueSteps(steps, list, params) {
  const value = params?.value;
  if (!Number.isFinite(value)) return;

  addStep(
    steps,
    list,
    [2],
    list.head == null ? "List is empty; nothing to remove." : "List is not empty; continue.",
    pointerState(list, { cur: list.head })
  );

  if (list.head == null) return;

  const headNode = nodeById(list, list.head);
  if (headNode?.data === value) {
    const oldHeadId = headNode.id;
    addStep(
      steps,
      list,
      [3],
      `Head matches ${value}; mark node as old head.`,
      pointerState(list, { cur: oldHeadId }),
      { cur: "old head" }
    );

    list.head = headNode.next ?? null;
    addStep(
      steps,
      list,
      [5],
      "Move head to removed->next.",
      pointerState(list, { head: list.head, cur: oldHeadId }),
      { cur: "old head" }
    );

    if (list.head != null) {
      const newHead = nodeById(list, list.head);
      if (newHead) newHead.prev = null;
      addStep(
        steps,
        list,
        [6],
        "Set new head->prev to nullptr.",
        pointerState(list, { head: list.head, cur: oldHeadId }),
        { cur: "old head" }
      );
    }

    if (list.tail === oldHeadId) {
      list.tail = list.head;
      addStep(
        steps,
        list,
        [7],
        "Removed node was also tail; update tail to head.",
        pointerState(list, { head: list.head, tail: list.tail, cur: oldHeadId }),
        { cur: "old head" }
      );
    }

    list.nodes = list.nodes.filter((node) => node.id !== oldHeadId);
    addStep(steps, list, [8], "Delete old head node.", pointerState(list, { head: list.head, tail: list.tail }));
    return;
  }

  let prevId = list.head;
  let curId = headNode?.next ?? null;
  addStep(
    steps,
    list,
    [11, 12],
    "Initialize prev to head and cur to head->next.",
    pointerState(list, { prev: prevId, cur: curId })
  );

  while (curId != null) {
    const curNode = nodeById(list, curId);
    const matches = curNode?.data === value;
    addStep(
      steps,
      list,
      [13],
      matches ? `cur->data matches ${value}; stop.` : `cur->data (${curNode?.data}) != ${value}; continue.`,
      pointerState(list, { prev: prevId, cur: curId })
    );
    if (matches) break;
    prevId = curId;
    curId = curNode?.next ?? null;
    addStep(
      steps,
      list,
      [14, 15],
      curId == null ? "Reached end while searching." : "Advance prev and cur.",
      pointerState(list, { prev: prevId, cur: curId })
    );
  }

  if (curId == null) {
    addStep(steps, list, [17], "cur is nullptr; value not found.", pointerState(list, { prev: prevId }));
    return;
  }

  const prevNode = nodeById(list, prevId);
  const curNode = nodeById(list, curId);
  if (prevNode) prevNode.next = curNode?.next ?? null;
  addStep(steps, list, [18], "Link prev->next to cur->next.", pointerState(list, { prev: prevId, cur: curId }));

  if (curNode?.next != null) {
    const rightNode = nodeById(list, curNode.next);
    if (rightNode) rightNode.prev = prevId;
    addStep(
      steps,
      list,
      [19],
      "Set cur->next->prev to prev.",
      pointerState(list, { prev: prevId, cur: curId })
    );
  }

  if (list.tail === curId) {
    list.tail = prevId;
    addStep(
      steps,
      list,
      [20],
      "Removed node was tail; update tail to prev.",
      pointerState(list, { prev: prevId, cur: curId, tail: list.tail })
    );
  }

  list.nodes = list.nodes.filter((node) => node.id !== curId);
  addStep(steps, list, [21], "Delete removed node.", pointerState(list, { prev: prevId, tail: list.tail }));
}

function generateTraversalSteps(steps, list) {
  addStep(steps, list, [2], "Start traversal at head.", pointerState(list, { cur: list.head }));

  let curId = list.head;
  while (true) {
    addStep(
      steps,
      list,
      [3],
      curId == null ? "cur is nullptr; stop." : "cur is not nullptr; execute loop.",
      pointerState(list, { cur: curId })
    );
    if (curId == null) break;

    const curNode = nodeById(list, curId);
    addStep(steps, list, [4], `Visit cur->data (${curNode?.data}).`, pointerState(list, { cur: curId }));
    curId = curNode?.next ?? null;
    addStep(steps, list, [5], "Advance cur to cur->next.", pointerState(list, { cur: curId }));
  }
}

export function snapshotList(list) {
  return cloneListForViz(list);
}

const GENERATORS = {
  append: generateAppendSteps,
  prepend: generatePrependSteps,
  insertAfter: generateInsertAfterSteps,
  removeAfter: generateRemoveAfterSteps,
  removeByValue: generateRemoveByValueSteps,
  traverse: generateTraversalSteps,
};

export function generateOperationSteps(operation, sourceList, params, nextId) {
  const generator = GENERATORS[operation];
  if (!generator) {
    return { steps: [], list: cloneList(sourceList), nextId };
  }

  const working = cloneList(sourceList);
  const steps = [];
  const ctx = { nextId };

  generator(steps, working, params, ctx);
  ensureLinks(working);

  return {
    steps,
    list: sanitizeList(working),
    nextId: ctx.nextId ?? nextId,
  };
}
