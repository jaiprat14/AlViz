/**
 * trees.js — Tree / data-structure algorithm step generators for AlViz
 *
 * Node structure: { value, left, right, height, color, bf }
 *   height — used by AVL
 *   color  — 'red' | 'black', used by Red-Black Tree
 *   bf     — balance factor, used by AVL
 *
 * Each algorithm/operation returns an array of STEP objects:
 *   { root, highlighted, path, rotations, recolored, description, operation }
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cloneTree(node) {
  if (!node) return null;
  return {
    value: node.value,
    height: node.height,
    color: node.color,
    bf: node.bf,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
}

function makeTreeStep(override) {
  return {
    root: null,
    highlighted: [],
    path: [],
    rotations: null,
    recolored: [],
    description: '',
    operation: 'insert',
    ...override,
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// AVL TREE
// ════════════════════════════════════════════════════════════════════════════════

function avlHeight(node) {
  return node ? node.height : 0;
}

function avlBF(node) {
  return node ? avlHeight(node.left) - avlHeight(node.right) : 0;
}

function avlUpdateHeight(node) {
  node.height = 1 + Math.max(avlHeight(node.left), avlHeight(node.right));
  node.bf = avlBF(node);
}

function avlNewNode(value) {
  return { value, left: null, right: null, height: 1, color: 'black', bf: 0 };
}

// Right rotation (LL case)
function avlRotateRight(y) {
  const x = y.left;
  const T2 = x.right;
  x.right = y;
  y.left = T2;
  avlUpdateHeight(y);
  avlUpdateHeight(x);
  return x;
}

// Left rotation (RR case)
function avlRotateLeft(x) {
  const y = x.right;
  const T2 = y.left;
  y.left = x;
  x.right = T2;
  avlUpdateHeight(x);
  avlUpdateHeight(y);
  return y;
}

export class AVLTree {
  constructor() {
    this.root = null;
  }

  // ── Insert ────────────────────────────────────────────────────────────────

  insert(value) {
    const steps = [];
    const path = [];

    const insertRec = (node, val) => {
      if (!node) {
        const newNode = avlNewNode(val);
        steps.push(makeTreeStep({
          root: cloneTree(this.root) || cloneTree(newNode),
          highlighted: [val],
          path: [...path],
          description: `Insert ${val}: place new node here (empty spot).`,
          operation: 'insert',
        }));
        return newNode;
      }

      path.push(node.value);
      steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value],
        path: [...path],
        description: `Insert ${val}: compare with ${node.value}. Go ${val < node.value ? 'left' : val > node.value ? 'right' : 'duplicate—stop'}.`,
        operation: 'insert',
      }));

      if (val < node.value) {
        node.left = insertRec(node.left, val);
      } else if (val > node.value) {
        node.right = insertRec(node.right, val);
      } else {
        // Duplicate: no insert
        path.pop();
        return node;
      }

      avlUpdateHeight(node);
      path.pop();

      steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value],
        path: [...path],
        description: `Backtrack to ${node.value}: height=${node.height}, BF=${node.bf}.`,
        operation: 'insert',
      }));

      return this._avlBalance(node, val, steps, [...path]);
    };

    this.root = insertRec(this.root, value);

    steps.push(makeTreeStep({
      root: cloneTree(this.root),
      highlighted: [],
      path: [],
      description: `Insert ${value} complete. Tree is balanced.`,
      operation: 'insert',
    }));

    return steps;
  }

  _avlBalance(node, val, steps, path) {
    const bf = avlBF(node);

    // LL
    if (bf > 1 && val < node.left.value) {
      steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value],
        path,
        rotations: 'LL',
        description: `BF=${bf} at ${node.value} (LL case). Perform Right Rotation.`,
        operation: 'rotate',
      }));
      const rotated = avlRotateRight(node);
      steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [rotated.value],
        path,
        rotations: null,
        description: `Right rotation done. New subtree root: ${rotated.value}.`,
        operation: 'rotate',
      }));
      return rotated;
    }

    // RR
    if (bf < -1 && val > node.right.value) {
      steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value],
        path,
        rotations: 'RR',
        description: `BF=${bf} at ${node.value} (RR case). Perform Left Rotation.`,
        operation: 'rotate',
      }));
      const rotated = avlRotateLeft(node);
      steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [rotated.value],
        path,
        rotations: null,
        description: `Left rotation done. New subtree root: ${rotated.value}.`,
        operation: 'rotate',
      }));
      return rotated;
    }

    // LR
    if (bf > 1 && val > node.left.value) {
      steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value, node.left.value],
        path,
        rotations: 'LR',
        description: `BF=${bf} at ${node.value} (LR case). Left-rotate left child, then right-rotate ${node.value}.`,
        operation: 'rotate',
      }));
      node.left = avlRotateLeft(node.left);
      const rotated = avlRotateRight(node);
      steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [rotated.value],
        path,
        rotations: null,
        description: `LR rotation done. New subtree root: ${rotated.value}.`,
        operation: 'rotate',
      }));
      return rotated;
    }

    // RL
    if (bf < -1 && val < node.right.value) {
      steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value, node.right.value],
        path,
        rotations: 'RL',
        description: `BF=${bf} at ${node.value} (RL case). Right-rotate right child, then left-rotate ${node.value}.`,
        operation: 'rotate',
      }));
      node.right = avlRotateRight(node.right);
      const rotated = avlRotateLeft(node);
      steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [rotated.value],
        path,
        rotations: null,
        description: `RL rotation done. New subtree root: ${rotated.value}.`,
        operation: 'rotate',
      }));
      return rotated;
    }

    return node;
  }

  // ── Search ────────────────────────────────────────────────────────────────

  search(value) {
    const steps = [];
    const path = [];
    let node = this.root;

    steps.push(makeTreeStep({
      root: cloneTree(this.root),
      highlighted: [],
      path: [],
      description: `Search for ${value}: start at root.`,
      operation: 'search',
    }));

    while (node) {
      path.push(node.value);
      if (value === node.value) {
        steps.push(makeTreeStep({
          root: cloneTree(this.root),
          highlighted: [node.value],
          path: [...path],
          description: `Found ${value} at node ${node.value}!`,
          operation: 'search',
        }));
        return steps;
      }
      steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value],
        path: [...path],
        description: `${value} ${value < node.value ? '<' : '>'} ${node.value}: go ${value < node.value ? 'left' : 'right'}.`,
        operation: 'search',
      }));
      node = value < node.value ? node.left : node.right;
    }

    steps.push(makeTreeStep({
      root: cloneTree(this.root),
      highlighted: [],
      path: [...path],
      description: `${value} not found in tree.`,
      operation: 'search',
    }));

    return steps;
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  delete(value) {
    const steps = [];

    steps.push(makeTreeStep({
      root: cloneTree(this.root),
      highlighted: [],
      path: [],
      description: `Delete ${value}: start search.`,
      operation: 'delete',
    }));

    const deleteRec = (node, val, path) => {
      if (!node) {
        steps.push(makeTreeStep({
          root: cloneTree(this.root),
          highlighted: [],
          path: [...path],
          description: `${val} not found — nothing to delete.`,
          operation: 'delete',
        }));
        return null;
      }

      path.push(node.value);
      steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value],
        path: [...path],
        description: `Delete ${val}: at node ${node.value}. ${val < node.value ? 'Go left.' : val > node.value ? 'Go right.' : 'Found node to delete.'}`,
        operation: 'delete',
      }));

      if (val < node.value) {
        node.left = deleteRec(node.left, val, path);
      } else if (val > node.value) {
        node.right = deleteRec(node.right, val, path);
      } else {
        // Node to delete found
        if (!node.left || !node.right) {
          const child = node.left || node.right;
          path.pop();
          if (!child) {
            steps.push(makeTreeStep({
              root: cloneTree(this.root),
              highlighted: [node.value],
              path: [...path],
              description: `Node ${val} is a leaf — remove it.`,
              operation: 'delete',
            }));
            return null;
          }
          steps.push(makeTreeStep({
            root: cloneTree(this.root),
            highlighted: [node.value],
            path: [...path],
            description: `Node ${val} has one child (${child.value}) — replace with child.`,
            operation: 'delete',
          }));
          return child;
        }

        // Find in-order successor (smallest in right subtree)
        let successor = node.right;
        while (successor.left) successor = successor.left;

        steps.push(makeTreeStep({
          root: cloneTree(this.root),
          highlighted: [node.value, successor.value],
          path: [...path],
          description: `Node ${val} has two children. In-order successor: ${successor.value}. Replace value, delete successor.`,
          operation: 'delete',
        }));

        node.value = successor.value;
        node.right = deleteRec(node.right, successor.value, [...path]);
      }

      path.pop();
      avlUpdateHeight(node);

      steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value],
        path: [...path],
        description: `Backtrack to ${node.value}: height=${node.height}, BF=${node.bf}. Check balance.`,
        operation: 'delete',
      }));

      // Rebalance
      const bf = avlBF(node);

      // LL
      if (bf > 1 && avlBF(node.left) >= 0) {
        steps.push(makeTreeStep({ root: cloneTree(this.root), highlighted: [node.value], path: [...path], rotations: 'LL', description: `BF=${bf} at ${node.value} after delete (LL). Right Rotation.`, operation: 'rotate' }));
        const r = avlRotateRight(node);
        steps.push(makeTreeStep({ root: cloneTree(this.root), highlighted: [r.value], path: [...path], description: `Right rotation done. New subtree root: ${r.value}.`, operation: 'rotate' }));
        return r;
      }
      // LR
      if (bf > 1 && avlBF(node.left) < 0) {
        steps.push(makeTreeStep({ root: cloneTree(this.root), highlighted: [node.value, node.left.value], path: [...path], rotations: 'LR', description: `BF=${bf} at ${node.value} after delete (LR). LR Rotation.`, operation: 'rotate' }));
        node.left = avlRotateLeft(node.left);
        const r = avlRotateRight(node);
        steps.push(makeTreeStep({ root: cloneTree(this.root), highlighted: [r.value], path: [...path], description: `LR rotation done. New subtree root: ${r.value}.`, operation: 'rotate' }));
        return r;
      }
      // RR
      if (bf < -1 && avlBF(node.right) <= 0) {
        steps.push(makeTreeStep({ root: cloneTree(this.root), highlighted: [node.value], path: [...path], rotations: 'RR', description: `BF=${bf} at ${node.value} after delete (RR). Left Rotation.`, operation: 'rotate' }));
        const r = avlRotateLeft(node);
        steps.push(makeTreeStep({ root: cloneTree(this.root), highlighted: [r.value], path: [...path], description: `Left rotation done. New subtree root: ${r.value}.`, operation: 'rotate' }));
        return r;
      }
      // RL
      if (bf < -1 && avlBF(node.right) > 0) {
        steps.push(makeTreeStep({ root: cloneTree(this.root), highlighted: [node.value, node.right.value], path: [...path], rotations: 'RL', description: `BF=${bf} at ${node.value} after delete (RL). RL Rotation.`, operation: 'rotate' }));
        node.right = avlRotateRight(node.right);
        const r = avlRotateLeft(node);
        steps.push(makeTreeStep({ root: cloneTree(this.root), highlighted: [r.value], path: [...path], description: `RL rotation done. New subtree root: ${r.value}.`, operation: 'rotate' }));
        return r;
      }

      return node;
    };

    this.root = deleteRec(this.root, value, []);

    steps.push(makeTreeStep({
      root: cloneTree(this.root),
      highlighted: [],
      path: [],
      description: `Delete ${value} complete.`,
      operation: 'delete',
    }));

    return steps;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// RED-BLACK TREE
// ════════════════════════════════════════════════════════════════════════════════

const RED = 'red';
const BLACK = 'black';

function rbNewNode(value) {
  return { value, left: null, right: null, height: 1, color: RED, bf: 0 };
}

function rbIsRed(node) {
  return node !== null && node.color === RED;
}

export class RedBlackTree {
  constructor() {
    this.root = null;
    this._steps = [];
  }

  // ── Rotations ─────────────────────────────────────────────────────────────

  _rotateLeft(h) {
    const x = h.right;
    h.right = x.left;
    x.left = h;
    x.color = h.color;
    h.color = RED;
    return x;
  }

  _rotateRight(h) {
    const x = h.left;
    h.left = x.right;
    x.right = h;
    x.color = h.color;
    h.color = RED;
    return x;
  }

  _flipColors(h) {
    h.color = h.color === RED ? BLACK : RED;
    if (h.left) h.left.color = h.left.color === RED ? BLACK : RED;
    if (h.right) h.right.color = h.right.color === RED ? BLACK : RED;
  }

  // ── Insert ────────────────────────────────────────────────────────────────

  insert(value) {
    this._steps = [];

    this._steps.push(makeTreeStep({
      root: cloneTree(this.root),
      highlighted: [],
      path: [],
      description: `Insert ${value} into Red-Black Tree. New node starts RED.`,
      operation: 'insert',
    }));

    this.root = this._rbInsert(this.root, value, []);
    this.root.color = BLACK;

    this._steps.push(makeTreeStep({
      root: cloneTree(this.root),
      highlighted: [this.root.value],
      path: [],
      recolored: [this.root.value],
      description: `Root must be BLACK. Color root (${this.root.value}) black.`,
      operation: 'insert',
    }));

    this._steps.push(makeTreeStep({
      root: cloneTree(this.root),
      highlighted: [],
      path: [],
      description: `Insert ${value} complete. All RB properties maintained.`,
      operation: 'insert',
    }));

    return this._steps;
  }

  _rbInsert(node, value, path) {
    if (!node) {
      const n = rbNewNode(value);
      this._steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [value],
        path: [...path],
        recolored: [value],
        description: `Place new RED node ${value}.`,
        operation: 'insert',
      }));
      return n;
    }

    path.push(node.value);

    if (value < node.value) {
      this._steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value],
        path: [...path],
        description: `${value} < ${node.value}: go left.`,
        operation: 'insert',
      }));
      node.left = this._rbInsert(node.left, value, path);
    } else if (value > node.value) {
      this._steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value],
        path: [...path],
        description: `${value} > ${node.value}: go right.`,
        operation: 'insert',
      }));
      node.right = this._rbInsert(node.right, value, path);
    } else {
      this._steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value],
        path: [...path],
        description: `${value} == ${node.value}: duplicate, skip.`,
        operation: 'insert',
      }));
      path.pop();
      return node;
    }

    path.pop();

    // Fix-up: Lean-left Red-Black (Sedgewick's LLRB)
    // Case 1: Right child red, left child black → left-lean: rotate left
    if (rbIsRed(node.right) && !rbIsRed(node.left)) {
      this._steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value, node.right?.value],
        path: [...path],
        rotations: 'RR',
        description: `Fix: right-leaning red link at ${node.value}. Left-rotate to lean left.`,
        operation: 'rotate',
      }));
      node = this._rotateLeft(node);
      this._steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value],
        path: [...path],
        description: `After left rotation: new subtree root ${node.value}.`,
        operation: 'rotate',
      }));
    }

    // Case 2: Left child red, left-left grandchild red → rotate right
    if (rbIsRed(node.left) && rbIsRed(node.left?.left)) {
      this._steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value, node.left?.value],
        path: [...path],
        rotations: 'LL',
        description: `Fix: two consecutive left red links at ${node.value}. Right-rotate.`,
        operation: 'rotate',
      }));
      node = this._rotateRight(node);
      this._steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value],
        path: [...path],
        description: `After right rotation: new subtree root ${node.value}.`,
        operation: 'rotate',
      }));
    }

    // Case 3: Both children red → flip colors (split 4-node)
    if (rbIsRed(node.left) && rbIsRed(node.right)) {
      this._steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value, node.left?.value, node.right?.value].filter(Boolean),
        path: [...path],
        recolored: [node.value, node.left?.value, node.right?.value].filter(Boolean),
        description: `Fix: both children of ${node.value} are RED. Flip colors (split 4-node).`,
        operation: 'insert',
      }));
      this._flipColors(node);
      this._steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value],
        path: [...path],
        description: `After color flip: ${node.value}=RED, children=BLACK.`,
        operation: 'insert',
      }));
    }

    return node;
  }

  // ── Search ────────────────────────────────────────────────────────────────

  search(value) {
    const steps = [];
    const path = [];
    let node = this.root;

    steps.push(makeTreeStep({
      root: cloneTree(this.root),
      highlighted: [],
      path: [],
      description: `Search for ${value} in Red-Black Tree.`,
      operation: 'search',
    }));

    while (node) {
      path.push(node.value);
      if (value === node.value) {
        steps.push(makeTreeStep({
          root: cloneTree(this.root),
          highlighted: [node.value],
          path: [...path],
          description: `Found ${value} (color: ${node.color})!`,
          operation: 'search',
        }));
        return steps;
      }
      steps.push(makeTreeStep({
        root: cloneTree(this.root),
        highlighted: [node.value],
        path: [...path],
        description: `${value} ${value < node.value ? '<' : '>'} ${node.value} (${node.color}): go ${value < node.value ? 'left' : 'right'}.`,
        operation: 'search',
      }));
      node = value < node.value ? node.left : node.right;
    }

    steps.push(makeTreeStep({
      root: cloneTree(this.root),
      highlighted: [],
      path: [...path],
      description: `${value} not found in Red-Black Tree.`,
      operation: 'search',
    }));

    return steps;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// STACK OPERATIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * stackOperations(operations)
 * operations: [{ type: 'push', value: 5 }, { type: 'pop' }, { type: 'peek' }]
 * Returns array of steps, each showing the full stack state.
 */
