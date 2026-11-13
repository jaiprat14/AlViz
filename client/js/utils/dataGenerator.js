/**
 * dataGenerator.js
 * Dataset generation and parsing utilities for AlViz algorithms.
 */

/**
 * Clamp a size integer between min and max bounds.
 */
export function clampSize(size, min = 5, max = 1000) {
  const n = parseInt(size, 10);
  if (isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/**
 * Generate an array of random integers in range [min, max].
 */
export function generateRandomArray(size = 50, min = 5, max = 500) {
  const n = clampSize(size, 5, 1000);
  const arr = new Array(n);
  for (let i = 0; i < n; i++) {
    arr[i] = Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return arr;
}

/**
 * Generate a nearly sorted array (sorted array with ~5% random swaps).
 */
export function generateNearlySortedArray(size = 50) {
  const n = clampSize(size, 5, 1000);
  // Create sorted base
  const arr = new Array(n);
  const step = 450 / n;
  for (let i = 0; i < n; i++) {
    arr[i] = Math.floor(10 + i * step);
  }

  // Swap ~5% of elements
  const numSwaps = Math.max(1, Math.floor(n * 0.05));
  for (let s = 0; s < numSwaps; s++) {
    const i = Math.floor(Math.random() * n);
    const j = Math.floor(Math.random() * n);
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

/**
 * Generate a reverse sorted array.
 */
export function generateReverseSortedArray(size = 50) {
  const n = clampSize(size, 5, 1000);
  const arr = new Array(n);
  const step = 450 / n;
  for (let i = 0; i < n; i++) {
    arr[i] = Math.floor(460 - i * step);
  }
  return arr;
}

/**
 * Parse user-entered string into array of numbers.
 * Supports comma-separated, space-separated, or newline-separated values.
 */
export function parseUserInput(inputStr) {
  if (typeof inputStr !== 'string') {
    throw new Error('Input must be a string');
  }

  const cleaned = inputStr.trim();
  if (!cleaned) {
    throw new Error('Input cannot be empty');
  }

  // Split by comma, whitespace, semicolon
  const tokens = cleaned.split(/[\s,;]+/);
  const nums = [];

  for (const token of tokens) {
    if (!token) continue;
    const num = Number(token);
    if (isNaN(num)) {
      throw new Error(`Invalid number: "${token}"`);
    }
    nums.push(Math.round(num));
  }

  if (nums.length === 0) {
    throw new Error('No valid numbers found in input');
  }

  if (nums.length > 1000) {
    throw new Error('Maximum allowed dataset size is 1,000 elements');
  }

  return nums;
}

/**
 * Generate a random connected planar-like graph for visualization.
 */
export function generateRandomGraph(nodeCount = 7, edgeCount = 10) {
  const n = Math.max(4, Math.min(12, nodeCount));
  const nodes = [];
  const labels = 'ABCDEFGHIJKL'.split('');

  // Distribute nodes roughly in a circle or oval
  const cx = 400;
  const cy = 250;
  const rx = 280;
  const ry = 160;

  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    // Add minor jitter
    const jitterX = (Math.random() - 0.5) * 40;
    const jitterY = (Math.random() - 0.5) * 40;
    nodes.push({
      id: i,
      label: labels[i] || `V${i}`,
      x: Math.round(cx + rx * Math.cos(angle) + jitterX),
      y: Math.round(cy + ry * Math.sin(angle) + jitterY),
    });
  }

  const edges = [];
  const edgeSet = new Set();

  // Helper to add edge if not duplicate
  const addEdge = (u, v) => {
    if (u === v) return;
    const key = u < v ? `${u}-${v}` : `${v}-${u}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      const weight = Math.floor(Math.random() * 9) + 1; // 1-9
      edges.push({ from: u, to: v, weight, directed: false });
    }
  };

  // Ensure connected graph: form a spanning tree first
  const connected = [0];
  const remaining = [];
  for (let i = 1; i < n; i++) remaining.push(i);

  while (remaining.length > 0) {
    const uIndex = Math.floor(Math.random() * connected.length);
    const u = connected[uIndex];
    const vIndex = Math.floor(Math.random() * remaining.length);
    const v = remaining.splice(vIndex, 1)[0];
    addEdge(u, v);
    connected.push(v);
  }

  // Add additional edges until reaching desired count
  const targetEdges = Math.min(edgeCount, (n * (n - 1)) / 2);
  let attempts = 0;
  while (edges.length < targetEdges && attempts < 100) {
    attempts++;
    const u = Math.floor(Math.random() * n);
    const v = Math.floor(Math.random() * n);
    addEdge(u, v);
  }

  return { nodes, edges };
}

/**
 * Generate a binary search tree representation from an array of values.
 */
export function generateBST(values) {
  if (!Array.isArray(values) || values.length === 0) return null;

  class Node {
    constructor(val) {
      this.value = val;
      this.left = null;
      this.right = null;
      this.height = 1;
      this.color = 'black';
      this.bf = 0;
    }
  }

  function insert(root, val) {
    if (!root) return new Node(val);
    if (val < root.value) {
      root.left = insert(root.left, val);
    } else if (val > root.value) {
      root.right = insert(root.right, val);
    }
    return root;
  }

  let root = null;
  for (const v of values) {
    root = insert(root, v);
  }
  return root;
}

