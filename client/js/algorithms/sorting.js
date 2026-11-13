/**
 * sorting.js — Step-by-step sorting algorithm generators for AlViz.
 *
 * Each exported function takes an array and returns an array of STEP objects.
 * STEP shape:
 * {
 *   array:       number[]          — current array state (snapshot copy)
 *   comparing:   number[]          — indices currently being compared
 *   swapping:    number[]          — indices currently being swapped
 *   sorted:      number[]          — indices confirmed in final position (green)
 *   pivot:       number|null       — pivot index (purple), if applicable
 *   description: string            — human-readable description of this step
 *   pointers:    Record<string,number> — named pointers (left, right, i, j …)
 * }
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deep-copy an array. */
function copy(arr) {
  return arr.slice();
}

/** Build a minimal step object; callers override relevant fields. */
function makeStep(arr, overrides = {}) {
  return Object.assign(
    {
      array: copy(arr),
      comparing: [],
      swapping: [],
      sorted: [],
      pivot: null,
      description: '',
      pointers: {},
    },
    overrides
  );
}

// ---------------------------------------------------------------------------
// Bubble Sort
// ---------------------------------------------------------------------------
export function bubbleSort(arr) {
  const steps = [];
  const a = copy(arr);
  const n = a.length;
  const sortedIndices = [];

  steps.push(
    makeStep(a, { description: 'Starting Bubble Sort. Will bubble largest elements to the end each pass.' })
  );

  for (let pass = 0; pass < n - 1; pass++) {
    let swapped = false;

    for (let j = 0; j < n - 1 - pass; j++) {
      // Comparison step
      steps.push(
        makeStep(a, {
          comparing: [j, j + 1],
          sorted: copy(sortedIndices),
          description: `Pass ${pass + 1}: Comparing a[${j}]=${a[j]} and a[${j + 1}]=${a[j + 1]}`,
          pointers: { j },
        })
      );

      if (a[j] > a[j + 1]) {
        // Swap step
        steps.push(
          makeStep(a, {
            swapping: [j, j + 1],
            sorted: copy(sortedIndices),
            description: `a[${j}]=${a[j]} > a[${j + 1}]=${a[j + 1]}, swapping them`,
            pointers: { j },
          })
        );
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
        // Show result of swap
        steps.push(
          makeStep(a, {
            comparing: [j, j + 1],
            sorted: copy(sortedIndices),
            description: `Swapped: a[${j}]=${a[j]}, a[${j + 1}]=${a[j + 1]}`,
            pointers: { j },
          })
        );
      }
    }

    // The last unsorted element is now in its final position
    const settledIdx = n - 1 - pass;
    sortedIndices.push(settledIdx);
    steps.push(
      makeStep(a, {
        sorted: copy(sortedIndices),
        description: `End of pass ${pass + 1}: a[${settledIdx}]=${a[settledIdx]} is now in its sorted position`,
      })
    );

    if (!swapped) {
      // Array is already sorted — mark everything green
      for (let k = 0; k < settledIdx; k++) sortedIndices.push(k);
      sortedIndices.sort((x, y) => x - y);
      steps.push(
        makeStep(a, {
          sorted: copy(sortedIndices),
          description: 'No swaps in this pass — array is fully sorted!',
        })
      );
      break;
    }
  }

  // If we finished all passes without early exit, mark index 0 as sorted too
  if (!sortedIndices.includes(0)) sortedIndices.push(0);
  sortedIndices.sort((x, y) => x - y);
  steps.push(makeStep(a, { sorted: copy(sortedIndices), description: 'Bubble Sort complete!' }));

  return steps;
}