export function stackOperations(operations) {
  const steps = [];
  const stack = [];

  steps.push({
    structure: 'stack',
    items: [...stack],
    highlighted: [],
    operation: null,
    operationValue: null,
    description: 'Stack initialized (empty).',
    result: null,
  });

  for (const op of operations) {
    if (op.type === 'push') {
      stack.push(op.value);
      steps.push({
        structure: 'stack',
        items: [...stack],
        highlighted: [op.value],
        operation: 'push',
        operationValue: op.value,
        description: `Push ${op.value} onto stack. Top: ${stack[stack.length - 1]}. Size: ${stack.length}.`,
        result: op.value,
      });
    } else if (op.type === 'pop') {
      if (stack.length === 0) {
        steps.push({
          structure: 'stack',
          items: [...stack],
          highlighted: [],
          operation: 'pop',
          operationValue: null,
          description: 'Pop: stack is empty — underflow!',
          result: null,
        });
      } else {
        const popped = stack.pop();
        steps.push({
          structure: 'stack',
          items: [...stack],
          highlighted: [],
          operation: 'pop',
          operationValue: popped,
          description: `Pop: removed ${popped} from top. New top: ${stack.length > 0 ? stack[stack.length - 1] : 'none'}. Size: ${stack.length}.`,
          result: popped,
        });
      }
    } else if (op.type === 'peek') {
      const top = stack.length > 0 ? stack[stack.length - 1] : null;
      steps.push({
        structure: 'stack',
        items: [...stack],
        highlighted: top !== null ? [top] : [],
        operation: 'peek',
        operationValue: top,
        description: `Peek: top element is ${top !== null ? top : 'none (empty stack)'}.`,
        result: top,
      });
    } else if (op.type === 'clear') {
      stack.length = 0;
      steps.push({
        structure: 'stack',
        items: [],
        highlighted: [],
        operation: 'clear',
        operationValue: null,
        description: 'Clear: stack emptied.',
        result: null,
      });
    }
  }

  return steps;
}

