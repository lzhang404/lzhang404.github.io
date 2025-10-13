// /algos/radix/src/steps.js
export function generateRadixSteps(values) {
  const arr = values.slice();
  const steps = [];
  const record = (s) => steps.push({ ...s, array: arr.slice() });

  const maxAbs = arr.length ? Math.max(...arr.map(v => Math.abs(v))) : 0;
  let exp = 1;
  let pass = 1;

  // Line map matched to your radixCode (radixSort shown first)
  const LINES = {
    start: [1, 2, 3, 4],
    passLoopHeader: 6,
    placeIntoBuckets: [6, 7, 8, 9],
    collectHeader: [11, 12],
    collectOne: [13],
    passEnd: 17,
    // Negatives handling in the snippet starts here:
    negSplitStart: 20,       // vector<int> negatives, nonNegatives;
    negReverse: 24,          // reverse(negatives.begin(), negatives.end());
    negConcat: [28, 29, 30], // rebuild array as negatives + nonNegatives
    done: 31
  };

  record({ type: "start",
     codeLines: [LINES.start] });

  while (Math.floor(maxAbs / exp) > 0) {
    const buckets = Array.from({ length: 10 }, () => []);

    record({ type: "passStart", 
      codeLines: [LINES.passLoopHeader], pass, exp });

    // PLACE
    for (let i = 0; i < arr.length; i++) {
      const digit = Math.floor(Math.abs(arr[i]) / exp) % 10;
      buckets[digit].push(arr[i]);
      record({
        type: "bucketPlace",
        codeLines: LINES.placeIntoBuckets,
        pass, exp, index: i, digit,
        value: arr[i],
        buckets: cloneBuckets(buckets)
      });
    }

    // COLLECT (with real deletion so buckets shrink)
    let writeIdx = 0;

    record({
      type: "bucketCollectStart",
      codeLines: LINES.collectHeader,
      pass, exp, digit: 0,
      buckets: cloneBuckets(buckets)
    });

    for (let d = 0; d < 10; d++) {
      record({
        type: "bucketCollectStart",
        codeLines: [LINES.collectHeader[1]],
        pass, exp, digit: d,
        buckets: cloneBuckets(buckets)
      });

      while (buckets[d].length > 0) {
        const value = buckets[d].shift();   // <-- delete from bucket
        arr[writeIdx] = value;
        record({
        type: "bucketCollectStart",
        codeLines: [LINES.collectHeader[2]],
        pass, exp, digit: d,
        buckets: cloneBuckets(buckets)
        });

        record({
          type: "collectOne",
          codeLines: LINES.collectOne,
          pass, exp, digit: d, toIndex: writeIdx,
          value,
          buckets: cloneBuckets(buckets)
        });

        writeIdx++;
      }
    }

    record({ type: "passEnd", codeLines: [LINES.passEnd], pass, exp });

    pass += 1;
    exp *= 10;
  }

  // FINAL NEGATIVES FIX-UP (to match the C++ code behavior)
  {

    const negatives = [];
    const nonNegatives = [];
    for (const x of arr) (x < 0 ? negatives : nonNegatives).push(x);

      // Show the raw split
    record({
      type: "negativesAdjustStart",
      codeLines: [LINES.negSplitStart],      // e.g. line 21 "vector<int> negatives, nonNegatives;"
      negatives: negatives.slice(),
      nonNegatives: nonNegatives.slice(),
      buckets: Array.from({ length: 10 }, () => [])
    });

    // Reverse negatives (as in code snippet)
    negatives.reverse();
    record({
      type: "negativesReverse",
      codeLines: [LINES.negReverse],         // e.g. line 27 "reverse(negatives.begin(), negatives.end());"
      negatives: negatives.slice(),
      nonNegatives: nonNegatives.slice(),
      buckets: Array.from({ length: 10 }, () => [])
    });

    // Concat into final order
    const finalArr = negatives.concat(nonNegatives);
    // mutate arr in-place
    arr.splice(0, arr.length, ...finalArr);

    record({
      type: "negativesConcat",
      codeLines: LINES.negConcat,            // e.g. lines [28, 29, 30]
      negatives: negatives.slice(),
      nonNegatives: nonNegatives.slice(),
      final: finalArr.slice(),
      buckets: Array.from({ length: 10 }, () => [])
    });
  }

  record({ type: "done", codeLines: [LINES.done] });
  return steps;
}

function cloneBuckets(bks) {
  return bks.map((b) => b.slice());
}
