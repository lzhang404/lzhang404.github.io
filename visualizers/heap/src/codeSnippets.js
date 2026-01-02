export const heapSnippets = {
  heapify: [
  "void heapify(int arr[], int n, int i) {", // 1
  "  int largest = i;", // 2
  "  int left = 2 * i + 1;", // 3
  "  int right = 2 * i + 2;", // 4
  "  if (left < n && arr[left] > arr[largest]) {", // 5
  "    largest = left;", // 6
  "  }", // 7
  "  if (right < n && arr[right] > arr[largest]) {", // 8
  "    largest = right;", // 9
  "  }", // 10
  "  if (largest != i) {", // 11
  "    std::swap(arr[i], arr[largest]); // percolate down", // 12
  "    heapify(arr, n, largest);", // 13
  "  }", // 14
  "}", // 15
  ],
  build: [
  "void heapify(int arr[], int n, int i) {", // 1
  "  int largest = i;", // 2
  "  int left = 2 * i + 1;", // 3
  "  int right = 2 * i + 2;", // 4
  "  if (left < n && arr[left] > arr[largest]) {", // 5
  "    largest = left;", // 6
  "  }", // 7
  "  if (right < n && arr[right] > arr[largest]) {", // 8
  "    largest = right;", // 9
  "  }", // 10
  "  if (largest != i) {", // 11
  "    std::swap(arr[i], arr[largest]); // percolate down", // 12
  "    heapify(arr, n, largest);", // 13
  "  }", // 14
  "}", // 15
  "", // 16
  "void buildHeap(int arr[], int n) {", // 17
  "  for (int i = n / 2 - 1; i >= 0; --i) {", // 18
  "    heapify(arr, n, i); // percolate down", // 19
  "  }", // 20
  "}", // 21
  ],
  insert: [
  "void insertHeap(std::vector<int>& heap, int value) {", // 1
  "  heap.push_back(value);", // 2
  "  int i = static_cast<int>(heap.size()) - 1;", // 3
  "  while (i > 0) {", // 4
  "    int parent = (i - 1) / 2;", // 5
  "    if (heap[i] > heap[parent]) {", // 6
  "      std::swap(heap[i], heap[parent]); // percolate up", // 7
  "      i = parent;", // 8
  "    } else {", // 9
  "      break;", // 10
  "    }", // 11
  "  }", // 12
  "}", // 13
  ],
  remove: [
  "int removeRoot(std::vector<int>& heap) {", // 1
  "  if (heap.empty()) { return 0; }", // 2
  "  int root = heap[0];", // 3
  "  std::swap(heap[0], heap.back());", // 4
  "  heap.pop_back();", // 5
  "  heapify(heap.data(), static_cast<int>(heap.size()), 0); // percolate down", // 6
  "  return root;", // 7
  "}", // 8
  ]
};
