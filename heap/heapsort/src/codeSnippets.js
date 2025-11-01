export const heapSortCode = [
  '<span class="kw">void</span> heapify(<span class="type">int</span> arr[], <span class="type">int</span> n, <span class="type">int</span> i) {', // 1
  '  <span class="type">int</span> largest = i;',                              // 2
  '  <span class="type">int</span> left = 2 * i + 1;',                             // 3
  '  <span class="type">int</span> right = 2 * i + 2;',                            // 4
  '  <span class="kw">if</span> (left &lt; n &amp;&amp; arr[left] &gt; arr[largest]) {',              // 5
  '    largest = left;',                                           // 6
  '  }',                                                   // 7
  '  <span class="kw">if</span> (right &lt; n &amp;&amp; arr[right] &gt; arr[largest]) {',             // 8
  '    largest = right;',                                          // 9
  '  }',                                                   // 10
  '  <span class="kw">if</span> (largest != i) {',                               // 11
  '    <span class="standard">std</span>::<span class="func">swap</span>(arr[i], arr[largest]); // percolate down', // 12
  '    heapify(arr, n, largest);',                                     // 13
  '  }',                                                   // 14
  '}',                                                     // 15
  '',                                                      // 16
  '<span class="kw">void</span> buildHeap(<span class="type">int</span> arr[], <span class="type">int</span> n) {', // 17
  '  <span class="kw">for</span> (<span class="type">int</span> i = n / 2 - 1; i &gt;= 0; --i) {',       // 18
  '    heapify(arr, n, i); // percolate down',                               // 19
  '  }',                                                   // 20
  '}',                                                     // 21
  '',                                                      // 22
  '<span class="kw">void</span> heapSort(<span class="type">int</span> arr[], <span class="type">int</span> n) {', // 23
  '  buildHeap(arr, n);',                                          // 24
  '  <span class="kw">for</span> (<span class="type">int</span> end = n - 1; end &gt; 0; --end) {',     // 25
  '    <span class="standard">std</span>::<span class="func">swap</span>(arr[0], arr[end]);',      // 26
  '    heapify(arr, end, 0); // percolate down',                               // 27
  '  }',                                                   // 28
  '}'                                                      // 29
];
