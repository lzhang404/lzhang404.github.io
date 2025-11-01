export const prioritySnippets = {
  build: [
    '<span class="kw">void</span> heapify(<span class="type">int</span> arr[], <span class="type">int</span> n, <span class="type">int</span> i) {', // 1
    '    <span class="type">int</span> largest = i;',                                                                                     // 2
    '    <span class="type">int</span> left = 2 * i + 1;',                                                                                // 3
    '    <span class="type">int</span> right = 2 * i + 2;',                                                                               // 4
    '    <span class="kw">if</span> (left &lt; n &amp;&amp; arr[left] &gt; arr[largest]) {',                                         // 5
    '        largest = left;',                                                                                                             // 6
    '    }',                                                                                                                               // 7
    '    <span class="kw">if</span> (right &lt; n &amp;&amp; arr[right] &gt; arr[largest]) {',                                      // 8
    '        largest = right;',                                                                                                            // 9
    '    }',                                                                                                                               // 10
    '    <span class="kw">if</span> (largest != i) {',                                                                                     // 11
    '        <span class="standard">std</span>::<span class="func">swap</span>(arr[i], arr[largest]); // percolate down', // 12
    '        heapify(arr, n, largest);',                                                                                                   // 13
    '    }',                                                                                                                               // 14
    '}',                                                                                                                                  // 15
    '',                                                                                                                                   // 16
    '<span class="kw">void</span> buildPriorityQueue(<span class="type">int</span> arr[], <span class="type">int</span> n) {', // 17
    '    <span class="kw">for</span> (<span class="type">int</span> i = n / 2 - 1; i &gt;= 0; --i) {',         // 18
    '        heapify(arr, n, i); // percolate down',                                                   // 19
    '    }',                                                                                           // 20
    '}',                                                                                               // 21
  ],
  enqueue: [
    '<span class="kw">void</span> enqueuePriorityQueue(<span class="type">std::vector&lt;int&gt;</span>&amp; heap, <span class="type">int</span> value) {', // 1
    '    heap.push_back(value);',                                                                                                                       // 2
    '    <span class="type">int</span> i = static_cast&lt;<span class="type">int</span>&gt;(heap.size()) - 1;',                                     // 3
    '    <span class="kw">while</span> (i &gt; 0) {',                                                                                                   // 4
    '        <span class="type">int</span> parent = (i - 1) / 2;',                                                                                    // 5
    '        <span class="kw">if</span> (heap[i] &gt; heap[parent]) {',                                                                              // 6
    '            <span class="standard">std</span>::<span class="func">swap</span>(heap[i], heap[parent]); // percolate up', // 7
    '            i = parent;',                                                                                                                          // 8
    '        } <span class="kw">else</span> {',                                                                                                        // 9
    '            <span class="kw">break</span>;',                                                                                                     // 10
    '        }',                                                                                                                                       // 11
    '    }',                                                                                                                                           // 12
    '}',                                                                                                                                              // 13
  ],
  dequeue: [
    '<span class="type">int</span> dequeuePriorityQueue(<span class="type">std::vector&lt;int&gt;</span>&amp; heap) {', // 1
    '    <span class="kw">if</span> (heap.empty()) { <span class="kw">return</span> 0; }',             // 2
    '    <span class="type">int</span> front = heap[0];',                                                // 3
    '    <span class="standard">std</span>::<span class="func">swap</span>(heap[0], heap.back());',     // 4
    '    heap.pop_back();',                                                                                // 5
    '    heapify(heap.data(), static_cast&lt;<span class="type">int</span>&gt;(heap.size()), 0); // percolate down', // 6
    '    <span class="kw">return</span> front;',                                                          // 7
    '}',                                                                                                   // 8
  ],
  peek: [
    '<span class="type">int</span> peekPQ(<span class="type">const std::vector&lt;int&gt;</span>&amp; heap) {', // 1
    '    <span class="kw">if</span> (heap.empty()) { <span class="kw">return</span> 0; }',                         // 2
    '    <span class="kw">return</span> heap[0];',                                                                  // 3
    '}',                                                                                                             // 4
  ]
};
