import { generateHeapOperationSteps } from "../../heap/src/steps.js";

const snippetMap = {
  heapify: "build",
  insert: "enqueue",
  remove: "dequeue"
};

const convertSnippet = (steps, fallback, operationName) =>
  steps.map(step => ({
    ...step,
    operation: operationName || fallback || step.operation || step.snippet,
    snippet: snippetMap[step.snippet] || fallback || step.snippet
  }));

const sharedLabels = {
  entityLabel: "priority queue",
  containerLabel: "priority queue",
  orderLabel: "priority order",
  propertyLabel: "priority queue property",
  rootLabel: "front"
};

export function generatePriorityQueueSteps(values, options) {
  const { operation, heapType, enqueueValue } = options;

  if (operation === "build") {
    return convertSnippet(
      generateHeapOperationSteps(values, {
        operation: "heapify",
        heapType,
        ...sharedLabels
      }),
      "build",
      "build"
    );
  }

  if (operation === "enqueue") {
    return convertSnippet(
      generateHeapOperationSteps(values, {
        operation: "insert",
        heapType,
        insertValue: enqueueValue,
        ...sharedLabels
      }),
      "enqueue",
      "enqueue"
    );
  }

  if (operation === "dequeue") {
    return convertSnippet(
      generateHeapOperationSteps(values, {
        operation: "remove",
        heapType,
        ...sharedLabels
      }),
      "dequeue",
      "dequeue"
    );
  }

  if (operation === "peek") {
    const arr = values.slice();
    const steps = [];
    const heapSize = arr.length;

    steps.push({
      type: "peekStart",
      snippet: "peek",
      operation: "peek",
      heapType,
      heapSize,
      codeLines: [1],
      info: heapSize
        ? "Peek at the front value without removing it."
        : "Priority queue is empty; nothing to peek.",
      array: arr.slice()
    });

    if (!heapSize) {
      steps.push({
        type: "peekEmpty",
        snippet: "peek",
        operation: "peek",
        heapType,
        heapSize,
        codeLines: [2],
        info: "Detected empty queue, returning default value.",
        array: arr.slice()
      });
      return steps;
    }

    steps.push({
      type: "peekFront",
      snippet: "peek",
      operation: "peek",
      heapType,
      heapSize,
      codeLines: [2, 3],
      info: `Front value is ${arr[0]}.`,
      front: 0,
      array: arr.slice()
    });

    steps.push({
      type: "peekComplete",
      snippet: "peek",
      operation: "peek",
      heapType,
      heapSize,
      codeLines: [3],
      info: "Return the front element without modifying the queue.",
      front: 0,
      array: arr.slice()
    });

    return steps;
  }

  return [];
}
