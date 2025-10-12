// Build a frame-by-frame trace of selection sort
export function generateSelectionSortSteps(values) {
  const arr = values.slice();
  const steps = [];
  const n = arr.length;

  const record = (s) => steps.push({ ...s, array: arr.slice() });

  record({ type: "start", codeLines: [1] });

  for (let i = 0; i < n - 1; i++) {
    record({ type: "outerLoopStart", codeLines: [2], i });
    let minIdx = i;
    record({ type: "setMin", codeLines: [3], i, minIdx });

    for (let j = i + 1; j < n; j++) {
      record({ type: "innerLoopCheck", codeLines: [4], i, j, minIdx });
      record({ type: "compare", codeLines: [5], i, j, minIdx });
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
        record({ type: "updateMin", codeLines: [6], i, j, minIdx });
      }
      record({ type: "closeIf", codeLines: [7], i, j, minIdx });
    }

    record({ type: "afterInnerLoop", codeLines: [8], i, minIdx });
    record({ type: "checkSwap", codeLines: [9], i, minIdx });

    if (minIdx !== i) {
      [arr[minIdx], arr[i]] = [arr[i], arr[minIdx]];
      record({ type: "swap", codeLines: [10], i, minIdx });
    }

    record({ type: "closeSwap", codeLines: [11], i, minIdx });
    record({ type: "iterationComplete", codeLines: [12], i });
  }

  record({ type: "done", codeLines: [13] });
  return steps;
}
