const OP_SNIPPET = {
  heapify: "build",
  insert: "insert",
  remove: "remove"
};

const heapSizeFor = (arr, explicit) =>
  Number.isInteger(explicit) ? explicit : arr.length;

const cap = (text) => text ? text.charAt(0).toUpperCase() + text.slice(1) : "";

export function generateHeapOperationSteps(values, options) {
  const { operation, heapType, insertValue } = options;
  const entityLabel = (options.entityLabel || "heap").trim() || "heap";
  const entityTitle = cap(entityLabel);
  const containerLabel = options.containerLabel || entityLabel;
  const orderLabel = options.orderLabel || `${entityLabel} order`;
  const propertyLabel = options.propertyLabel || `${entityLabel} property`;
  const rootLabel = options.rootLabel || (entityLabel === "priority queue" ? "front" : "root");
  const arr = values.slice();
  const steps = [];

  const isMax = heapType === "max";
  const better = (a, b) => (isMax ? a > b : a < b);
  const label = isMax ? "larger" : "smaller";

  const record = (step) => {
    steps.push({
      snippet: OP_SNIPPET[operation],
      heapType,
      ...step,
      heapSize: heapSizeFor(arr, step.heapSize),
      array: arr.slice()
    });
  };

  const siftDown = (size, index, phase) => {
    const leftIdx = 2 * index + 1;
    const rightIdx = 2 * index + 2;
    const leftInRange = leftIdx < size;
    const rightInRange = rightIdx < size;
    let largestIdx = index;

    record({
      type: "siftStart",
      codeLines: [1, 2, 3, 4],
      heapSize: size,
      i: index,
      left: leftInRange ? leftIdx : null,
      right: rightInRange ? rightIdx : null,
      largest: largestIdx,
      info: `${phase}: percolate index ${index} down by examining its children.`
    });

    if (leftInRange) {
      record({
        type: "siftCompareLeft",
        codeLines: [5],
        heapSize: size,
        i: index,
        left: leftIdx,
        right: rightInRange ? rightIdx : null,
        largest: largestIdx,
        info: `Compare left child ${arr[leftIdx]} with the current best ${arr[largestIdx]} during percolation down.`
      });
      if (better(arr[leftIdx], arr[largestIdx])) {
        largestIdx = leftIdx;
        record({
          type: "updateLargest",
          codeLines: [6],
          heapSize: size,
          i: index,
          left: leftIdx,
          right: rightInRange ? rightIdx : null,
          largest: largestIdx,
          info: `Left child offers the ${label} priority; percolation down now targets index ${largestIdx}.`
        });
      }
    } else {
      record({
        type: "childOutOfBounds",
        codeLines: [5],
        heapSize: size,
        i: index,
        left: null,
        right: rightInRange ? rightIdx : null,
        largest: largestIdx,
        info: `Left index ${leftIdx} is outside the ${containerLabel}; percolation down only considers the right side.`
      });
    }

    if (rightInRange) {
      record({
        type: "siftCompareRight",
        codeLines: [8],
        heapSize: size,
        i: index,
        right: rightIdx,
        left: leftInRange ? leftIdx : null,
        largest: largestIdx,
        info: `Compare right child ${arr[rightIdx]} with the current best ${arr[largestIdx]} during percolation down.`
      });
      if (better(arr[rightIdx], arr[largestIdx])) {
        largestIdx = rightIdx;
        record({
          type: "updateLargest",
          codeLines: [9],
          heapSize: size,
          i: index,
          left: leftInRange ? leftIdx : null,
          right: rightIdx,
          largest: largestIdx,
          info: `Right child provides the ${label} priority; continue percolating down at index ${largestIdx}.`
        });
      }
    } else {
      record({
        type: "childOutOfBounds",
        codeLines: [8],
        heapSize: size,
        i: index,
        left: leftInRange ? leftIdx : null,
        right: null,
        largest: largestIdx,
        info: `Right index ${rightIdx} is outside the ${containerLabel}; percolation down continues without a right child.`
      });
    }

    record({
      type: "siftCheck",
      codeLines: [11],
      heapSize: size,
      i: index,
      left: leftInRange ? leftIdx : null,
      right: rightInRange ? rightIdx : null,
      largest: largestIdx,
      info: largestIdx !== index
        ? `Swap index ${index} with ${largestIdx} to keep percolating down and restore ${orderLabel}.`
        : `Index ${index} already satisfies ${orderLabel}; percolation down can stop.`
    });

    if (largestIdx !== index) {
      const prev = arr[index];
      const next = arr[largestIdx];
      record({
        type: "siftSwap",
        codeLines: [12],
        heapSize: size,
        i: index,
        swapA: index,
        swapB: largestIdx,
        left: leftInRange ? leftIdx : null,
        right: rightInRange ? rightIdx : null,
        largest: largestIdx,
        info: `Swap ${prev} with ${next} so the better priority moves upward during percolation down.`
      });
      [arr[index], arr[largestIdx]] = [arr[largestIdx], arr[index]];

      record({
        type: "siftSwapDone",
        codeLines: [12],
        heapSize: size,
        i: index,
        swapA: index,
        swapB: largestIdx,
        left: leftInRange ? leftIdx : null,
        right: rightInRange ? rightIdx : null,
        largest: largestIdx,
        info: `Values swapped. Continue percolating down starting at index ${largestIdx}.`
      });

      record({
        type: "siftRecurse",
        codeLines: [13],
        heapSize: size,
        i: largestIdx,
        largest: largestIdx,
        info: `Percolate down into the subtree rooted at index ${largestIdx}.`
      });
      siftDown(size, largestIdx, phase);
    } else {
      record({
        type: "siftSatisfied",
        codeLines: [11],
        heapSize: size,
        i: index,
        left: leftInRange ? leftIdx : null,
        right: rightInRange ? rightIdx : null,
        largest: largestIdx,
        info: `No swap needed; percolation down stops at index ${index}.`
      });
    }

    record({
      type: "siftComplete",
      codeLines: [15],
      heapSize: size,
      i: index,
      largest: largestIdx,
      info: `Percolation down finished; the subtree rooted at ${index} now satisfies ${propertyLabel}.`
    });
  };

  const bubbleUp = (index) => {
    if (index <= 0) return;
    let child = index;
    let parent = Math.floor((child - 1) / 2);

    while (child > 0) {
      record({
        type: "bubbleCompare",
        codeLines: [6],
        heapSize: arr.length,
        i: child,
        parent,
        info: `Compare child ${arr[child]} with parent ${arr[parent]} while percolating up.`
      });

      if (better(arr[child], arr[parent])) {
        record({
          type: "bubbleSwap",
          codeLines: [7],
          heapSize: arr.length,
          i: child,
          parent,
          swapA: child,
          swapB: parent,
          info: `Child is ${label}; swap indices ${child} and ${parent} to percolate up.`
        });
        [arr[child], arr[parent]] = [arr[parent], arr[child]];

        record({
          type: "bubbleAdvance",
          codeLines: [8],
          heapSize: arr.length,
          i: parent,
          parent: Math.floor((parent - 1) / 2),
          info: `Continue percolating up from index ${parent}.`
        });

        child = parent;
        parent = Math.floor((child - 1) / 2);
      } else {
        record({
          type: "bubbleStop",
          codeLines: [6],
          heapSize: arr.length,
          i: child,
          parent,
          info: `Percolation up stops because ${cap(orderLabel)} is satisfied.`
        });
        break;
      }
    }
  };

  if (operation === "heapify") {
    record({
      type: "operationStart",
      codeLines: [17],
      info: `Convert array into a ${heapType} ${entityLabel} by percolating each internal node down.`
    });

    for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) {
      record({
        type: "heapifyLoop",
        codeLines: [18, 19],
        i,
        info: `Percolate index ${i} down so the ${entityLabel} maintains ${propertyLabel}.`
      });
      siftDown(arr.length, i, "Build phase");
    }

  record({
    type: "operationComplete",
    codeLines: [21],
    info: `Percolation down finished. Array now satisfies ${heapType} ${propertyLabel}.`
  });
    return steps;
  }

  if (operation === "insert") {
    const value = insertValue;
    record({
      type: "operationStart",
      codeLines: [1],
      info: `Insert ${value} into the ${heapType} ${entityLabel} and percolate it up to restore ${orderLabel}.`
    });

    arr.push(value);
    record({
      type: "appendNode",
      codeLines: [2],
      info: `Append value ${value} at index ${arr.length - 1} and begin percolating up.`,
      heapSize: arr.length,
      appendIndex: arr.length - 1
    });

    if (arr.length === 1) {
    record({
      type: "operationComplete",
      codeLines: [13],
      info: `Single element ${entityLabel} created.`
    });
      return steps;
    }

    bubbleUp(arr.length - 1);

    record({
      type: "operationComplete",
      codeLines: [13],
      info: `Insertion complete. After percolation up, ${cap(rootLabel)} now holds ${arr[0]}.`
    });
    return steps;
  }

  if (operation === "remove") {
    if (!arr.length) {
      record({
        type: "operationStart",
        codeLines: [1],
        info: `${entityTitle} is empty; nothing to remove.`
      });
      record({
        type: "operationComplete",
        codeLines: [2],
        info: "No action performed."
      });
      return steps;
    }

    record({
      type: "operationStart",
      codeLines: [1],
      info: `Remove ${rootLabel} value ${arr[0]} from the ${heapType} ${entityLabel} and prepare to percolate down.`
    });

    const lastIndex = arr.length - 1;
    record({
      type: "removeSwap",
      codeLines: [4],
      swapA: 0,
      swapB: lastIndex,
      heapSize: arr.length,
      info: `Swap ${rootLabel} with last element ${arr[lastIndex]} so the outgoing value moves to the tail before percolation down.`
    });
    [arr[0], arr[lastIndex]] = [arr[lastIndex], arr[0]];
    record({
      type: "removeSwapDone",
      codeLines: [4],
      swapA: 0,
      swapB: lastIndex,
      heapSize: arr.length,
      info: `${cap(rootLabel)} now holds ${arr[0]}; last position stores ${arr[lastIndex]} before removal.`
    });

    const removedValue = arr.pop();
    record({
      type: "removePop",
      codeLines: [5],
      removedValue,
      heapSize: arr.length,
      info: `Remove the last element (value ${removedValue}). ${entityTitle} size is now ${arr.length}.`
    });

    if (!arr.length) {
      record({
      type: "operationComplete",
      codeLines: [7],
      info: `${entityTitle} is now empty; no percolation down required.`
    });
      return steps;
    }

    record({
      type: "siftDownRestart",
      codeLines: [6],
      info: `Percolate the new ${rootLabel} down to restore ${orderLabel}.`,
      heapSize: arr.length
    });

    siftDown(arr.length, 0, "Removal phase");

    record({
      type: "operationComplete",
      codeLines: [7],
      info: `${cap(rootLabel)} removed. After percolation down, new ${rootLabel} is ${arr[0]}.`
    });
    return steps;
  }

  return steps;
}
