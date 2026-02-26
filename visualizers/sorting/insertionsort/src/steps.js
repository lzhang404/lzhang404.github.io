export function generateInsertionSortSteps(values) {
  const arr = values.slice();
  const steps = [];
  const record = (s) => steps.push({ ...s, array: arr.slice() });

  record({
    type: "start",
    codeLines: [1],
    info: `Start insertion sort on ${arr.length} element${arr.length === 1 ? "" : "s"}.`
  });

  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;

    record({
      type: "outerLoopStart",
      codeLines: [2],
      i,
      keyValue: key,
      info: `Begin pass ${i}: insert value ${key} into the sorted prefix arr[0..${i - 1}].`
    });
    record({
      type: "setKey",
      codeLines: [3],
      i,
      keyValue: key,
      info: `Store key = arr[${i}] = ${key}.`
    });
    record({
      type: "initJ",
      codeLines: [4],
      i,
      j,
      keyValue: key,
      info: `Set j = ${j} to scan left for key ${key}'s position.`
    });

    while (true) {
      const condition = j >= 0 && arr[j] > key;
      const conditionText = condition
        ? `arr[${j}] = ${arr[j]} > key ${key}, so keep shifting right.`
        : j < 0
          ? "j is below 0, so stop shifting."
          : `arr[${j}] = ${arr[j]} <= key ${key}, so found insertion spot.`;
      record({
        type: "whileCheck",
        codeLines: [5],
        i,
        j,
        keyValue: key,
        condition,
        info: `Check while condition: ${conditionText}`
      });
      if (!condition) break;

      const moved = arr[j];
      arr[j + 1] = arr[j];
      record({
        type: "shiftRight",
        codeLines: [6],
        i,
        j,
        from: j,
        to: j + 1,
        keyValue: key,
        info: `Shift arr[${j}] = ${moved} to arr[${j + 1}] to make room for key ${key}.`
      });

      j = j - 1;
      record({
        type: "decrementJ",
        codeLines: [7],
        i,
        j,
        keyValue: key,
        info: `Move j left to ${j} and continue checking.`
      });
    }

    const insertPos = j + 1;
    arr[insertPos] = key;
    record({
      type: "placeKey",
      codeLines: [9],
      i,
      j,
      insertIndex: insertPos,
      keyValue: key,
      info: `Place key ${key} at arr[${insertPos}].`
    });
    record({
      type: "iterationComplete",
      codeLines: [10],
      i,
      keyValue: key,
      info: `Pass ${i} complete: arr[0..${i}] is now sorted.`
    });
  }

  record({
    type: "done",
    codeLines: [11],
    info: "Insertion sort complete. The full array is sorted in ascending order."
  });
  return steps;
}