// ════════════════════════════════════════════════════════════════════════════════
// QUEUE OPERATIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * queueOperations(operations)
 * operations: [{ type: 'enqueue', value: 5 }, { type: 'dequeue' }, { type: 'front' }]
 */
export function queueOperations(operations) {
  const steps = [];
  const queue = [];

  steps.push({
    structure: 'queue',
    items: [...queue],
    highlighted: [],
    operation: null,
    operationValue: null,
    description: 'Queue initialized (empty). Front ← items → Rear.',
    result: null,
  });

  for (const op of operations) {
    if (op.type === 'enqueue') {
      queue.push(op.value);
      steps.push({
        structure: 'queue',
        items: [...queue],
        highlighted: [op.value],
        operation: 'enqueue',
        operationValue: op.value,
        description: `Enqueue ${op.value} at rear. Queue: [${queue.join(', ')}]. Size: ${queue.length}.`,
        result: op.value,
      });
    } else if (op.type === 'dequeue') {
      if (queue.length === 0) {
        steps.push({
          structure: 'queue',
          items: [],
          highlighted: [],
          operation: 'dequeue',
          operationValue: null,
          description: 'Dequeue: queue is empty — underflow!',
          result: null,
        });
      } else {
        const dequeued = queue.shift();
        steps.push({
          structure: 'queue',
          items: [...queue],
          highlighted: [],
          operation: 'dequeue',
          operationValue: dequeued,
          description: `Dequeue: removed ${dequeued} from front. Queue: [${queue.join(', ')}]. Size: ${queue.length}.`,
          result: dequeued,
        });
      }
    } else if (op.type === 'front') {
      const front = queue.length > 0 ? queue[0] : null;
      steps.push({
        structure: 'queue',
        items: [...queue],
        highlighted: front !== null ? [front] : [],
        operation: 'front',
        operationValue: front,
        description: `Front: ${front !== null ? front : 'none (queue empty)'}.`,
        result: front,
      });
    } else if (op.type === 'clear') {
      queue.length = 0;
      steps.push({
        structure: 'queue',
        items: [],
        highlighted: [],
        operation: 'clear',
        operationValue: null,
        description: 'Clear: queue emptied.',
        result: null,
      });
    }
  }

  return steps;
}

