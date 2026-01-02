// src/steps.js
export function generateMergeSortSteps(values) {
  const arr = values.slice();
  const steps = [];
  const segmentsByDepth = [];

  const registerSegment = (depth, left, right) => {
    if (left > right) return;
    if (!segmentsByDepth[depth]) segmentsByDepth[depth] = [];
    const level = segmentsByDepth[depth];
    if (!level.some(s => s.left === left && s.right === right)) {
      level.push({ left, right });
      level.sort((a, b) => a.left - b.left);
    }
  };

  const captureLevels = () =>
    segmentsByDepth.map(level =>
      (level || []).map(seg => ({
        left: seg.left,
        right: seg.right,
        values: arr.slice(seg.left, seg.right + 1)
      }))
    );

  const record = (event) => {
    steps.push({
      type: event.type,
      codeLines: event.codeLines || [],
      highlight: event.highlight || { segments: [] },
      info: event.info || "",
      levels: captureLevels(),
      array: arr.slice(),
      varsText: event.varsText || "",
      buffers: event.buffers || null
    });
  };

  const merge = (left, mid, right, depth) => {
    registerSegment(depth, left, right);
    registerSegment(depth + 1, left, mid);
    registerSegment(depth + 1, mid + 1, right);

    const n1 = mid - left + 1;
    const n2 = right - mid;
    const leftArr = arr.slice(left, mid + 1);
    const rightArr = arr.slice(mid + 1, right + 1);

    let i = 0, j = 0, k = left;
    const varsLine = (withIdx = true) =>
      withIdx
        ? `left = ${left}, mid= ${mid}, right = ${right}, n1 = ${n1}, n2 = ${n2}, i = ${i}, j = ${j}, k= ${k}`
        : `left = ${left}, mid= ${mid}, right = ${right}, n1 = ${n1}, n2 = ${n2}`;

    const snapshotBuffers = () => ({
      leftBuf: leftArr.slice(),
      rightBuf: rightArr.slice(),
      i, j, k,
      ctx: { depth, left, mid, right }
    });

    record({ type: "mergeSignature", codeLines: [1],
      highlight: { segments: [{ depth, left, right, role: "current" }] },
      info: `merge(arr, ${left}, ${mid}, ${right})`, varsText: varsLine(false) });

    record({ type: "initN1", codeLines: [2],
      highlight: { segments: [{ depth, left, right, role: "current" }] },
      info: `n1 = ${n1}`, varsText: varsLine(false) });

    record({ type: "initN2", codeLines: [3],
      highlight: { segments: [{ depth, left, right, role: "current" }] },
      info: `n2 = ${n2}`, varsText: varsLine(false) });

    record({ type: "bufferSetup", codeLines: [4],
      highlight: { segments: [{ depth, left, right, role: "current" }] },
      info: "Allocate temporary buffers for both halves", varsText: varsLine(false) });

    record({ type: "copyLeftLoop", codeLines: [5,6,7],
      highlight: { segments: [{ depth: depth+1, left, right: mid, role: "merge-left" }] },
      info: `Copy left half values ${leftArr.join(", ")}`, varsText: varsLine(false) });

    record({ type: "copyRightLoop", codeLines: [8,9,10],
      highlight: { segments: [{ depth: depth+1, left: mid+1, right, role: "merge-right" }] },
      info: `Copy right half values ${rightArr.join(", ")}`, varsText: varsLine(false) });

    record({ type: "initPointers", codeLines: [11],
      highlight: { segments: [{ depth, left, right, role: "merge-target" }] },
      info: `Set indices i= ${i}, j= ${j}, k= ${k}`,
      varsText: varsLine(), buffers: snapshotBuffers() });

    while (i < leftArr.length && j < rightArr.length) {
      record({ type: "whileCheck", codeLines: [12],
        highlight: { segments: [{ depth, left, right, role: "merge-target" }] },
        info: `Check while condition: i= ${i}, j= ${j}`,
        varsText: varsLine(), buffers: snapshotBuffers() });

      const lv = leftArr[i], rv = rightArr[j];

      record({ type: "compareHalves", codeLines: [13],
        highlight: { segments: [{ depth, left, right, role: "merge-target" }], values: { compare: [left+i, mid+1+j] } },
        info: `Compare ${lv} and ${rv}`, varsText: varsLine(), buffers: snapshotBuffers() });

      if (lv <= rv) {
        arr[k] = lv;
        record({ type: "placeFromLeft", codeLines: [14],
          highlight: { segments: [{ depth, left, right, role: "segment-placing" }], values: { placing: [k] } },
          info: `Place ${lv} at index ${k}`, varsText: varsLine(), buffers: snapshotBuffers() });
        i++; k++;
      } else {
        arr[k] = rv;
        record({ type: "placeFromRight", codeLines: [16],
          highlight: { segments: [{ depth, left, right, role: "segment-placing" }], values: { placing: [k] } },
          info: `Place ${rv} at index ${k}`, varsText: varsLine(), buffers: snapshotBuffers() });
        j++; k++;
      }
    }

    if (i < leftArr.length) {
      record({ type: "leftRemainder", codeLines: [19],
        highlight: { segments: [{ depth, left, right, role: "merge-target" }] },
        info: "Copy remaining values from left half", varsText: varsLine(), buffers: snapshotBuffers() });
    } else {
      record({ type: "leftRemainder", codeLines: [19],
        highlight: { segments: [] }, info: "No remaining values from left half",
        varsText: varsLine(), buffers: snapshotBuffers() });
    }

    while (i < leftArr.length) {
      const v = leftArr[i]; arr[k] = v;
      record({ type: "exhaustLeft", codeLines: [20],
        highlight: { segments: [{ depth, left, right, role: "segment-placing" }], values: { placing: [k] } },
        info: `Place ${v} at index ${k}`, varsText: varsLine(), buffers: snapshotBuffers() });
      i++; k++;
    }

    if (j < rightArr.length) {
      record({ type: "rightRemainder", codeLines: [22],
        highlight: { segments: [{ depth, left, right, role: "merge-target" }] },
        info: "Copy remaining values from right half", varsText: varsLine(), buffers: snapshotBuffers() });
    } else {
      record({ type: "rightRemainder", codeLines: [22],
        highlight: { segments: [] }, info: "No remaining values from right half",
        varsText: varsLine(), buffers: snapshotBuffers() });
    }

    while (j < rightArr.length) {
      const v = rightArr[j]; arr[k] = v;
      record({ type: "exhaustRight", codeLines: [23],
        highlight: { segments: [{ depth, left, right, role: "segment-placing" }], values: { placing: [k] } },
        info: `Place ${v} at index ${k}`, varsText: varsLine(), buffers: snapshotBuffers() });
      j++; k++;
    }

    record({
      type: "mergeComplete",
      codeLines: [25],
      highlight: { segments: [{ depth, left, right, role: "merged" }] },
      info: `Segment [${left}, ${right}] merged: [${arr.slice(left, right + 1).join(", ")}]`,
      varsText: varsLine()
    });
  };

  const mergeSort = (left, right, depth) => {
    registerSegment(depth, left, right);
    record({ type: "call", codeLines: [27],
      highlight: { segments: [{ depth, left, right, role: "current" }] },
      info: `mergeSort(arr, ${left}, ${right})` });

    if (left >= right) {
      record({ type: "baseCheck", codeLines: [28],
        highlight: { segments: [{ depth, left, right, role: "current" }] },
        info: `Check base case for [${left}, ${right}]` });
      record({ type: "baseReturn", codeLines: [29],
        highlight: { segments: [{ depth, left, right, role: "merged" }] },
        info: `Return because segment size is 1` });
      return;
    }

    const mid = Math.floor((left + right) / 2);
    registerSegment(depth + 1, left, mid);
    registerSegment(depth + 1, mid + 1, right);

    record({ type: "split", codeLines: [31],
      highlight: { segments: [
        { depth, left, right, role: "parent" },
        { depth: depth+1, left, right: mid, role: "left" },
        { depth: depth+1, left: mid+1, right, role: "right" }
      ]},
      info: `mid = ${mid}` });

    record({ type: "recurseLeft", codeLines: [32],
      highlight: { segments: [{ depth: depth+1, left, right: mid, role: "left" }] },
      info: `Recurse on left half [${left}, ${mid}]` });
    mergeSort(left, mid, depth + 1);

    record({ type: "recurseRight", codeLines: [33],
      highlight: { segments: [{ depth: depth+1, left: mid+1, right, role: "right" }] },
      info: `Recurse on right half [${mid+1}, ${right}]` });
    mergeSort(mid + 1, right, depth + 1);

    record({ type: "mergeCall", codeLines: [34],
      highlight: { segments: [{ depth, left, right, role: "parent" }] },
      info: `merge(arr, ${left}, ${mid}, ${right})` });
    merge(left, mid, right, depth);
  };

  if (values.length > 0) registerSegment(0, 0, values.length - 1);

  record({ type: "start", codeLines: [39],
    highlight: { segments: values.length ? [{ depth:0, left:0, right: values.length-1, role:"current"}] : [] },
    info: values.length ? `Call mergeSort(arr, 0, ${values.length - 1})` : "Array is empty" });

  if (values.length > 0) mergeSort(0, values.length - 1, 0);

  record({ type: "done", codeLines: [40],
    highlight: { segments: values.length ? [{ depth:0, left:0, right: values.length-1, role:"merged"}] : [] },
    info: values.length ? `Merge sort complete: [${arr.join(", ")}]` : "Nothing to sort" });

  return steps;
}