// ---------------------------------------------------------------------------
// Selection Sort
// ---------------------------------------------------------------------------
export function selectionSort(arr) {
  const steps = [];
  const a = copy(arr);
  const n = a.length;
  const sortedIndices = [];

  steps.push(makeStep(a, { description: 'Starting Selection Sort. Each pass finds the minimum of the unsorted portion.' }));

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    steps.push(
      makeStep(a, {
        comparing: [i],
        sorted: copy(sortedIndices),
        description: `Pass ${i + 1}: Assuming a[${i}]=${a[i]} is the minimum`,
        pointers: { i, minIdx },
      })
    );

    for (let j = i + 1; j < n; j++) {
      steps.push(
        makeStep(a, {
          comparing: [j, minIdx],
          sorted: copy(sortedIndices),
          description: `Comparing a[${j}]=${a[j]} with current min a[${minIdx}]=${a[minIdx]}`,
          pointers: { i, minIdx, j },
        })
      );

      if (a[j] < a[minIdx]) {
        minIdx = j;
        steps.push(
          makeStep(a, {
            comparing: [minIdx],
            sorted: copy(sortedIndices),
            description: `New minimum found: a[${minIdx}]=${a[minIdx]}`,
            pointers: { i, minIdx, j },
          })
        );
      }
    }

    if (minIdx !== i) {
      steps.push(
        makeStep(a, {
          swapping: [i, minIdx],
          sorted: copy(sortedIndices),
          description: `Swapping a[${i}]=${a[i]} with minimum a[${minIdx}]=${a[minIdx]}`,
          pointers: { i, minIdx },
        })
      );
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
    }

    sortedIndices.push(i);
    steps.push(
      makeStep(a, {
        sorted: copy(sortedIndices),
        description: `a[${i}]=${a[i]} is now in its sorted position`,
        pointers: { i },
      })
    );
  }

  sortedIndices.push(n - 1);
  steps.push(makeStep(a, { sorted: copy(sortedIndices), description: 'Selection Sort complete!' }));

  return steps;
}

// ---------------------------------------------------------------------------
// Insertion Sort
// ---------------------------------------------------------------------------
export function insertionSort(arr) {
  const steps = [];
  const a = copy(arr);
  const n = a.length;

  steps.push(makeStep(a, { sorted: [0], description: 'Starting Insertion Sort. First element is trivially sorted.' }));

  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;

    steps.push(
      makeStep(a, {
        comparing: [i],
        sorted: Array.from({ length: i }, (_, k) => k),
        description: `Inserting key=${key} (a[${i}]) into the sorted portion`,
        pointers: { i, j, key: i },
      })
    );

    while (j >= 0 && a[j] > key) {
      steps.push(
        makeStep(a, {
          comparing: [j, j + 1],
          sorted: Array.from({ length: i }, (_, k) => k),
          description: `a[${j}]=${a[j]} > key=${key}, shifting a[${j}] right`,
          pointers: { i, j, key: j + 1 },
        })
      );
      a[j + 1] = a[j];
      steps.push(
        makeStep(a, {
          swapping: [j, j + 1],
          sorted: Array.from({ length: i }, (_, k) => k),
          description: `Shifted a[${j}]=${a[j]} to position ${j + 1}`,
          pointers: { i, j, key: j + 1 },
        })
      );
      j--;
    }

    a[j + 1] = key;
    steps.push(
      makeStep(a, {
        sorted: Array.from({ length: i + 1 }, (_, k) => k),
        description: `Placed key=${key} at position ${j + 1}. First ${i + 1} elements are sorted.`,
        pointers: { i, insertedAt: j + 1 },
      })
    );
  }

  steps.push(
    makeStep(a, {
      sorted: Array.from({ length: n }, (_, k) => k),
      description: 'Insertion Sort complete!',
    })
  );

  return steps;
}

