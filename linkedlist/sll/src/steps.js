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
    next: null,
  }));

  for (let i = 0; i < nodes.length - 1; i += 1) {
    nodes[i].next = nodes[i + 1].id;
  }

  return {
    kind: "sll",
    head: nodes[0]?.id ?? null,
    tail: nodes.at(-1)?.id ?? null,
    nodes,
    nextId,
  };
}

function cloneList(list) {
  return {
    kind: "sll",
    head: list.head,
    tail: list.tail,
    nodes: list.nodes.map((node) => ({
      id: node.id,
      data: node.data,
      next: node.next,
    })),
  };
}

function cloneListForViz(list) {
  const nodes = list.nodes.map((node) => ({
    id: node.id,
    data: node.data,
    next: node.next,
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
    kind: "sll",
    head: list.head,
    tail: list.tail,
    nodes,
    order,
    detached,
  };
}

function nodeById(list, id) {
  return list.nodes.find((node) => node.id === id) ?? null;
}

function ensureTail(list) {
  let tail = null;
  const visited = new Set();
  let cur = list.head;
  while (cur != null && !visited.has(cur)) {
    visited.add(cur);
    tail = cur;
    const node = nodeById(list, cur);
    cur = node?.next ?? null;
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
      next: node.next,
    }));

  const sanitized = {
    kind: "sll",
    head: list.head,
    tail: list.tail,
    nodes,
  };
  ensureTail(sanitized);
  return sanitized;
}

