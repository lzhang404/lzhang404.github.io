# core heap examples
python3 scripts/generate_heap_diagram.py   --array '[88, 80, 55, 33, 72, 24, 41]'   --output _static/images/heap/maxheap_example.svg

python3 scripts/generate_heap_diagram.py   --array '[33, 48, 51, 60, 70, 72, 90]'   --output _static/images/heap/minheap_example.svg

# insert
python3 scripts/generate_heap_diagram.py   --array '[88, 80, 55, 33]'   --output _static/images/heap/insert_01_initial.svg

python3 scripts/generate_heap_diagram.py   --array '[88, 80, 55, 33, 90]'   --output _static/images/heap/insert_02_added.svg --color orange:[90]

python3 scripts/generate_heap_diagram.py   --array '[88, 90, 55, 33, 80]'   --output _static/images/heap/insert_03_swap1.svg --color orange:[90]

python3 scripts/generate_heap_diagram.py   --array '[90, 88, 55, 33, 80]'   --output _static/images/heap/insert_04_done.svg --color orange:[90]

# remove
python3 scripts/generate_heap_diagram.py   --array '[90, 88, 55, 33, 80]'   --output _static/images/heap/remove_01_initial.svg --color orange:[90]

python3 scripts/generate_heap_diagram.py   --array '[80, 88, 55, 33]'   --output _static/images/heap/remove_02_replaced.svg --color orange:[80]

python3 scripts/generate_heap_diagram.py   --array '[88, 80, 55, 33]'   --output _static/images/heap/remove_03_done.svg --color orange:[80]

# array representation
python3 scripts/generate_heap_diagram.py   --array '[72, 58, 63, 55, 16, 44]'   --output _static/images/heap/heap_array.svg --show-indices

# heapify
python3 scripts/generate_heap_diagram.py   --array '[77, 55, 92, 67, 98, 24, 42]'   --output _static/images/heap/heapify_01_input.svg

python3 scripts/generate_heap_diagram.py   --array '[77, 98, 92, 67, 55, 24, 42]'   --output _static/images/heap/heapify_02_step1.svg --color orange:[98]

python3 scripts/generate_heap_diagram.py   --array '[98, 77, 92, 67, 55, 24, 42]'   --output _static/images/heap/heapify_03_done.svg --color orange:[98]

# heapsort
python3 scripts/generate_heap_diagram.py   --array '[1, 2, 3, 5, 6, 4]'   --output _static/images/heap/heapsort_01_initial.svg

python3 scripts/generate_heap_diagram.py   --array '[6, 5, 4, 1, 2, 3]'   --output _static/images/heap/heapsort_02_heapified.svg

python3 scripts/generate_heap_diagram.py   --array '[3, 5, 4, 1, 2, 6]'   --output _static/images/heap/heapsort_03_extraction.svg --color orange:[3] --color gray:[6]

python3 scripts/generate_heap_diagram.py   --array '[5, 3, 4, 1, 2, 6]'   --output _static/images/heap/heapsort_04_siftdown.svg --color orange:[3] --color gray:[6]

python3 scripts/generate_heap_diagram.py   --array '[5, 3, 4, 1, 2, 6]'   --output _static/images/heap/heapsort_05_initial2.svg --color gray:[6]

python3 scripts/generate_heap_diagram.py   --array '[2, 3, 4, 1, 5, 6]'   --output _static/images/heap/heapsort_06_extraction.svg --color orange:[2] --color gray:[5, 6]

python3 scripts/generate_heap_diagram.py   --array '[4, 3, 2, 1, 5, 6]'   --output _static/images/heap/heapsort_07_siftdown.svg --color orange:[2] --color gray:[5, 6]

python3 scripts/generate_heap_diagram.py   --array '[4, 3, 2, 1, 5, 6]'   --output _static/images/heap/heapsort_08_initial.svg --color gray:[5, 6]

python3 scripts/generate_heap_diagram.py   --array '[1, 3, 2, 4, 5, 6]'   --output _static/images/heap/heapsort_09_extraction.svg --color orange:[1] --color gray:[4, 5, 6]

python3 scripts/generate_heap_diagram.py   --array '[3, 1, 2, 4, 5, 6]'   --output _static/images/heap/heapsort_10_siftdown.svg --color orange:[1] --color gray:[4, 5, 6]

python3 scripts/generate_heap_diagram.py   --array '[3, 1, 2, 4, 5, 6]'   --output _static/images/heap/heapsort_11_initial.svg --color gray:[4, 5, 6]

python3 scripts/generate_heap_diagram.py   --array '[2, 1, 3, 4, 5, 6]'   --output _static/images/heap/heapsort_12_extraction4.svg --color orange:[2] --color gray:[3, 4, 5, 6]

python3 scripts/generate_heap_diagram.py   --array '[2, 1, 3, 4, 5, 6]'   --output _static/images/heap/heapsort_13_last_initial.svg --color gray:[3, 4, 5, 6]

python3 scripts/generate_heap_diagram.py   --array '[1, 2, 3, 4, 5, 6]'   --output _static/images/heap/heapsort_14_sorted.svg --color gray:[1, 2, 3, 4, 5, 6]