// ---------------------------------------------------------------------------
// Merge Sort
// ---------------------------------------------------------------------------
export function mergeSort(arr) {
  const steps = [];
  const a = copy(arr);
  const n = a.length;

  steps.push(makeStep(a, { description: 'Starting Merge Sort. Recursively divide and merge.' }));

  /**
   * Merge a[left..mid] and a[mid+1..right] in-place (on the working array `a`),
   * emitting steps.
   */
  function merge(left, mid, right) {
    const leftPart = a.slice(left, mid + 1);
    const rightPart = a.slice(mid + 1, right + 1);

    steps.push(
      makeStep(a, {
        comparing: Array.from({ length: right - left + 1 }, (_, k) => left + k),
        description: `Merging subarray [${left}..${mid}] with [${mid + 1}..${right}]`,
        pointers: { left, mid, right },
      })
    );

    let i = 0, j = 0, k = left;

    while (i < leftPart.length && j < rightPart.length) {
      const li = left + i;
      const rj = mid + 1 + j;

      steps.push(
        makeStep(a, {
          comparing: [li <= mid ? li : left, rj <= right ? rj : right],
          description: `Comparing left[${i}]=${leftPart[i]} and right[${j}]=${rightPart[j]}`,
          pointers: { left, mid, right, i: li, j: rj, k },
        })
      );

      if (leftPart[i] <= rightPart[j]) {
        a[k] = leftPart[i++];
      } else {
        a[k] = rightPart[j++];
      }

      steps.push(
        makeStep(a, {
          swapping: [k],
          description: `Placed ${a[k]} at position ${k}`,
          pointers: { left, mid, right, k },
        })
      );
      k++;
    }

    while (i < leftPart.length) {
      a[k] = leftPart[i++];
      steps.push(
        makeStep(a, {
          swapping: [k],
          description: `Copied remaining left element ${a[k]} to position ${k}`,
          pointers: { left, mid, right, k },
        })
      );
      k++;
    }

    while (j < rightPart.length) {
      a[k] = rightPart[j++];
      steps.push(
        makeStep(a, {
          swapping: [k],
          description: `Copied remaining right element ${a[k]} to position ${k}`,
          pointers: { left, mid, right, k },
        })
      );
      k++;
    }

    steps.push(
      makeStep(a, {
        sorted: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
        description: `Merged subarray [${left}..${right}] is sorted locally`,
        pointers: { left, right },
      })
    );
  }

  function sort(left, right) {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);

    steps.push(
      makeStep(a, {
        comparing: Array.from({ length: right - left + 1 }, (_, k) => left + k),
        description: `Dividing [${left}..${right}] into [${left}..${mid}] and [${mid + 1}..${right}]`,
        pointers: { left, mid, right },
      })
    );

    sort(left, mid);
    sort(mid + 1, right);
    merge(left, mid, right);
  }

  sort(0, n - 1);

  steps.push(
    makeStep(a, {
      sorted: Array.from({ length: n }, (_, k) => k),
      description: 'Merge Sort complete!',
    })
  );

  return steps;
}

