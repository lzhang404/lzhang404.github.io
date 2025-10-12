export function generateInsertionSortSteps(values) {
  const arr = values.slice();
  const steps = [];
  const record = (s) => steps.push({ ...s, array: arr.slice() });

  record({ type: "start", codeLines: [1] });

  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;

    record({ type: "outerLoopStart", codeLines: [2], i, keyValue: key });
    record({ type: "setKey", codeLines: [3], i, keyValue: key });
    record({ type: "initJ", codeLines: [4], i, j, keyValue: key });

    while (true) {
      const condition = j >= 0 && arr[j] > key;
      record({ type: "whileCheck", codeLines: [5], i, j, keyValue: key, condition });
      if (!condition) break;

      arr[j + 1] = arr[j];
      record({ type: "shiftRight", codeLines: [6], i, j, from: j, to: j + 1, keyValue: key });

      j = j - 1;
      record({ type: "decrementJ", codeLines: [7], i, j, keyValue: key });
    }

    const insertPos = j + 1;
    arr[insertPos] = key;
    record({ type: "placeKey", codeLines: [9], i, j, insertIndex: insertPos, keyValue: key });
    record({ type: "iterationComplete", codeLines: [10], i, keyValue: key });
  }

  record({ type: "done", codeLines: [11] });
  return steps;
}