// ════════════════════════════════════════════════════════════════════════════════
// LINKED LIST OPERATIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * linkedListOperations(operations)
 * operations: [{ type: 'insert', value, position? }, { type: 'delete', value }, { type: 'search', value }]
 * position: 'head' | 'tail' | index (default 'tail')
 */
export function linkedListOperations(operations) {
  const steps = [];
  // Internal list as array of node objects
  let list = [];

  function listSnapshot() {
    return list.map(n => ({ value: n.value }));
  }

  steps.push({
    structure: 'linkedlist',
    nodes: listSnapshot(),
    highlighted: [],
    operation: null,
    operationValue: null,
    description: 'Linked List initialized (empty). HEAD → NULL.',
    result: null,
  });

  for (const op of operations) {
    if (op.type === 'insert') {
      const val = op.value;
      const pos = op.position ?? 'tail';

      if (pos === 'head') {
        list.unshift({ value: val });
        steps.push({
          structure: 'linkedlist',
          nodes: listSnapshot(),
          highlighted: [0],
          operation: 'insert',
          operationValue: val,
          description: `Insert ${val} at head. List: ${list.map(n => n.value).join(' → ')} → NULL.`,
          result: val,
        });
      } else if (pos === 'tail') {
        list.push({ value: val });
        steps.push({
          structure: 'linkedlist',
          nodes: listSnapshot(),
          highlighted: [list.length - 1],
          operation: 'insert',
          operationValue: val,
          description: `Insert ${val} at tail. List: ${list.map(n => n.value).join(' → ')} → NULL.`,
          result: val,
        });
      } else {
        // Traverse to position
        const idx = Math.min(Number(pos), list.length);
        for (let i = 0; i < idx; i++) {
          steps.push({
            structure: 'linkedlist',
            nodes: listSnapshot(),
            highlighted: [i],
            operation: 'insert',
            operationValue: val,
            description: `Traversing to position ${idx}: currently at index ${i} (value=${list[i].value}).`,
            result: null,
          });
        }
        list.splice(idx, 0, { value: val });
        steps.push({
          structure: 'linkedlist',
          nodes: listSnapshot(),
          highlighted: [idx],
          operation: 'insert',
          operationValue: val,
          description: `Insert ${val} at index ${idx}. List: ${list.map(n => n.value).join(' → ')} → NULL.`,
          result: val,
        });
      }
    } else if (op.type === 'delete') {
      const val = op.value;
      let found = false;
      for (let i = 0; i < list.length; i++) {
        steps.push({
          structure: 'linkedlist',
          nodes: listSnapshot(),
          highlighted: [i],
          operation: 'delete',
          operationValue: val,
          description: `Delete ${val}: checking index ${i} (value=${list[i].value}).${list[i].value === val ? ' Match found!' : ' Not a match, continue.'}`,
          result: null,
        });
        if (list[i].value === val) {
          list.splice(i, 1);
          found = true;
          steps.push({
            structure: 'linkedlist',
            nodes: listSnapshot(),
            highlighted: [],
            operation: 'delete',
            operationValue: val,
            description: `Deleted node with value ${val}. List: ${list.length > 0 ? list.map(n => n.value).join(' → ') + ' → NULL' : 'NULL (empty)'}.`,
            result: val,
          });
          break;
        }
      }
      if (!found) {
        steps.push({
          structure: 'linkedlist',
          nodes: listSnapshot(),
          highlighted: [],
          operation: 'delete',
          operationValue: val,
          description: `${val} not found in list — nothing to delete.`,
          result: null,
        });
      }
    } else if (op.type === 'search') {
      const val = op.value;
      let found = false;
      for (let i = 0; i < list.length; i++) {
        steps.push({
          structure: 'linkedlist',
          nodes: listSnapshot(),
          highlighted: [i],
          operation: 'search',
          operationValue: val,
          description: `Search ${val}: checking index ${i} (value=${list[i].value}).${list[i].value === val ? ' Found!' : ''}`,
          result: null,
        });
        if (list[i].value === val) {
          found = true;
          steps.push({
            structure: 'linkedlist',
            nodes: listSnapshot(),
            highlighted: [i],
            operation: 'search',
            operationValue: val,
            description: `Found ${val} at index ${i}!`,
            result: i,
          });
          break;
        }
      }
      if (!found) {
        steps.push({
          structure: 'linkedlist',
          nodes: listSnapshot(),
          highlighted: [],
          operation: 'search',
          operationValue: val,
          description: `${val} not found in linked list.`,
          result: -1,
        });
      }
    } else if (op.type === 'reverse') {
      steps.push({
        structure: 'linkedlist',
        nodes: listSnapshot(),
        highlighted: [],
        operation: 'reverse',
        operationValue: null,
        description: `Reversing linked list...`,
        result: null,
      });
      list.reverse();
      steps.push({
        structure: 'linkedlist',
        nodes: listSnapshot(),
        highlighted: list.map((_, i) => i),
        operation: 'reverse',
        operationValue: null,
        description: `Reversed. List: ${list.map(n => n.value).join(' → ')} → NULL.`,
        result: null,
      });
    }
  }

  return steps;
}

