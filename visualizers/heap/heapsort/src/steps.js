// Produce a detailed step-by-step trace of heap sort with heapify focus.
export function generateHeapSortSteps(values) {
  const arr = values.slice();
  const n = arr.length;
  const steps = [];
  let currentHeapSize = n;

  const sortedForSize = (size) => {
    const out = [];
    for (let idx = size; idx < n; idx++) out.push(idx);
    return out;
  };

  const record = (step) => {
    const heapSize = Object.prototype.hasOwnProperty.call(step, "heapSize")
      ? step.heapSize
      : currentHeapSize;
    steps.push({
      ...step,
      heapSize,
      array: arr.slice(),
      sorted: step.sorted ?? sortedForSize(heapSize)
    });
  };

  const heapify = (size, startIndex, phase) => {
    const rootIndex = startIndex;
    const phaseLabel = phase === "build" ? "Build phase" : "Sort phase";

    const leftIdx = 2 * rootIndex + 1;
    const rightIdx = 2 * rootIndex + 2;
    let largest = rootIndex;

    record({
      type: "heapifyStart",
      codeLines: [1, 2, 3, 4],
      heapSize: size,
      i: rootIndex,
      largest,
      left: leftIdx < size ? leftIdx : null,
      right: rightIdx < size ? rightIdx : null,
      info: `${phaseLabel}: percolate index ${rootIndex} down within heap size ${size}.`
    });

    if (leftIdx < size) {
      record({
        type: "compareLeft",
        codeLines: [5],
        heapSize: size,
        i: rootIndex,
        largest,
        left: leftIdx,
        info: `Compare left child index ${leftIdx} (value ${arr[leftIdx]}) with the current top candidate index ${largest} (value ${arr[largest]}) during percolation down.`
      });
      if (arr[leftIdx] > arr[largest]) {
        largest = leftIdx;
        record({
          type: "updateLargest",
          codeLines: [6],
          heapSize: size,
          i: rootIndex,
          largest,
        info: `Left child offers the larger priority; continue percolating down by targeting index ${largest}.`
        });
      }
    } else {
      record({
        type: "leftOutOfBounds",
        codeLines: [5],
        heapSize: size,
        i: rootIndex,
        left: leftIdx,
        info: `Left child index ${leftIdx} is outside the heap (size ${size}); percolation down only considers the right side.`
      });
    }

    if (rightIdx < size) {
      record({
        type: "compareRight",
        codeLines: [8],
        heapSize: size,
        i: rootIndex,
        largest,
        right: rightIdx,
        info: `Compare right child index ${rightIdx} (value ${arr[rightIdx]}) with the current top candidate index ${largest} (value ${arr[largest]}) during percolation down.`
      });
      if (arr[rightIdx] > arr[largest]) {
        largest = rightIdx;
        record({
          type: "updateLargest",
          codeLines: [9],
          heapSize: size,
          i: rootIndex,
          largest,
        info: `Right child becomes the new best candidate; continue percolating down at index ${largest}.`
        });
      }
    } else {
      record({
        type: "rightOutOfBounds",
        codeLines: [8],
        heapSize: size,
        i: rootIndex,
        right: rightIdx,
        info: `Right child index ${rightIdx} is outside the heap (size ${size}); percolation down continues without it.`
      });
    }

    record({
      type: "checkSwap",
      codeLines: [11],
      heapSize: size,
      i: rootIndex,
      largest,
      info: largest !== rootIndex
        ? `Swap to keep percolating down and restore the max-heap order.`
        : `Node ${rootIndex} already satisfies the heap order; percolation down stops here.`
    });

    if (largest !== rootIndex) {
      const rootVal = arr[rootIndex];
      const largestVal = arr[largest];

      record({
        type: "swapNodes",
        codeLines: [12],
        heapSize: size,
        i: rootIndex,
        largest,
        swapA: rootIndex,
        swapB: largest,
        info: `Swap arr[${rootIndex}] = ${rootVal} with arr[${largest}] = ${largestVal} so the larger value bubbles up during percolation down.`
      });

      [arr[rootIndex], arr[largest]] = [arr[largest], arr[rootIndex]];

      record({
        type: "swapDone",
        codeLines: [12],
        heapSize: size,
        i: rootIndex,
        largest,
        swapA: rootIndex,
        swapB: largest,
        info: `After the swap: arr[${rootIndex}] = ${arr[rootIndex]}, arr[${largest}] = ${arr[largest]}. Continue percolating down.`
      });

      record({
        type: "recurse",
        codeLines: [13],
        heapSize: size,
        i: largest,
        info: `Percolate down into the subtree rooted at index ${largest}.`
      });

      heapify(size, largest, phase);
    } else {
      record({
        type: "heapifySatisfied",
        codeLines: [11],
        heapSize: size,
        i: rootIndex,
        info: `No swap performed; percolation down ends at index ${rootIndex}.`
      });
    }

    record({
      type: "heapifyComplete",
      codeLines: [15],
      heapSize: size,
      i: rootIndex,
      info: `Percolation down finished; the subtree rooted at index ${rootIndex} is now a max-heap.`
    });
  };

  record({
    type: "start",
    codeLines: [23],
    heapSize: currentHeapSize,
    info: `Start heap sort on ${n} element${n === 1 ? "" : "s"}.`
  });

  if (n <= 1) {
    record({
      type: "done",
      codeLines: [23, 27],
      heapSize: 0,
      info: "Array is trivially sorted."
    });
    return steps;
  }

  record({
    type: "buildPhaseStart",
    codeLines: [24],
    heapSize: currentHeapSize,
    info: "Build the max-heap by percolating each internal node down from the bottom level."
  });

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    record({
      type: "buildLoop",
      codeLines: [18, 19],
      heapSize: currentHeapSize,
      i,
      info: `Percolate index ${i} down so the upper levels stay ordered.`
    });
    heapify(n, i, "build");
  }

  record({
    type: "buildPhaseComplete",
    codeLines: [24],
    heapSize: currentHeapSize,
    info: "Max-heap constructed; begin extracting the maximum with percolation down after each swap."
  });

  record({
    type: "sortPhaseStart",
    codeLines: [25, 27],
    heapSize: currentHeapSize,
    info: "Repeatedly swap the root with the end element, then percolate the new root down."
  });

  for (let end = n - 1; end > 0; end--) {
    record({
      type: "extractMax",
      codeLines: [25, 26],
      heapSize: currentHeapSize,
      heapEnd: end,
      i: 0,
      info: `Place the current maximum at index ${end} and prepare to percolate the new root down.`
    });

    const rootVal = arr[0];
    const endVal = arr[end];

    record({
      type: "swapRoot",
      codeLines: [26],
      heapSize: currentHeapSize,
      i: 0,
      largest: end,
      heapEnd: end,
      swapA: 0,
      swapB: end,
      info: `Swap root value ${rootVal} with arr[${end}] = ${endVal} so the maximum moves into the sorted suffix.`
    });

    [arr[0], arr[end]] = [arr[end], arr[0]];

    record({
      type: "swapRootDone",
      codeLines: [26],
      heapSize: end,
      i: 0,
      largest: end,
      heapEnd: end,
      swapA: 0,
      swapB: end,
      info: `Index ${end} now holds ${arr[end]}; shrink the heap to size ${end} before percolating down.`
    });

    currentHeapSize = end;

    if (currentHeapSize > 0) {
      record({
        type: "heapifyAfterExtract",
        codeLines: [27],
        heapSize: currentHeapSize,
        i: 0,
        info: `Percolate the new root down to restore the heap on the remaining ${currentHeapSize} elements.`
      });
      heapify(currentHeapSize, 0, "sort");
    }
  }

  record({
    type: "done",
    codeLines: [23, 27],
    heapSize: 0,
    info: "Heap sort complete. The array is in ascending order."
  });

  return steps;
}