// ---------------------------------------------------------------------------
// Quick Sort
// ---------------------------------------------------------------------------
export function quickSort(arr) {
  const steps = [];
  const a = copy(arr);
  const n = a.length;
  const sortedIndices = new Set();

  steps.push(makeStep(a, { description: 'Starting Quick Sort. Using last-element pivot strategy.' }));

  function partition(low, high) {
    const pivotVal = a[high];
    let i = low - 1;

    steps.push(
      makeStep(a, {
        pivot: high,
        comparing: Array.from({ length: high - low + 1 }, (_, k) => low + k),
        sorted: Array.from(sortedIndices),
        description: `Pivot = a[${high}] = ${pivotVal}. Partitioning [${low}..${high}]`,
        pointers: { low, high, i },
      })
    );

    for (let j = low; j < high; j++) {
      steps.push(
        makeStep(a, {
          pivot: high,
          comparing: [j],
          sorted: Array.from(sortedIndices),
          description: `Comparing a[${j}]=${a[j]} with pivot ${pivotVal}`,
          pointers: { low, high, i, j },
        })
      );

      if (a[j] <= pivotVal) {
        i++;
        if (i !== j) {
          steps.push(
            makeStep(a, {
              pivot: high,
              swapping: [i, j],
              sorted: Array.from(sortedIndices),
              description: `a[${j}]=${a[j]} <= pivot, swapping a[${i}]=${a[i]} and a[${j}]=${a[j]}`,
              pointers: { low, high, i, j },
            })
          );
          [a[i], a[j]] = [a[j], a[i]];
          steps.push(
            makeStep(a, {
              pivot: high,
              comparing: [i, j],
              sorted: Array.from(sortedIndices),
              description: `Swapped: a[${i}]=${a[i]}, a[${j}]=${a[j]}`,
              pointers: { low, high, i, j },
            })
          );
        }
      }
    }

    // Place pivot in correct position
    const pivotPos = i + 1;
    if (pivotPos !== high) {
      steps.push(
        makeStep(a, {
          pivot: high,
          swapping: [pivotPos, high],
          sorted: Array.from(sortedIndices),
          description: `Placing pivot ${pivotVal} at its correct position ${pivotPos}`,
          pointers: { low, high, pivotPos },
        })
      );
      [a[pivotPos], a[high]] = [a[high], a[pivotPos]];
    }

    sortedIndices.add(pivotPos);
    steps.push(
      makeStep(a, {
        pivot: pivotPos,
        sorted: Array.from(sortedIndices),
        description: `Pivot ${pivotVal} placed at index ${pivotPos} — its final position`,
        pointers: { low, high, pivotPos },
      })
    );

    return pivotPos;
  }

  function sort(low, high) {
    if (low >= high) {
      if (low === high) sortedIndices.add(low);
      return;
    }
    const pi = partition(low, high);
    sort(low, pi - 1);
    sort(pi + 1, high);
  }

  sort(0, n - 1);

  steps.push(
    makeStep(a, {
      sorted: Array.from({ length: n }, (_, k) => k),
      description: 'Quick Sort complete!',
    })
  );

  return steps;
}

// ---------------------------------------------------------------------------
// Heap Sort
// ---------------------------------------------------------------------------
export function heapSort(arr) {
  const steps = [];
  const a = copy(arr);
  const n = a.length;
  const sortedIndices = [];

  steps.push(makeStep(a, { description: 'Starting Heap Sort. First building a max-heap.' }));

  function heapify(size, root) {
    let largest = root;
    const left = 2 * root + 1;
    const right = 2 * root + 2;

    steps.push(
      makeStep(a, {
        comparing: [root, ...(left < size ? [left] : []), ...(right < size ? [right] : [])],
        sorted: copy(sortedIndices),
        description: `Heapify: checking node a[${root}]=${a[root]} against children`,
        pointers: { root, left: left < size ? left : -1, right: right < size ? right : -1 },
      })
    );

    if (left < size && a[left] > a[largest]) {
      largest = left;
    }
    if (right < size && a[right] > a[largest]) {
      largest = right;
    }

    if (largest !== root) {
      steps.push(
        makeStep(a, {
          swapping: [root, largest],
          sorted: copy(sortedIndices),
          description: `a[${largest}]=${a[largest]} is larger than a[${root}]=${a[root]}, swapping`,
          pointers: { root, largest },
        })
      );
      [a[root], a[largest]] = [a[largest], a[root]];
      steps.push(
        makeStep(a, {
          comparing: [root, largest],
          sorted: copy(sortedIndices),
          description: `Swapped a[${root}]=${a[root]} and a[${largest}]=${a[largest]}`,
          pointers: { root, largest },
        })
      );
      heapify(size, largest);
    }
  }

  // Build max-heap
  steps.push(makeStep(a, { description: 'Phase 1: Building max-heap from bottom up' }));
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(n, i);
  }

  steps.push(
    makeStep(a, {
      comparing: Array.from({ length: n }, (_, k) => k),
      description: 'Max-heap built. Phase 2: Extracting elements one by one.',
    })
  );

  // Extract elements
  for (let i = n - 1; i > 0; i--) {
    steps.push(
      makeStep(a, {
        swapping: [0, i],
        sorted: copy(sortedIndices),
        description: `Moving max element a[0]=${a[0]} to sorted position ${i}`,
        pointers: { heapEnd: i },
      })
    );
    [a[0], a[i]] = [a[i], a[0]];
    sortedIndices.push(i);

    steps.push(
      makeStep(a, {
        sorted: copy(sortedIndices),
        description: `a[${i}]=${a[i]} is now in its final sorted position. Heapifying remaining heap.`,
        pointers: { heapEnd: i - 1 },
      })
    );

    heapify(i, 0);
  }

  sortedIndices.push(0);
  sortedIndices.sort((x, y) => x - y);
  steps.push(makeStep(a, { sorted: copy(sortedIndices), description: 'Heap Sort complete!' }));

  return steps;
}