// ════════════════════════════════════════════════════════════════════════════════
// HASH TABLE OPERATIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * hashTableOperations(operations, tableSize=16)
 * operations: [{ type: 'set', key, value }, { type: 'get', key }, { type: 'delete', key }]
 * Uses separate chaining (array of arrays).
 */
export function hashTableOperations(operations, tableSize = 16) {
  const steps = [];
  // table: array of tableSize buckets, each bucket is an array of { key, value }
  const table = Array.from({ length: tableSize }, () => []);

  function hashFn(key) {
    // Simple polynomial rolling hash
    let h = 0;
    const str = String(key);
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) % tableSize;
    }
    return h;
  }

  function tableSnapshot() {
    return table.map(bucket => bucket.map(entry => ({ ...entry })));
  }

  steps.push({
    structure: 'hashtable',
    table: tableSnapshot(),
    tableSize,
    highlighted: { bucket: null, index: null },
    operation: null,
    key: null,
    value: null,
    description: `Hash Table initialized. Size: ${tableSize} buckets. Using separate chaining. Hash fn: h(key) = Σ(charCode × 31^i) mod ${tableSize}.`,
    result: null,
  });

  for (const op of operations) {
    const key = op.key;
    const bucket = hashFn(key);

    if (op.type === 'set') {
      steps.push({
        structure: 'hashtable',
        table: tableSnapshot(),
        tableSize,
        highlighted: { bucket, index: null },
        operation: 'set',
        key,
        value: op.value,
        description: `SET key="${key}": hash("${key}") = ${bucket}. Go to bucket ${bucket}.`,
        result: null,
      });

      const existing = table[bucket].findIndex(e => e.key === key);
      if (existing !== -1) {
        const old = table[bucket][existing].value;
        table[bucket][existing].value = op.value;
        steps.push({
          structure: 'hashtable',
          table: tableSnapshot(),
          tableSize,
          highlighted: { bucket, index: existing },
          operation: 'set',
          key,
          value: op.value,
          description: `Key "${key}" already in bucket ${bucket} (index ${existing}). Update value: ${old} → ${op.value}.`,
          result: 'updated',
        });
      } else {
        table[bucket].push({ key, value: op.value });
        steps.push({
          structure: 'hashtable',
          table: tableSnapshot(),
          tableSize,
          highlighted: { bucket, index: table[bucket].length - 1 },
          operation: 'set',
          key,
          value: op.value,
          description: `Key "${key}" not found. Insert { "${key}": ${op.value} } into bucket ${bucket}. Bucket size: ${table[bucket].length}.`,
          result: 'inserted',
        });
      }
    } else if (op.type === 'get') {
      steps.push({
        structure: 'hashtable',
        table: tableSnapshot(),
        tableSize,
        highlighted: { bucket, index: null },
        operation: 'get',
        key,
        value: null,
        description: `GET key="${key}": hash("${key}") = ${bucket}. Search bucket ${bucket} (${table[bucket].length} entries).`,
        result: null,
      });

      let found = null;
      for (let i = 0; i < table[bucket].length; i++) {
        const entry = table[bucket][i];
        const match = entry.key === key;
        steps.push({
          structure: 'hashtable',
          table: tableSnapshot(),
          tableSize,
          highlighted: { bucket, index: i },
          operation: 'get',
          key,
          value: match ? entry.value : null,
          description: `Bucket ${bucket}[${i}]: key="${entry.key}" ${match ? `== "${key}" ✓ Found! Value: ${entry.value}` : `!= "${key}", continue.`}`,
          result: match ? entry.value : null,
        });
        if (match) { found = entry.value; break; }
      }

      if (found === null && table[bucket].every(e => e.key !== key)) {
        steps.push({
          structure: 'hashtable',
          table: tableSnapshot(),
          tableSize,
          highlighted: { bucket, index: null },
          operation: 'get',
          key,
          value: null,
          description: `Key "${key}" not found in bucket ${bucket}.`,
          result: undefined,
        });
      }
    } else if (op.type === 'delete') {
      steps.push({
        structure: 'hashtable',
        table: tableSnapshot(),
        tableSize,
        highlighted: { bucket, index: null },
        operation: 'delete',
        key,
        value: null,
        description: `DELETE key="${key}": hash("${key}") = ${bucket}. Search bucket ${bucket}.`,
        result: null,
      });

      const idx = table[bucket].findIndex(e => e.key === key);
      if (idx !== -1) {
        const deleted = table[bucket][idx];
        steps.push({
          structure: 'hashtable',
          table: tableSnapshot(),
          tableSize,
          highlighted: { bucket, index: idx },
          operation: 'delete',
          key,
          value: deleted.value,
          description: `Found "${key}" at bucket ${bucket}[${idx}] (value=${deleted.value}). Removing...`,
          result: null,
        });
        table[bucket].splice(idx, 1);
        steps.push({
          structure: 'hashtable',
          table: tableSnapshot(),
          tableSize,
          highlighted: { bucket, index: null },
          operation: 'delete',
          key,
          value: null,
          description: `Deleted "${key}" from bucket ${bucket}. Bucket now has ${table[bucket].length} entries.`,
          result: deleted.value,
        });
      } else {
        steps.push({
          structure: 'hashtable',
          table: tableSnapshot(),
          tableSize,
          highlighted: { bucket, index: null },
          operation: 'delete',
          key,
          value: null,
          description: `Key "${key}" not found in bucket ${bucket} — nothing to delete.`,
          result: null,
        });
      }
    }
  }

  return steps;
}

