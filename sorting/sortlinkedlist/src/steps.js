const POINTER_ORDERS = {
  dll: [
    { key: "cur", label: "curNode" },
    { key: "search", label: "searchNode" },
    { key: "next", label: "nextNode" },
  ],
  sll: [
    { key: "cur", label: "curNode" },
    { key: "sorted", label: "sortedTail" },
    { key: "search", label: "searchNode" },
  ],
};

export function pointerConfig(kind) {
  return POINTER_ORDERS[kind] ?? [];
}

function makeList(values, kind) {
  const nodes = values.map((v, i) => ({
    id: i,
    data: Number(v),
    prev: kind === "dll" ? (i > 0 ? i - 1 : null) : null,
    next: i < values.length - 1 ? i + 1 : null,
  }));
  return {
    kind,
    nodes,
    head: nodes[0]?.id ?? null,
    tail: nodes.at(-1)?.id ?? null,
  };
}

function cloneListForViz(list) {
  const nodes = list.nodes.map((n) => ({
    id: n.id,
    data: n.data,
    prev: list.kind === "dll" ? n.prev : null,
    next: n.next,
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
    kind: list.kind,
    head: list.head,
    tail: list.tail,
    nodes,
    order,
    detached,
  };
}

function nodeById(list, id) {
  return list.nodes.find((n) => n.id === id) ?? null;
}

function removeNode(list, id) {
  const node = nodeById(list, id);
  if (!node) return;

  const prev = node.prev != null ? nodeById(list, node.prev) : null;
  const next = node.next != null ? nodeById(list, node.next) : null;

  if (prev) prev.next = node.next; else list.head = node.next;
  if (next) next.prev = node.prev; else list.tail = node.prev;

  node.prev = null;
  node.next = null;
}

function prependNode(list, id) {
  const node = nodeById(list, id);
  if (!node) return;
  if (list.head == null) {
    list.head = list.tail = id;
    return;
  }
  const head = nodeById(list, list.head);
  node.next = head?.id ?? null;
  if (head && list.kind === "dll") head.prev = node.id;
  if (list.kind === "dll") node.prev = null;
  list.head = node.id;
  if (list.tail == null) list.tail = node.id;
}

function insertAfter(list, afterId, id) {
  const target = nodeById(list, afterId);
  const node = nodeById(list, id);
  if (!target || !node) return;

  const next = target.next != null ? nodeById(list, target.next) : null;
  node.prev = list.kind === "dll" ? target.id : null;
  node.next = target.next;
  target.next = node.id;
  if (list.kind === "dll" && next) next.prev = node.id;
  if (!next) list.tail = node.id;
}

function recalcTail(list) {
  let tail = list.head;
  let cur = list.head;
  const seen = new Set();
  while (cur != null && !seen.has(cur)) {
    seen.add(cur);
    tail = cur;
    const node = nodeById(list, cur);
    cur = node?.next ?? null;
  }
  list.tail = tail;
}

function addStep(steps, list, codeLines, message, pointers) {
  steps.push({
    codeLines,
    message,
    list: cloneListForViz(list),
    pointers: { ...pointers },
  });
}

function generateDllInsertionSortSteps(values) {
  const list = makeList(values, "dll");
  const steps = [];
  let curId = (() => {
    const head = nodeById(list, list.head);
    return head?.next ?? null;
  })();
  let nextId = null;
  let searchId = null;

  addStep(
    steps,
    list,
    [2],
    curId == null
      ? "curNode starts as nullptr because the list has fewer than two nodes."
      : "Initialize curNode to the second node in the list.",
    { cur: curId, search: searchId, next: nextId }
  );

  if (curId == null) {
    addStep(steps, list, [3], "curNode is nullptr, so the while loop exits immediately.", {
      cur: curId,
      search: searchId,
      next: nextId,
    });
    addStep(steps, list, [18], "List already sorted.", {
      cur: curId,
      search: searchId,
      next: nextId,
    });
    return steps;
  }

  while (curId != null) {
    addStep(
      steps,
      list,
      [3],
      "Enter loop while curNode is not nullptr.",
      { cur: curId, search: searchId, next: nextId }
    );

    const cur = nodeById(list, curId);
    nextId = cur?.next ?? null;
    addStep(
      steps,
      list,
      [4],
      nextId == null
        ? "Store nextNode as nullptr because curNode is at the tail."
        : "Store the next node so we can return after reinserting curNode.",
      { cur: curId, search: searchId, next: nextId }
    );

    searchId = cur?.prev ?? null;
    addStep(
      steps,
      list,
      [5],
      searchId == null
        ? "searchNode starts as nullptr; curNode is at the head."
        : "Start searchNode one step to the left of curNode.",
      { cur: curId, search: searchId, next: nextId }
    );

    while (true) {
      const search = searchId != null ? nodeById(list, searchId) : null;
      const curNode = nodeById(list, curId);
      const condition =
        search != null && curNode != null && search.data > curNode.data;
      addStep(
        steps,
        list,
        [6],
        condition
          ? `Compare ${search?.data} > ${curNode?.data}; keep moving searchNode left.`
          : "Inner while condition fails; searchNode is positioned for insertion.",
        { cur: curId, search: searchId, next: nextId }
      );
      if (!condition) break;
      searchId = search?.prev ?? null;
      addStep(
        steps,
        list,
        [7],
        searchId == null
          ? "searchNode moved past the head."
          : "Move searchNode one node toward the head.",
        { cur: curId, search: searchId, next: nextId }
      );
    }

    addStep(
      steps,
      list,
      [9],
      "Ready to detach curNode for reinsertion.",
      { cur: curId, search: searchId, next: nextId }
    );
    removeNode(list, curId);
    addStep(
      steps,
      list,
      [10],
      "ListRemoveNode disconnects curNode from its neighbors.",
      { cur: null, search: searchId, next: nextId }
    );

    if (searchId == null) {
      addStep(
        steps,
        list,
        [11],
        "searchNode is nullptr; curNode belongs at the head.",
        { cur: null, search: searchId, next: nextId }
      );
      addStep(
        steps,
        list,
        [12],
        "Clear curNode->prev before inserting at the front.",
        { cur: null, search: searchId, next: nextId }
      );
      prependNode(list, curId);
      addStep(
        steps,
        list,
        [13],
        "ListPrependNode inserts curNode at the front of the list.",
        { cur: curId, search: searchId, next: nextId }
      );
    } else {
      addStep(
        steps,
        list,
        [14],
        "Insert curNode after the located searchNode.",
        { cur: null, search: searchId, next: nextId }
      );
      insertAfter(list, searchId, curId);
      addStep(
        steps,
        list,
        [15],
        "ListInsertNodeAfter links curNode directly after searchNode.",
        { cur: curId, search: searchId, next: nextId }
      );
    }

    recalcTail(list);

    curId = nextId;
    addStep(
      steps,
      list,
      [17],
      "Advance curNode to the stored nextNode.",
      { cur: curId, search: null, next: curId }
    );
    searchId = null;
  }

  addStep(
    steps,
    list,
    [18],
    "Finished scanning the list; all nodes are sorted.",
    { cur: null, search: null, next: null }
  );

  return steps;
}

function generateSllInsertionSortSteps(values) {
  const list = makeList(values, "sll");
  const steps = [];

  addStep(
    steps,
    list,
    [1],
    "Begin singly linked list insertion sort.",
    { cur: null, sorted: null, search: null }
  );

  if (list.head == null) {
    addStep(
      steps,
      list,
      [2],
      "Head is nullptr; nothing to sort.",
      { cur: null, sorted: null, search: null }
    );
    return steps;
  }

  let sortedTailId = list.head;
  let curId = nodeById(list, sortedTailId)?.next ?? null;

  addStep(
    steps,
    list,
    [3, 4],
    "Initialize sortedTail to the head and curNode to the next node.",
    { cur: curId, sorted: sortedTailId, search: null }
  );

  while (curId != null) {
    const sortedTail = nodeById(list, sortedTailId);
    const cur = nodeById(list, curId);

    addStep(
      steps,
      list,
      [5],
      "Check the loop condition: curNode is not nullptr.",
      { cur: curId, sorted: sortedTailId, search: null }
    );

    if (cur && sortedTail && cur.data >= sortedTail.data) {
      addStep(
        steps,
        list,
        [6],
        `curNode data ${cur.data} is >= sortedTail data ${sortedTail.data}; node already in place.`,
        { cur: curId, sorted: sortedTailId, search: null }
      );
      sortedTailId = curId;
      addStep(
        steps,
        list,
        [7],
        "Move sortedTail forward to curNode.",
        { cur: curId, sorted: sortedTailId, search: null }
      );
      curId = nodeById(list, sortedTailId)?.next ?? null;
      addStep(
        steps,
        list,
        [8],
        "Advance curNode to the next node after sortedTail.",
        { cur: curId, sorted: sortedTailId, search: null }
      );
      continue;
    }

    addStep(
      steps,
      list,
      [6],
      `curNode data ${cur?.data} is < sortedTail data ${sortedTail?.data}; reposition needed.`,
      { cur: curId, sorted: sortedTailId, search: null }
    );

    if (sortedTail) sortedTail.next = cur?.next ?? null;
    recalcTail(list);
    addStep(
      steps,
      list,
      [10],
      "Detach curNode from after sortedTail.",
      { cur: curId, sorted: sortedTailId, search: null }
    );

    if (cur && list.head != null && cur.data < (nodeById(list, list.head)?.data ?? Infinity)) {
      cur.next = list.head;
      list.head = cur.id;
      addStep(
        steps,
        list,
        [11, 12, 13],
        "curNode has the smallest value; insert it at the head.",
        { cur: curId, sorted: sortedTailId, search: null }
      );
    } else {
      let searchId = list.head;
      addStep(
        steps,
        list,
        [15],
        "Search through the sorted portion to find the insertion point.",
        { cur: curId, sorted: sortedTailId, search: searchId }
      );
      while (searchId != null) {
        const search = nodeById(list, searchId);
        const next = search?.next != null ? nodeById(list, search.next) : null;
        const condition =
          next != null && cur != null && next.data < cur.data;
        addStep(
          steps,
          list,
          [16],
          condition
            ? `search->next (${next?.data}) is still less than curNode (${cur?.data}); move search forward.`
            : "Found spot where curNode should be inserted.",
          { cur: curId, sorted: sortedTailId, search: searchId }
        );
        if (!condition) break;
        searchId = search?.next ?? null;
        addStep(
          steps,
          list,
          [17],
          "Advance search to the next node in the sorted portion.",
          { cur: curId, sorted: sortedTailId, search: searchId }
        );
      }

      const search = nodeById(list, searchId);
      cur.next = search?.next ?? null;
      if (search) search.next = cur?.id ?? null;
      addStep(
        steps,
        list,
        [19, 20],
        "Insert curNode after the located search node.",
        { cur: curId, sorted: sortedTailId, search: searchId }
      );
    }

    recalcTail(list);
    curId = nodeById(list, sortedTailId)?.next ?? null;
    addStep(
      steps,
      list,
      [22],
      "Set curNode to the node following sortedTail for the next iteration.",
      { cur: curId, sorted: sortedTailId, search: null }
    );
  }

  addStep(
    steps,
    list,
    [5],
    "curNode is nullptr; sorting is complete.",
    { cur: null, sorted: sortedTailId, search: null }
  );

  return steps;
}

export function generateSteps(kind, values) {
  const nums = values.map(Number).filter((n) => Number.isFinite(n));
  if (!nums.length) return [];
  if (kind === "dll") return generateDllInsertionSortSteps(nums);
  if (kind === "sll") return generateSllInsertionSortSteps(nums);
  return [];
}
