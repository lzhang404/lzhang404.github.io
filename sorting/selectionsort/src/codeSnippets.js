export const selectionSortCode = [
  '<span class="kw">void</span> selectionSort(<span class="type">int</span> arr[], <span class="type">int</span> n) {', // 1
  '    <span class="kw">for</span> (<span class="type">int</span> i = 0; i &lt; n - 1; i++) {',                        // 2
  '        <span class="type">int</span> min_idx = i;',                                                               // 3
  '        <span class="kw">for</span> (<span class="type">int</span> j = i + 1; j &lt; n; j++) {',                   // 4
  '            <span class="kw">if</span> (arr[j] &lt; arr[min_idx]) {',                                              // 5
  '                min_idx = j;',                                                                                     // 6
  '            }',                                                                                                    // 7
  '        }',                                                                                                        // 8
  '        <span class="kw">if</span> (min_idx != i) {',                                                              // 9
  '            <span class="standard">std</span>::<span class="func">swap</span>(arr[min_idx], arr[i]);',             // 10
  '        }',                                                                                                        // 11
  '    }',                                                                                                            // 12
  '}'                                                                                                                 // 13
];