// ---------------------------------------------------------------------------
// Counting Sort
// ---------------------------------------------------------------------------
export function countingSort(arr) {
  const steps = [];

  // Validate — integers 0-999 only
  for (const v of arr) {
    if (!Number.isInteger(v) || v < 0 || v > 999) {
      steps.push(
        makeStep(arr, {
          description: `countingSort requires integer values in [0, 999]. Got ${v}.`,
        })
      );
      return steps;
    }
  }

  const a = copy(arr);
  const n = a.length;
  const k = 1000; // range
  const count = new Array(k).fill(0);

  steps.push(makeStep(a, { description: 'Starting Counting Sort. Phase 1: Building count array.' }));

  // Count phase
  for (let i = 0; i < n; i++) {
    count[a[i]]++;
    steps.push(
      makeStep(a, {
        comparing: [i],
        description: `Counting a[${i}]=${a[i]}. count[${a[i]}] is now ${count[a[i]]}`,
        pointers: { i, value: a[i], countValue: count[a[i]] },
      })
    );
  }

  steps.push(makeStep(a, { description: 'Count array built. Phase 2: Computing prefix sums (cumulative counts).' }));

  // Prefix sum phase
  for (let i = 1; i < k; i++) {
    if (count[i] > 0 || count[i - 1] > 0) {
      count[i] += count[i - 1];
      steps.push(
        makeStep(a, {
          description: `Prefix sum: count[${i}] = ${count[i]} (cumulative through value ${i})`,
          pointers: { i, prefixSum: count[i] },
        })
      );
    }
  }

  steps.push(makeStep(a, { description: 'Prefix sums done. Phase 3: Placing elements in output array.' }));

  // Output phase
  const output = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    const val = a[i];
    count[val]--;
    output[count[val]] = val;
    steps.push(
      makeStep(a, {
        comparing: [i],
        description: `Placing a[${i}]=${val} at output position ${count[val]}`,
        pointers: { i, outputPos: count[val], value: val },
      })
    );
  }

  // Copy output back to a
  for (let i = 0; i < n; i++) {
    a[i] = output[i];
  }

  steps.push(
    makeStep(a, {
      sorted: Array.from({ length: n }, (_, k) => k),
      description: 'Counting Sort complete! All elements placed in sorted order.',
    })
  );

  return steps;
}

