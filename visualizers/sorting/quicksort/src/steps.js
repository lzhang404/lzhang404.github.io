// src/steps.js
export function generateQuickSortSteps(values) {
  const arr = values.slice();
  const steps = [];
  const record = (s) => steps.push({ ...s, array: arr.slice() });

  record({ type: "start", codeLines: [] });

  function partition(low, high) {
    const mid = Math.floor(low + (high - low) / 2);
    const pivot = arr[mid];

    record({ type: "header", codeLines: [1], low, high });
    record({ type: "choosePivot", codeLines: [2,3], low, high, pivotIndex: mid, pivotValue: pivot });

    let i = low, j = high;
    record({ type: "initPointers", codeLines: [4], low, high, pivotIndex: mid, pivotValue: pivot, i, j });
    record({ type: "whileIJ", codeLines: [5], low, high, pivotIndex: mid, pivotValue: pivot, i, j });

    while (i <= j) {
      // left scan
      record({ type: "scanLeftCheck", codeLines: [6], low, high, pivotIndex: mid, pivotValue: pivot, i, j });
      while (arr[i] < pivot) {
        i += 1;
        record({ type: "scanLeftInc", codeLines: [7], low, high, pivotIndex: mid, pivotValue: pivot, i, j });
        record({ type: "scanLeftCheck", codeLines: [6], low, high, pivotIndex: mid, pivotValue: pivot, i, j });
      }
      // right scan
      record({ type: "scanRightCheck", codeLines: [8], low, high, pivotIndex: mid, pivotValue: pivot, i, j });
      while (arr[j] > pivot) {
        j -= 1;
        record({ type: "scanRightInc", codeLines: [9], low, high, pivotIndex: mid, pivotValue: pivot, i, j });
        record({ type: "scanRightCheck", codeLines: [8], low, high, pivotIndex: mid, pivotValue: pivot, i, j });
      }

      record({ type: "stopCheck", codeLines: [10], low, high, pivotIndex: mid, pivotValue: pivot, i, j });
      if (i >= j) {
        record({ type: "returnIdx", codeLines: [10,15], low, high, pivotIndex: mid, pivotValue: pivot, ret: j, i, j });
        return j;
      }

      [arr[i], arr[j]] = [arr[j], arr[i]];
      record({ type: "swapLR", codeLines: [11], low, high, pivotIndex: mid, pivotValue: pivot, i, j, swapped: true });

      i += 1;
      j -= 1;
      record({ type: "advancePointers", codeLines: [12,13], low, high, pivotIndex: mid, pivotValue: pivot, i, j });
    }

    record({ type: "whileIJ", codeLines: [5], low, high, pivotIndex: mid, pivotValue: pivot, i, j });
    record({ type: "returnIdx", codeLines: [15], low, high, pivotIndex: mid, pivotValue: pivot, ret: j, i, j });
    return j;
  }

  function quickSort(low, high) {
    record({ type: "bounds", codeLines: [], low, high });
    record({ type: "quickSortCall", codeLines: [18], low, high });
    if (low >= high) { record({ type: "baseReturn", codeLines: [19], low, high }); return; }

    const p = partition(low, high);
    record({ type: "afterPartition", codeLines: [20], low, high, pivotIndex: p });

    record({ type: "recurseLeft", codeLines: [21], low, high, pivotIndex: p });
    quickSort(low, p);

    record({ type: "recurseRight", codeLines: [22], low, high, pivotIndex: p });
    quickSort(p + 1, high);
  }

  quickSort(0, arr.length - 1);
  record({ type: "done", codeLines: [] });
  return steps;
}
