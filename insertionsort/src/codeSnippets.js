export const insertionSortCode = [
  '<span class="kw">void</span> insertionSort(<span class="type">int</span> arr[], <span class="type">int</span> n) {', // 1
  '    <span class="kw">for</span> (<span class="type">int</span> i = 1; i &lt; n; i++) {',                                // 2
  '        <span class="type">int</span> key = arr[i];',                                                                  // 3
  '        <span class="type">int</span> j = i - 1;',                                                                     // 4
  '        <span class="kw">while</span> (j &gt;= 0 &amp;&amp; arr[j] &gt; key) {',                                    // 5
  '            arr[j + 1] = arr[j];',                                                                                     // 6
  '            j = j - 1;',                                                                                               // 7
  '        }',                                                                                                            // 8
  '        arr[j + 1] = key;',                                                                                            // 9
  '    }',                                                                                                                // 10
  '}'                                                                                                                     // 11
];
