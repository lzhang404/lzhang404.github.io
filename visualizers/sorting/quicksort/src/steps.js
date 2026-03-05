// src/steps.js
export function generateQuickSortSteps(values) {
  const arr = values.slice();
  const steps = [];
  const record = (s) => steps.push({ ...s, array: arr.slice() });

  record({
    type: "start",
    codeLines: [],
    info: `Start quick sort on ${arr.length} element${arr.length === 1 ? "" : "s"}.`
  });

  function partition(low, high) {
    const mid = Math.floor(low + (high - low) / 2);
    const pivot = arr[mid];

    record({
      type: "header",
      codeLines: [1],
      low,
      high,
      info: `Partition subarray from low = ${low} to high = ${high}.`
    });
    record({
      type: "choosePivot",
      codeLines: [2, 3],
      low,
      high,
      pivotIndex: mid,
      pivotValue: pivot,
      info: `Choose middle pivot arr[${mid}] = ${pivot}.`
    });

    let i = low, j = high;
    record({
      type: "initPointers",
      codeLines: [4],
      low,
      high,
      pivotIndex: mid,
      pivotValue: pivot,
      i,
      j,
      info: `Initialize pointers: i = ${i}, j = ${j}.`
    });
    record({
      type: "whileIJ",
      codeLines: [5],
      low,
      high,
      pivotIndex: mid,
      pivotValue: pivot,
      i,
      j,
      info: `Check loop condition i <= j (${i} <= ${j}).`
    });

    while (i <= j) {
      // left scan
      record({
        type: "scanLeftCheck",
        codeLines: [6],
        low,
        high,
        pivotIndex: mid,
        pivotValue: pivot,
        i,
        j,
        info: `Left scan: compare arr[${i}] = ${arr[i]} with pivot ${pivot}.`
      });
      while (arr[i] < pivot) {
        i += 1;
        record({
          type: "scanLeftInc",
          codeLines: [7],
          low,
          high,
          pivotIndex: mid,
          pivotValue: pivot,
          i,
          j,
          info: `arr[i] was smaller than pivot, move i right to ${i}.`
        });
        record({
          type: "scanLeftCheck",
          codeLines: [6],
          low,
          high,
          pivotIndex: mid,
          pivotValue: pivot,
          i,
          j,
          info: `Left scan: compare arr[${i}] = ${arr[i]} with pivot ${pivot}.`
        });
      }
      // right scan
      record({
        type: "scanRightCheck",
        codeLines: [8],
        low,
        high,
        pivotIndex: mid,
        pivotValue: pivot,
        i,
        j,
        info: `Right scan: compare arr[${j}] = ${arr[j]} with pivot ${pivot}.`
      });
      while (arr[j] > pivot) {
        j -= 1;
        record({
          type: "scanRightInc",
          codeLines: [9],
          low,
          high,
          pivotIndex: mid,
          pivotValue: pivot,
          i,
          j,
          info: `arr[j] was greater than pivot, move j left to ${j}.`
        });
        record({
          type: "scanRightCheck",
          codeLines: [8],
          low,
          high,
          pivotIndex: mid,
          pivotValue: pivot,
          i,
          j,
          info: `Right scan: compare arr[${j}] = ${arr[j]} with pivot ${pivot}.`
        });
      }

      record({
        type: "stopCheck",
        codeLines: [10],
        low,
        high,
        pivotIndex: mid,
        pivotValue: pivot,
        i,
        j,
        info: i >= j
          ? `Pointers crossed/met (i = ${i}, j = ${j}), partition will return.`
          : `Pointers have not crossed (i = ${i}, j = ${j}), swap needed.`
      });
      if (i >= j) {
        record({
          type: "returnIdx",
          codeLines: [10, 15],
          low,
          high,
          pivotIndex: mid,
          pivotValue: pivot,
          ret: j,
          i,
          j,
          info: `Return partition index ${j}.`
        });
        return j;
      }

      const leftVal = arr[i];
      const rightVal = arr[j];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      record({
        type: "swapLR",
        codeLines: [11],
        low,
        high,
        pivotIndex: mid,
        pivotValue: pivot,
        i,
        j,
        swapped: true,
        info: `Swap arr[${i}] = ${leftVal} with arr[${j}] = ${rightVal}.`
      });

      i += 1;
      j -= 1;
      record({
        type: "advancePointers",
        codeLines: [12, 13],
        low,
        high,
        pivotIndex: mid,
        pivotValue: pivot,
        i,
        j,
        info: `Move pointers inward: i = ${i}, j = ${j}.`
      });
    }

    record({
      type: "whileIJ",
      codeLines: [5],
      low,
      high,
      pivotIndex: mid,
      pivotValue: pivot,
      i,
      j,
      info: `Check loop condition i <= j (${i} <= ${j}).`
    });
    record({
      type: "returnIdx",
      codeLines: [15],
      low,
      high,
      pivotIndex: mid,
      pivotValue: pivot,
      ret: j,
      i,
      j,
      info: `Return partition index ${j}.`
    });
    return j;
  }

  function quickSort(low, high) {
    record({
      type: "bounds",
      codeLines: [],
      low,
      high,
      info: `Current range is [${low}, ${high}].`
    });
    record({
      type: "quickSortCall",
      codeLines: [18],
      low,
      high,
      info: `Call quickSort(${low}, ${high}).`
    });
    if (low >= high) {
      record({
        type: "baseReturn",
        codeLines: [19],
        low,
        high,
        info: `Base case reached for range [${low}, ${high}], return.`
      });
      return;
    }

    const p = partition(low, high);
    record({
      type: "afterPartition",
      codeLines: [20],
      low,
      high,
      pivotIndex: p,
      info: `Partition complete, split index is ${p}.`
    });

    record({
      type: "recurseLeft",
      codeLines: [21],
      low,
      high,
      pivotIndex: p,
      info: `Recurse left on [${low}, ${p}].`
    });
    quickSort(low, p);

    record({
      type: "recurseRight",
      codeLines: [22],
      low,
      high,
      pivotIndex: p,
      info: `Recurse right on [${p + 1}, ${high}].`
    });
    quickSort(p + 1, high);
  }

  quickSort(0, arr.length - 1);
  record({
    type: "done",
    codeLines: [],
    info: "Quick sort complete. The full array is sorted in ascending order."
  });
  return steps;
}