// ─── Algorithm Registries ─────────────────────────────────────────────────────

export const TREE_ALGORITHMS = {
  'avl-tree': {
    name: 'AVL Tree',
    class: AVLTree,
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(n)',
    description: 'A self-balancing BST where the height difference (balance factor) between left and right subtrees of any node is at most 1. Maintains balance via LL, RR, LR, RL rotations.',
    operations: ['insert', 'delete', 'search'],
  },
  'red-black-tree': {
    name: 'Red-Black Tree',
    class: RedBlackTree,
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(n)',
    description: 'A self-balancing BST where each node has a color (red or black). Enforces coloring rules to keep the tree approximately balanced. Used internally by most language standard libraries.',
    operations: ['insert', 'search'],
  },
};

export const DS_ALGORITHMS = {
  'stack': {
    name: 'Stack',
    fn: stackOperations,
    timeComplexity: 'O(1) push/pop',
    spaceComplexity: 'O(n)',
    description: 'Last-In First-Out (LIFO) data structure. Supports push, pop, and peek in O(1). Used in function call stacks, undo mechanisms, expression evaluation.',
    operations: ['push', 'pop', 'peek', 'clear'],
  },
  'queue': {
    name: 'Queue',
    fn: queueOperations,
    timeComplexity: 'O(1) enqueue/dequeue',
    spaceComplexity: 'O(n)',
    description: 'First-In First-Out (FIFO) data structure. Supports enqueue, dequeue, and front in O(1). Used in BFS, task scheduling, and buffering.',
    operations: ['enqueue', 'dequeue', 'front', 'clear'],
  },
  'linked-list': {
    name: 'Linked List',
    fn: linkedListOperations,
    timeComplexity: 'O(1) insert at head, O(n) search/delete',
    spaceComplexity: 'O(n)',
    description: 'A sequential data structure where each node points to the next. O(1) insertion at head, O(n) random access. Useful when frequent insertions/deletions at known positions are needed.',
    operations: ['insert', 'delete', 'search', 'reverse'],
  },
  'hash-table': {
    name: 'Hash Table',
    fn: hashTableOperations,
    timeComplexity: 'O(1) avg set/get/delete',
    spaceComplexity: 'O(n)',
    description: 'Key-value store using a hash function to map keys to buckets. Handles collisions via separate chaining. O(1) average-case operations, O(n) worst-case.',
    operations: ['set', 'get', 'delete'],
  },
};
