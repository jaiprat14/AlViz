/**
 * searching.js — Step-by-step searching algorithm generators for AlViz.
 *
 * Each exported function takes (arr, target) and returns an array of STEP objects.
 * STEP shape:
 * {
 *   array:       number[]             — current array state (snapshot)
 *   comparing:   number[]             — indices currently being examined
 *   found:       number|null          — index where target was found (green)
 *   exhausted:   boolean              — true when search failed (highlight all red)
 *   description: string               — human-readable description
 *   pointers:    Record<string,number> — named pointers (left, right, mid …)
 * }
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function copy(arr) {
  return arr.slice();
}

function makeStep(arr, overrides = {}) {
  return Object.assign(
    {
      array: copy(arr),
      comparing: [],
      found: null,
      exhausted: false,
      description: '',
      pointers: {},
    },
    overrides
  );
}

// ---------------------------------------------------------------------------
// Linear Search
// ---------------------------------------------------------------------------

/**
 * linearSearch(arr, target)
 * Checks each element sequentially.
 * - Comparing step: current element highlighted.
 * - Found step: target element highlighted green (found = index).
 * - Exhausted step: entire array marked (exhausted = true).
 */
export function linearSearch(arr, target) {
  const steps = [];
  const a = copy(arr);
  const n = a.length;

  steps.push(
    makeStep(a, {
      description: `Starting Linear Search for target = ${target}. Checking each element left to right.`,
    })
  );

  for (let i = 0; i < n; i++) {
    // Comparison step
    steps.push(
      makeStep(a, {
        comparing: [i],
        description: `Checking a[${i}] = ${a[i]} against target ${target}`,
        pointers: { i },
      })
    );

    if (a[i] === target) {
      // Found
      steps.push(
        makeStep(a, {
          found: i,
          description: `Found! a[${i}] = ${a[i]} matches target ${target} at index ${i}.`,
          pointers: { i },
        })
      );
      return steps;
    }

    // Not matched — show mismatch
    steps.push(
      makeStep(a, {
        comparing: [],
        description: `a[${i}] = ${a[i]} ≠ ${target}. Moving to next element.`,
        pointers: { i },
      })
    );
  }

  // Exhausted — target not found
  steps.push(
    makeStep(a, {
      exhausted: true,
      description: `Target ${target} not found in the array after checking all ${n} elements.`,
    })
  );

  return steps;
}

// ---------------------------------------------------------------------------
// Binary Search
// ---------------------------------------------------------------------------

/**
 * binarySearch(arr, target)
 * Assumes the array is sorted in ascending order.
 * Shows left, right, and mid pointers narrowing down the search range.
 */
export function binarySearch(arr, target) {
  const steps = [];
  const a = copy(arr);
  const n = a.length;

  steps.push(
    makeStep(a, {
      description: `Starting Binary Search for target = ${target}. Array must be sorted. Checking middle element of current range.`,
      pointers: { left: 0, right: n - 1 },
    })
  );

  let left = 0;
  let right = n - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    // Show current search window and mid
    const rangeIndices = Array.from({ length: right - left + 1 }, (_, k) => left + k);

    steps.push(
      makeStep(a, {
        comparing: rangeIndices,
        description: `Search range [${left}..${right}]. Mid index = ${mid}, a[${mid}] = ${a[mid]}`,
        pointers: { left, right, mid },
      })
    );

    // Highlight mid being compared
    steps.push(
      makeStep(a, {
        comparing: [mid],
        description: `Comparing a[${mid}] = ${a[mid]} with target = ${target}`,
        pointers: { left, right, mid },
      })
    );

    if (a[mid] === target) {
      // Found
      steps.push(
        makeStep(a, {
          found: mid,
          description: `Found! a[${mid}] = ${a[mid]} matches target ${target} at index ${mid}.`,
          pointers: { left, right, mid },
        })
      );
      return steps;
    } else if (a[mid] < target) {
      steps.push(
        makeStep(a, {
          comparing: [mid],
          description: `a[${mid}] = ${a[mid]} < ${target}. Target must be in the right half. Moving left to ${mid + 1}.`,
          pointers: { left, right: right, mid, newLeft: mid + 1 },
        })
      );
      left = mid + 1;
    } else {
      steps.push(
        makeStep(a, {
          comparing: [mid],
          description: `a[${mid}] = ${a[mid]} > ${target}. Target must be in the left half. Moving right to ${mid - 1}.`,
          pointers: { left, right, mid, newRight: mid - 1 },
        })
      );
      right = mid - 1;
    }
  }

  // Exhausted — target not found
  steps.push(
    makeStep(a, {
      exhausted: true,
      description: `Target ${target} not found. Search range exhausted (left=${left} > right=${right}).`,
      pointers: { left, right },
    })
  );

  return steps;
}

// ---------------------------------------------------------------------------
// Algorithm registry
// ---------------------------------------------------------------------------

export const SEARCHING_ALGORITHMS = {
  'linear-search': {
    fn: linearSearch,
    name: 'Linear Search',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    description:
      'Sequentially checks each element of the array until the target is found or the array is exhausted. Works on unsorted and sorted arrays alike. Simple and reliable, but slow for large datasets.',
    requiresSorted: false,
  },
  'binary-search': {
    fn: binarySearch,
    name: 'Binary Search',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    description:
      'Efficiently searches a sorted array by repeatedly halving the search range. Compares the target to the middle element and eliminates half the remaining elements on each step. Requires the array to be sorted beforehand.',
    requiresSorted: true,
  },
};