function addStep(steps, list, codeLines, message, pointers) {
  steps.push({
    codeLines,
    message,
    list: cloneListForViz(list),
    pointers: { ...pointers },
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
  return { id, data, next: null };
}

function generateAppendSteps(steps, list, params, ctx) {
  const value = params?.value;
  if (!Number.isFinite(value)) return;

  const newNodeId = ctx.nextId++;
  const newNode = createNode(newNodeId, value);
  list.nodes.push(newNode);

  addStep(
    steps,
    list,
    [2],
    `Create new node with data ${value}.`,
    pointerState(list, { new: newNodeId })
  );

  if (list.head == null) {
    addStep(
      steps,
      list,
      [3],
      "List is empty, head is nullptr.",
      pointerState(list, { new: newNodeId })
    );
    list.head = newNodeId;
    list.tail = newNodeId;
    addStep(
      steps,
      list,
      [4, 5],
      "Set both head and tail to the new node.",
      pointerState(list, { head: list.head, tail: list.tail, new: newNodeId })
    );
    addStep(
      steps,
      list,
      [6],
      "Return; append finished.",
      pointerState(list, { head: list.head, tail: list.tail })
    );
    return;
  }

  let curId = list.head;
  addStep(
    steps,
    list,
    [8],
    "Initialize cur to the head node.",
    pointerState(list, { cur: curId, new: newNodeId })
  );

  while (true) {
    const curNode = nodeById(list, curId);
    const hasNext = curNode?.next != null;
    addStep(
      steps,
      list,
      [9],
      hasNext
        ? "cur->next is not nullptr; stay in the loop."
        : "cur->next is nullptr; cur is at the tail.",
      pointerState(list, { cur: curId, new: newNodeId })
    );
    if (!hasNext) break;
    curId = curNode?.next ?? null;
    addStep(
      steps,
      list,
      [10],
      "Advance cur to the next node.",
      pointerState(list, { cur: curId, new: newNodeId })
    );
  }

  const curNode = nodeById(list, curId);
  if (curNode) curNode.next = newNodeId;
  addStep(
    steps,
    list,
    [12],
    "Link cur->next to the new node.",
    pointerState(list, { cur: curId, new: newNodeId })
  );

  list.tail = newNodeId;
  addStep(
    steps,
    list,
    [13],
    "Update tail to the new node.",
    pointerState(list, { cur: curId, new: newNodeId, tail: list.tail })
  );
}

function generatePrependSteps(steps, list, params, ctx) {
  const value = params?.value;
  if (!Number.isFinite(value)) return;

  const newNodeId = ctx.nextId++;
  const newNode = createNode(newNodeId, value);
  list.nodes.push(newNode);

  addStep(
    steps,
    list,
    [2],
    `Create new node with data ${value}.`,
    pointerState(list, { new: newNodeId })
  );

  newNode.next = list.head;
  addStep(
    steps,
    list,
    [3],
    "Point newNode->next to the current head.",
    pointerState(list, { new: newNodeId })
  );

  list.head = newNodeId;
  addStep(
    steps,
    list,
    [4],
    "Move head to the new node.",
    pointerState(list, { head: list.head, new: newNodeId, tail: list.tail })
  );

  if (list.tail == null) {
    list.tail = newNodeId;
    addStep(
      steps,
      list,
      [5, 6],
      "List was empty; update tail to the new node as well.",
      pointerState(list, { head: list.head, tail: list.tail, new: newNodeId })
    );
  }
}

function generateInsertAfterSteps(steps, list, params, ctx) {
  const value = params?.value;
  const targetValue = params?.targetValue;
  if (!Number.isFinite(value) || !Number.isFinite(targetValue)) return;

  let targetId = list.head;
  addStep(
    steps,
    list,
    [2],
    "Start searching for targetValue at the head.",
    pointerState(list, { target: targetId })
  );

  while (targetId != null) {
    const targetNode = nodeById(list, targetId);
    const matches = targetNode?.data === targetValue;
    addStep(
      steps,
      list,
      [3],
      matches
        ? `Found targetValue ${targetValue}.`
        : `target->data (${targetNode?.data}) != ${targetValue}; continue searching.`,
      pointerState(list, { target: targetId })
    );
    if (matches) break;
    targetId = targetNode?.next ?? null;
    addStep(
      steps,
      list,
      [4],
      targetId == null
        ? "Reached end of list; targetValue not found yet."
        : "Advance target to the next node.",
      pointerState(list, { target: targetId })
    );
  }

  if (targetId == null) {
    addStep(
      steps,
      list,
      [5],
      "target is nullptr; targetValue not found. Abort insertion.",
      pointerState(list, {})
    );
    return;
  }

  const newNodeId = ctx.nextId++;
  const newNode = createNode(newNodeId, value);
  list.nodes.push(newNode);
  addStep(
    steps,
    list,
    [6],
    `Allocate new node with data ${value}.`,
    pointerState(list, { target: targetId, new: newNodeId })
  );

  const targetNode = nodeById(list, targetId);
  newNode.next = targetNode?.next ?? null;
  addStep(
    steps,
    list,
    [7],
    "Set newNode->next to target->next.",
    pointerState(list, { target: targetId, new: newNodeId })
  );

  if (targetNode) targetNode.next = newNodeId;
  addStep(
    steps,
    list,
    [8],
    "Link target->next to the new node.",
    pointerState(list, { target: targetId, new: newNodeId })
  );

  if (list.tail === targetId) {
    list.tail = newNodeId;
    addStep(
      steps,
      list,
      [9, 10],
      "Target was the tail; update tail to the new node.",
      pointerState(list, { target: targetId, new: newNodeId, tail: list.tail })
    );
  }
}

function generateRemoveAfterSteps(steps, list, params) {
  const targetValue = params?.targetValue;
  if (!Number.isFinite(targetValue)) return;

  let targetId = list.head;
  addStep(
    steps,
    list,
    [2],
    "Start at the head to find targetValue.",
    pointerState(list, { target: targetId })
  );

  while (targetId != null) {
    const targetNode = nodeById(list, targetId);
    const matches = targetNode?.data === targetValue;
    addStep(
      steps,
      list,
      [3],
      matches
        ? `target->data == ${targetValue}; stop searching.`
        : `target->data (${targetNode?.data}) != ${targetValue}; keep searching.`,
      pointerState(list, { target: targetId })
    );
    if (matches) break;
    targetId = targetNode?.next ?? null;
    addStep(
      steps,
      list,
      [4],
      targetId == null
        ? "Next pointer is nullptr; targetValue not found."
        : "Advance target to target->next.",
      pointerState(list, { target: targetId })
    );
  }

  if (targetId == null) {
    addStep(
      steps,
      list,
      [5],
      "target is nullptr; nothing to remove.",
      pointerState(list, {})
    );
    return;
  }

  const targetNode = nodeById(list, targetId);
  if (!targetNode || targetNode.next == null) {
    addStep(
      steps,
      list,
      [5],
      "target->next is nullptr; no node exists after target.",
      pointerState(list, { target: targetId })
    );
    return;
  }

  const removedId = targetNode.next;
  const removedNode = nodeById(list, removedId);
  const removedValue = removedNode?.data;
  addStep(
    steps,
    list,
    [6],
    `Store node after target (${removedNode?.data}) as removed.`,
    pointerState(list, { target: targetId, cur: removedId })
  );

  targetNode.next = removedNode?.next ?? null;
  addStep(
    steps,
    list,
    [7],
    "Bypass the removed node by linking target->next to removed->next.",
    pointerState(list, { target: targetId, cur: removedId })
  );

  if (list.tail === removedId) {
    list.tail = targetId;
    addStep(
      steps,
      list,
      [8, 9],
      "Removed node was the tail; update tail to target.",
      pointerState(list, { target: targetId, cur: removedId, tail: list.tail })
    );
  }

  if (removedNode) removedNode.next = null;
  list.nodes = list.nodes.filter((node) => node.id !== removedId);
  addStep(
    steps,
    list,
    [10],
    `Delete the removed node (${removedValue}); it is no longer in the list.`,
    pointerState(list, { target: targetId, tail: list.tail })
  );
}

function generateRemoveByValueSteps(steps, list, params) {
  const value = params?.value;
  if (!Number.isFinite(value)) return;

  addStep(
    steps,
    list,
    [2],
    list.head == null
      ? "List is empty; nothing to remove."
      : "List is not empty; continue.",
    pointerState(list, { cur: list.head })
  );

  if (list.head == null) return;

  const headNode = nodeById(list, list.head);
  if (headNode?.data === value) {
    addStep(
      steps,
      list,
      [3],
      `Head matches value ${value}; remove the head.`,
      pointerState(list, { cur: list.head })
    );
    list.head = headNode?.next ?? null;
    addStep(
      steps,
      list,
      [4],
      "Move head to head->next.",
      pointerState(list, { cur: headNode?.id ?? null })
    );
    if (list.tail === headNode?.id ?? null) {
      list.tail = list.head;
      addStep(
        steps,
        list,
        [5],
        "Removed node was also tail; update tail to the new head.",
        pointerState(list, { tail: list.tail, cur: headNode?.id ?? null })
      );
    }
    addStep(
      steps,
      list,
      [6],
      "Delete the removed head node.",
      pointerState(list, { cur: headNode?.id ?? null })
    );
    list.nodes = list.nodes.filter((node) => node.id !== headNode?.id);
    ensureTail(list);
    return;
  }

  let prevId = list.head;
  let curId = headNode?.next ?? null;
  addStep(
    steps,
    list,
    [8, 9],
    "Initialize prev to head and cur to head->next.",
    pointerState(list, { prev: prevId, cur: curId })
  );

  while (curId != null) {
    const curNode = nodeById(list, curId);
    const matches = curNode?.data === value;
    addStep(
      steps,
      list,
      [10],
      matches
        ? `cur->data matches ${value}; stop searching.`
        : `cur->data (${curNode?.data}) != ${value}; continue searching.`,
      pointerState(list, { prev: prevId, cur: curId })
    );
    if (matches) break;
    prevId = curId;
    curId = curNode?.next ?? null;
    addStep(
      steps,
      list,
      [11, 12],
      curId == null
        ? "Reached end of list while searching."
        : "Advance prev and cur forward.",
      pointerState(list, { prev: prevId, cur: curId })
    );
  }

  if (curId == null) {
    addStep(
      steps,
      list,
      [13],
      "cur is nullptr; value not found. Nothing removed.",
      pointerState(list, { prev: prevId })
    );
    return;
  }

  const prevNode = nodeById(list, prevId);
  const curNode = nodeById(list, curId);
  if (prevNode) prevNode.next = curNode?.next ?? null;
  const removedValue = curNode?.data;
  addStep(
    steps,
    list,
    [14],
    "Link prev->next to cur->next to bypass cur.",
    pointerState(list, { prev: prevId, cur: curId })
  );

  if (list.tail === curId) {
    list.tail = prevId;
    addStep(
      steps,
      list,
      [15],
      "Removed node was tail; update tail to prev.",
      pointerState(list, { prev: prevId, cur: curId, tail: list.tail })
    );
  }

  if (curNode) curNode.next = null;
  list.nodes = list.nodes.filter((node) => node.id !== curId);
  addStep(
    steps,
    list,
    [16],
    `Delete the removed node (${removedValue}).`,
    pointerState(list, { prev: prevId, tail: list.tail })
  );

  ensureTail(list);
}

function generateTraversalSteps(steps, list) {
  addStep(
    steps,
    list,
    [2],
    "Start traversal at the head.",
    pointerState(list, { cur: list.head })
  );

  let curId = list.head;
  while (true) {
    addStep(
      steps,
      list,
      [3],
      curId == null
        ? "cur is nullptr; stop looping."
        : "cur is not nullptr; execute loop body.",
      pointerState(list, { cur: curId })
    );
    if (curId == null) break;

    const curNode = nodeById(list, curId);
    addStep(
      steps,
      list,
      [4],
      `Visit cur->data (${curNode?.data}).`,
      pointerState(list, { cur: curId })
    );
    curId = curNode?.next ?? null;
    addStep(
      steps,
      list,
      [5],
      "Advance cur to cur->next.",
      pointerState(list, { cur: curId })
    );
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

  ensureTail(working);

  return {
    steps,
    list: sanitizeList(working),
    nextId: ctx.nextId ?? nextId,
  };
}