// ---------------------------------------------------------------------------
// Radix Sort (LSD, base-10)
// ---------------------------------------------------------------------------
export function radixSort(arr) {
  const steps = [];

  for (const v of arr) {
    if (!Number.isInteger(v) || v < 0) {
      steps.push(
        makeStep(arr, {
          description: `radixSort requires non-negative integers. Got ${v}.`,
        })
      );
      return steps;
    }
  }

  const a = copy(arr);
  const n = a.length;

  const maxVal = Math.max(...a);
  const maxDigits = maxVal === 0 ? 1 : Math.floor(Math.log10(maxVal)) + 1;

  steps.push(
    makeStep(a, {
      description: `Starting Radix Sort. Max value = ${maxVal}, requires ${maxDigits} digit pass(es).`,
    })
  );

  for (let digit = 0; digit < maxDigits; digit++) {
    const exp = Math.pow(10, digit);
    const digitName = digit === 0 ? 'units' : digit === 1 ? 'tens' : digit === 2 ? 'hundreds' : `10^${digit}`;
    const buckets = Array.from({ length: 10 }, () => []);

    steps.push(
      makeStep(a, {
        description: `Pass ${digit + 1}: Sorting by ${digitName} digit (10^${digit} place)`,
        pointers: { digit, exp },
      })
    );

    // Distribute into buckets
    for (let i = 0; i < n; i++) {
      const d = Math.floor(a[i] / exp) % 10;
      steps.push(
        makeStep(a, {
          comparing: [i],
          description: `a[${i}]=${a[i]} → ${digitName} digit = ${d} → bucket ${d}`,
          pointers: { i, digit, bucket: d },
        })
      );
      buckets[d].push(a[i]);
    }

    // Collect from buckets
    let idx = 0;
    for (let b = 0; b < 10; b++) {
      for (const val of buckets[b]) {
        a[idx] = val;
        steps.push(
          makeStep(a, {
            swapping: [idx],
            description: `Collecting from bucket ${b}: placing ${val} at position ${idx}`,
            pointers: { idx, bucket: b },
          })
        );
        idx++;
      }
    }

    steps.push(
      makeStep(a, {
        comparing: Array.from({ length: n }, (_, k) => k),
        description: `After ${digitName} pass: ${a.join(', ')}`,
      })
    );
  }

  steps.push(
    makeStep(a, {
      sorted: Array.from({ length: n }, (_, k) => k),
      description: 'Radix Sort complete!',
    })
  );

  return steps;
}

// ---------------------------------------------------------------------------
// Algorithm registry
// ---------------------------------------------------------------------------
export const SORTING_ALGORITHMS = {
  'bubble-sort': {
    fn: bubbleSort,
    name: 'Bubble Sort',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    description:
      'Repeatedly compares adjacent elements and swaps them if they are in the wrong order. Each pass bubbles the largest unsorted element to its final position. Simple but inefficient for large datasets.',
  },
  'selection-sort': {
    fn: selectionSort,
    name: 'Selection Sort',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    description:
      'Divides the array into sorted and unsorted regions. On each pass, finds the minimum element in the unsorted region and swaps it into place. Makes at most n-1 swaps, good when swaps are costly.',
  },
  'insertion-sort': {
    fn: insertionSort,
    name: 'Insertion Sort',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    description:
      'Builds the sorted array one element at a time by inserting each new element into its correct position within the already-sorted portion. Very efficient for small or nearly-sorted datasets.',
  },
  'merge-sort': {
    fn: mergeSort,
    name: 'Merge Sort',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    description:
      'A divide-and-conquer algorithm that recursively splits the array in half, sorts each half, and merges the results. Guarantees O(n log n) in all cases. Requires O(n) auxiliary space.',
  },
  'quick-sort': {
    fn: quickSort,
    name: 'Quick Sort',
    timeComplexity: 'O(n log n) avg',
    spaceComplexity: 'O(log n)',
    description:
      'Selects a pivot element and partitions the array so that elements smaller than the pivot come before it and larger ones after. Recursively sorts each partition. Very fast in practice; uses last-element pivot here.',
  },
  'heap-sort': {
    fn: heapSort,
    name: 'Heap Sort',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(1)',
    description:
      'First builds a max-heap from the input, then repeatedly extracts the maximum to produce a sorted array. Combines the in-place advantage of selection sort with the O(n log n) guarantee of merge sort.',
  },
  'counting-sort': {
    fn: countingSort,
    name: 'Counting Sort',
    timeComplexity: 'O(n+k)',
    spaceComplexity: 'O(k)',
    description:
      'Non-comparative sort for integers in a known range [0, k). Counts occurrences of each value, computes prefix sums, then places each element directly in its sorted position. Extremely fast when k is small relative to n.',
  },
  'radix-sort': {
    fn: radixSort,
    name: 'Radix Sort',
    timeComplexity: 'O(d·n)',
    spaceComplexity: 'O(n+k)',
    description:
      'Sorts integers digit by digit from least significant to most significant (LSD). Uses a stable sub-sort (counting sort) on each digit position. Very efficient for large sets of fixed-length integers.',
  },
};
