/**
 * canvas-renderer.js
 * HTML5 Canvas rendering engine for AlViz (Algorithm Visualizer).
 * Handles sorting, searching, graph, tree, and data-structure visualizations.
 */

const COLORS = {
  primary:    '#6366f1',
  secondary:  '#8b5cf6',
  accent:     '#06b6d4',
  success:    '#22c55e',
  warning:    '#eab308',
  danger:     '#ef4444',
  orange:     '#f97316',
  bg:         '#0f172a',
  surface:    '#1e293b',
  surface2:   '#334155',
  text:       '#f1f5f9',
  textMuted:  '#94a3b8',
};

// Speed map: delay in ms per step (index = speed 1-10)
const SPEED_DELAYS = [null, 1000, 800, 600, 450, 320, 220, 150, 100, 70, 50];

export class CanvasRenderer {
  /**
   * @param {string} canvasId - ID of the <canvas> element
   */
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) throw new Error(`Canvas element with id "${canvasId}" not found.`);
    this.ctx = this.canvas.getContext('2d');
    this._mode = 'sorting';
    this._dpr = window.devicePixelRatio || 1;

    this.resize();

    // Re-resize on window resize
    this._resizeHandler = () => this.resize();
    window.addEventListener('resize', this._resizeHandler);
  }

  // ─────────────────────────────────────────────
  // Core
  // ─────────────────────────────────────────────

  /** Clear the entire canvas. */
  clear() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Fill background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /** Resize canvas to match its CSS container, respecting HiDPI. */
  resize() {
    const { canvas, ctx } = this;
    const container = canvas.parentElement || document.body;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this._dpr = dpr;

    const cssW = rect.width  || container.offsetWidth  || 800;
    const cssH = rect.height || container.offsetHeight || 600;

    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width  = cssW + 'px';
    canvas.style.height = cssH + 'px';

    ctx.scale(dpr, dpr);
    this._cssWidth  = cssW;
    this._cssHeight = cssH;
  }

  /** @returns {'sorting'|'searching'|'graph'|'tree'|'ds'} */
  getRenderMode() { return this._mode; }

  /** @param {'sorting'|'searching'|'graph'|'tree'|'ds'} mode */
  setRenderMode(mode) { this._mode = mode; }

  // ─────────────────────────────────────────────
  // SORTING VISUALIZATIONS
  // ─────────────────────────────────────────────

  /**
   * Draw a sorting step as a vertical bar chart.
   * @param {{ array: number[], comparing?: number[], swapping?: number[], sorted?: number[], pivot?: number, description?: string, pointers?: Object }} step
   * @param {string} algorithm
   */
  drawSortingStep(step, algorithm) {
    this.clear();
    const { ctx } = this;
    const W = this._cssWidth;
    const H = this._cssHeight;

    const arr = step.array || [];
    if (!arr.length) return;

    const comparing = new Set(step.comparing || []);
    const swapping  = new Set(step.swapping  || []);
    const sorted    = new Set(step.sorted    || []);
    const pivotIdx  = step.pivot != null ? step.pivot : -1;

    const n       = arr.length;
    const max     = Math.max(...arr, 1);
    const padding = { top: 40, bottom: 50, left: 20, right: 20 };
    const availW  = W - padding.left - padding.right;
    const availH  = H - padding.top  - padding.bottom;
    const barW    = availW / n;
    const showLabels = n <= 50;

    for (let i = 0; i < n; i++) {
      const val    = arr[i];
      const barH   = (val / max) * availH;
      const x      = padding.left + i * barW;
      const y      = padding.top  + (availH - barH);

      // Pick color
      let color = COLORS.primary;
      if (sorted.has(i))    color = COLORS.success;
      if (pivotIdx === i)   color = COLORS.secondary;
      if (comparing.has(i)) color = COLORS.warning;
      if (swapping.has(i))  color = COLORS.orange;

      // Bar
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = color;
      const gap = Math.max(1, barW * 0.08);
      ctx.fillRect(x + gap / 2, y, barW - gap, barH);
      ctx.globalAlpha = 1;

      // Value label on top of bar
      if (showLabels) {
        this.drawText(x + barW / 2, y - 4, String(val), {
          size: Math.max(9, Math.min(13, Math.floor(barW * 0.6))),
          color: COLORS.textMuted,
          align: 'center',
          baseline: 'bottom',
        });
      }

      // Index label at bottom
      if (showLabels || n <= 30) {
        this.drawText(x + barW / 2, H - padding.bottom + 6, String(i), {
          size: Math.max(8, Math.min(11, Math.floor(barW * 0.5))),
          color: COLORS.textMuted,
          align: 'center',
          baseline: 'top',
        });
      }
    }

    // Description
    if (step.description) {
      this.drawText(W / 2, 16, step.description, {
        size: 13,
        color: COLORS.text,
        align: 'center',
        baseline: 'middle',
      });
    }

    // Legend
    this._drawSortingLegend(W, H);
  }

  /** @private */
  _drawSortingLegend(W, H) {
    const items = [
      { color: COLORS.primary,   label: 'Default' },
      { color: COLORS.warning,   label: 'Comparing' },
      { color: COLORS.orange,    label: 'Swapping' },
      { color: COLORS.success,   label: 'Sorted' },
      { color: COLORS.secondary, label: 'Pivot' },
    ];
    let lx = 20;
    const ly = H - 16;
    items.forEach(({ color, label }) => {
      const { ctx } = this;
      ctx.fillStyle = color;
      ctx.fillRect(lx, ly - 7, 12, 12);
      this.drawText(lx + 16, ly, label, { size: 11, color: COLORS.textMuted, align: 'left', baseline: 'middle' });
      lx += label.length * 7 + 24;
    });
  }

  // ─────────────────────────────────────────────
  // SEARCHING VISUALIZATIONS
  // ─────────────────────────────────────────────

  /**
   * Draw a searching step.
   * @param {{ array: number[], found?: number, eliminated?: number[], current?: number, mid?: number, left?: number, right?: number, description?: string }} step
   * @param {number} target
   */
  drawSearchingStep(step, target) {
    this.clear();
    const { ctx } = this;
    const W = this._cssWidth;
    const H = this._cssHeight;

    const arr = step.array || [];
    if (!arr.length) return;

    const eliminated = new Set(step.eliminated || []);
    const n       = arr.length;
    const max     = Math.max(...arr, 1);
    const padding = { top: 50, bottom: 60, left: 20, right: 20 };
    const availW  = W - padding.left - padding.right;
    const availH  = H - padding.top  - padding.bottom;
    const barW    = availW / n;
    const showLabels = n <= 50;

    for (let i = 0; i < n; i++) {
      const val  = arr[i];
      const barH = (val / max) * availH;
      const x    = padding.left + i * barW;
      const y    = padding.top  + (availH - barH);

      let color = COLORS.primary;
      if (eliminated.has(i))   color = COLORS.surface2;
      if (step.current === i)  color = COLORS.warning;
      if (step.found === i)    color = COLORS.success;

      const gap = Math.max(1, barW * 0.08);
      ctx.globalAlpha = eliminated.has(i) ? 0.4 : 0.9;
      ctx.fillStyle = color;
      ctx.fillRect(x + gap / 2, y, barW - gap, barH);
      ctx.globalAlpha = 1;

      // Glow on found
      if (step.found === i) {
        this.drawGlow(x + barW / 2, y + barH / 2, Math.max(barW, barH) / 2 + 10, COLORS.success);
      }

      // Value label
      if (showLabels) {
        this.drawText(x + barW / 2, y - 4, String(val), {
          size: Math.max(9, Math.min(13, Math.floor(barW * 0.6))),
          color: COLORS.textMuted,
          align: 'center',
          baseline: 'bottom',
        });
      }

      // Index label
      if (showLabels) {
        this.drawText(x + barW / 2, H - padding.bottom + 6, String(i), {
          size: Math.max(8, Math.min(11, Math.floor(barW * 0.5))),
          color: COLORS.textMuted,
          align: 'center',
          baseline: 'top',
        });
      }
    }

    // Mid pointer triangle
    if (step.mid != null && step.mid >= 0 && step.mid < n) {
      const mx = padding.left + step.mid * barW + barW / 2;
      const my = padding.top - 8;
      ctx.fillStyle = COLORS.accent;
      ctx.beginPath();
      ctx.moveTo(mx, my + 10);
      ctx.lineTo(mx - 7, my);
      ctx.lineTo(mx + 7, my);
      ctx.closePath();
      ctx.fill();
      this.drawText(mx, my - 4, 'mid', { size: 10, color: COLORS.accent, align: 'center', baseline: 'bottom' });
    }

    // Left boundary dashed line
    if (step.left != null && step.left >= 0 && step.left < n) {
      const lx = padding.left + step.left * barW;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = COLORS.warning;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, padding.top);
      ctx.lineTo(lx, padding.top + availH);
      ctx.stroke();
      ctx.restore();
      this.drawText(lx + 2, padding.top + 2, 'L', { size: 10, color: COLORS.warning, align: 'left', baseline: 'top' });
    }

    // Right boundary dashed line
    if (step.right != null && step.right >= 0 && step.right < n) {
      const rx = padding.left + (step.right + 1) * barW;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = COLORS.danger;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx, padding.top);
      ctx.lineTo(rx, padding.top + availH);
      ctx.stroke();
      ctx.restore();
      this.drawText(rx - 2, padding.top + 2, 'R', { size: 10, color: COLORS.danger, align: 'right', baseline: 'top' });
    }

    // Target label
    this.drawText(W / 2, 16, `Target: ${target}`, {
      size: 13, color: COLORS.text, align: 'center', baseline: 'middle',
    });

    // Description
    if (step.description) {
      this.drawText(W / 2, 32, step.description, {
        size: 12, color: COLORS.textMuted, align: 'center', baseline: 'middle',
      });
    }
  }

  // ─────────────────────────────────────────────
  // GRAPH VISUALIZATIONS
  // ─────────────────────────────────────────────

  /**
   * Draw a graph traversal/algorithm step.
   * @param {{ graph: { nodes: Array, edges: Array, directed?: boolean }, visitedNodes?: number[], currentNode?: number, frontier?: number[], visitedEdges?: Array, treeEdges?: Array, distances?: Object, description?: string }} step
   */
  drawGraphStep(step) {
    this.clear();
    const { ctx } = this;
    const W = this._cssWidth;
    const H = this._cssHeight;

    const graph = step.graph || { nodes: [], edges: [] };
    const nodes = graph.nodes || [];
    const edges = graph.edges || [];
    const directed = !!graph.directed;

    const visitedNodes = new Set(step.visitedNodes || []);
    const frontier     = new Set(step.frontier     || []);
    const visitedEdges = new Set((step.visitedEdges || []).map(e => `${e[0]}-${e[1]}`));
    const treeEdges    = new Set((step.treeEdges   || []).map(e => `${e[0]}-${e[1]}`));
    const distances    = step.distances || {};
    const currentNode  = step.currentNode;

    // Assign positions if not given
    const positions = this._computeGraphPositions(nodes, W, H);

    const NODE_R = Math.max(16, Math.min(28, Math.floor(Math.min(W, H) / (nodes.length + 4))));

    // Draw edges first
    edges.forEach(edge => {
      const { from, to, weight } = edge;
      const p1 = positions[from];
      const p2 = positions[to];
      if (!p1 || !p2) return;

      const edgeKey    = `${from}-${to}`;
      const edgeKeyRev = `${to}-${from}`;
      let color = COLORS.surface2;
      if (treeEdges.has(edgeKey) || treeEdges.has(edgeKeyRev))    color = COLORS.success;
      else if (visitedEdges.has(edgeKey) || visitedEdges.has(edgeKeyRev)) color = COLORS.primary;

      ctx.strokeStyle = color;
      ctx.lineWidth   = treeEdges.has(edgeKey) || treeEdges.has(edgeKeyRev) ? 3 : 2;

      if (from === to) {
        // Self-loop
        ctx.beginPath();
        ctx.arc(p1.x + NODE_R, p1.y - NODE_R, NODE_R * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        if (directed) {
          this._drawArrowHead(p1.x, p1.y, p2.x, p2.y, NODE_R, color);
        }
      }

      // Weight label
      if (weight != null) {
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(mx - 10, my - 8, 20, 16);
        this.drawText(mx, my, String(weight), { size: 11, color: COLORS.textMuted, align: 'center', baseline: 'middle' });
      }
    });

    // Draw nodes
    nodes.forEach((node, idx) => {
      const pos = positions[idx];
      if (!pos) return;

      let fillColor = COLORS.surface2;
      if (visitedNodes.has(idx)) fillColor = COLORS.primary;
      if (frontier.has(idx))     fillColor = COLORS.accent;
      if (currentNode === idx)   fillColor = COLORS.warning;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, NODE_R, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = COLORS.surface;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glow for current node
      if (currentNode === idx) {
        this.drawGlow(pos.x, pos.y, NODE_R + 8, COLORS.warning);
      }

      // Node label
      const label = node.label != null ? String(node.label) : String(idx);
      this.drawText(pos.x, pos.y, label, {
        size: Math.max(9, NODE_R * 0.7),
        color: COLORS.text,
        align: 'center',
        baseline: 'middle',
        bold: true,
      });

      // Distance label (Dijkstra)
      if (distances[idx] != null) {
        const dist = distances[idx] === Infinity ? '∞' : String(distances[idx]);
        this.drawText(pos.x, pos.y - NODE_R - 8, dist, {
          size: 11, color: COLORS.accent, align: 'center', baseline: 'bottom',
        });
      }
    });

    // Description
    if (step.description) {
      this.drawText(W / 2, 16, step.description, {
        size: 13, color: COLORS.text, align: 'center', baseline: 'middle',
      });
    }
  }

  /** Compute circular layout positions for graph nodes. @private */
  _computeGraphPositions(nodes, W, H) {
    const positions = [];
    const n = nodes.length;
    if (!n) return positions;

    // If nodes already carry x/y, use them
    const hasCoords = nodes[0] && nodes[0].x != null && nodes[0].y != null;
    if (hasCoords) {
      // Normalize to canvas
      const xs = nodes.map(n => n.x);
      const ys = nodes.map(n => n.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;
      const pad = 60;
      nodes.forEach(node => {
        positions.push({
          x: pad + ((node.x - minX) / rangeX) * (W - pad * 2),
          y: pad + ((node.y - minY) / rangeY) * (H - pad * 2),
        });
      });
      return positions;
    }

    // Circular layout
    const cx = W / 2, cy = H / 2;
    const r  = Math.min(W, H) / 2 - 60;
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      positions.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }
    return positions;
  }

  /** Draw an arrowhead at the end of a directed edge. @private */
  _drawArrowHead(x1, y1, x2, y2, nodeR, color) {
    const { ctx } = this;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const ex = x2 - nodeR * Math.cos(angle);
    const ey = y2 - nodeR * Math.sin(angle);
    const size = 10;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - size * Math.cos(angle - Math.PI / 7), ey - size * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(ex - size * Math.cos(angle + Math.PI / 7), ey - size * Math.sin(angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
  }

  // ─────────────────────────────────────────────
  // TREE VISUALIZATIONS
  // ─────────────────────────────────────────────

  /**
   * Draw a tree step (BST, AVL, Red-Black).
   * @param {{ root: Object, highlighted?: number[], path?: number[], rotations?: Object[], description?: string }} step
   */
  drawTreeStep(step) {
    this.clear();
    const W = this._cssWidth;
    const H = this._cssHeight;

    const root = step.root;
    if (!root) return;

    const highlighted = new Set(step.highlighted || []);
    const path        = new Set(step.path        || []);

    // Compute layout via level-order
    const layout = this._computeTreeLayout(root, W, H);

    // Draw edges
    layout.forEach(({ node, x, y, parentX, parentY }) => {
      if (parentX != null) {
        const { ctx } = this;
        ctx.strokeStyle = COLORS.surface2;
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.moveTo(parentX, parentY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    });

    const NODE_R = 18;

    // Draw nodes
    layout.forEach(({ node, x, y }) => {
      const { ctx } = this;
      const isHighlighted = highlighted.has(node.value);
      const isOnPath      = path.has(node.value);

      // Determine fill
      let fillColor = COLORS.surface;
      if (isOnPath)             fillColor = COLORS.primary;
      if (isHighlighted)        fillColor = COLORS.warning;
      if (node.color === 'red') fillColor = COLORS.danger;    // Red-Black
      if (node.color === 'black') fillColor = '#1a1a2e';       // Red-Black

      ctx.beginPath();
      ctx.arc(x, y, NODE_R, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = isHighlighted ? COLORS.warning : COLORS.primary;
      ctx.lineWidth   = 2;
      ctx.stroke();

      // Node value
      const textColor = node.color === 'red' ? COLORS.text : COLORS.text;
      this.drawText(x, y, String(node.value), {
        size: 12, color: textColor, align: 'center', baseline: 'middle', bold: true,
      });

      // AVL balance factor
      if (node.balanceFactor != null) {
        const bf = node.balanceFactor;
        const bfColor = bf === 0 ? COLORS.textMuted : (Math.abs(bf) > 1 ? COLORS.danger : COLORS.warning);
        this.drawText(x, y + NODE_R + 10, `bf:${bf}`, { size: 9, color: bfColor, align: 'center', baseline: 'top' });
      }
    });

    // Rotation arrows
    if (step.rotations && step.rotations.length) {
      const layoutMap = {};
      layout.forEach(item => { layoutMap[item.node.value] = { x: item.x, y: item.y }; });
      step.rotations.forEach(rot => {
        const p1 = layoutMap[rot.from];
        const p2 = layoutMap[rot.to];
        if (p1 && p2) {
          this.drawArrow(p1.x, p1.y, p2.x, p2.y, COLORS.orange);
        }
      });
    }

    // Description
    if (step.description) {
      this.drawText(W / 2, 16, step.description, {
        size: 13, color: COLORS.text, align: 'center', baseline: 'middle',
      });
    }
  }

  /**
   * Compute (x, y) positions for all tree nodes via level-order BFS.
   * Returns array of { node, x, y, parentX, parentY }.
   * @private
   */
  _computeTreeLayout(root, W, H) {
    const result = [];
    const queue  = [{ node: root, depth: 0, offset: 0, parentX: null, parentY: null }];
    const depths  = {};

    // First pass: count nodes per depth to compute spacing
    const countQueue = [{ node: root, depth: 0 }];
    while (countQueue.length) {
      const { node, depth } = countQueue.shift();
      depths[depth] = (depths[depth] || 0) + 1;
      if (node.left)  countQueue.push({ node: node.left,  depth: depth + 1 });
      if (node.right) countQueue.push({ node: node.right, depth: depth + 1 });
    }

    const maxDepth = Math.max(...Object.keys(depths).map(Number));
    const levelH   = Math.min((H - 60) / (maxDepth + 1), 70);

    // Second pass: assign x positions
    // Use in-order traversal index for x
    const inOrder = [];
    const inOrderTraverse = (node) => {
      if (!node) return;
      inOrderTraverse(node.left);
      inOrder.push(node);
      inOrderTraverse(node.right);
    };
    inOrderTraverse(root);

    const indexMap = new Map();
    inOrder.forEach((node, i) => indexMap.set(node, i));

    const totalNodes = inOrder.length;
    const pad = 40;
    const xStep = (W - pad * 2) / Math.max(totalNodes - 1, 1);

    const posMap = new Map();
    const assign = (node, depth, parentNode) => {
      if (!node) return;
      const idx = indexMap.get(node);
      const x   = totalNodes === 1 ? W / 2 : pad + idx * xStep;
      const y   = 50 + depth * levelH;
      const parentPos = parentNode ? posMap.get(parentNode) : null;
      posMap.set(node, { x, y });
      result.push({ node, x, y, parentX: parentPos ? parentPos.x : null, parentY: parentPos ? parentPos.y : null });
      assign(node.left,  depth + 1, node);
      assign(node.right, depth + 1, node);
    };
    assign(root, 0, null);

    return result;
  }

  // ─────────────────────────────────────────────
  // DATA STRUCTURE VISUALIZATIONS
  // ─────────────────────────────────────────────

  /**
   * Draw a stack step.
   * @param {{ stack: any[], top?: number, highlighted?: number, description?: string }} step
   */
  drawStackStep(step) {
    this.clear();
    const { ctx } = this;
    const W = this._cssWidth;
    const H = this._cssHeight;

    const stack = step.stack || [];
    const BOX_W = 120, BOX_H = 44, GAP = 4;
    const startX = W / 2 - BOX_W / 2;
    const baseY  = H - 60;

    stack.forEach((val, i) => {
      const y    = baseY - i * (BOX_H + GAP);
      const isTop = i === stack.length - 1;

      ctx.fillStyle   = isTop ? COLORS.primary : COLORS.surface;
      ctx.strokeStyle = COLORS.surface2;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.roundRect(startX, y - BOX_H, BOX_W, BOX_H, 6);
      ctx.fill();
      ctx.stroke();

      this.drawText(startX + BOX_W / 2, y - BOX_H / 2, String(val), {
        size: 14, color: COLORS.text, align: 'center', baseline: 'middle', bold: isTop,
      });

      // TOP arrow
      if (isTop) {
        const ax = startX + BOX_W + 20;
        const ay = y - BOX_H / 2;
        this.drawArrow(ax + 40, ay, ax + 2, ay, COLORS.warning);
        this.drawText(ax + 50, ay, 'TOP', { size: 11, color: COLORS.warning, align: 'left', baseline: 'middle' });
      }
    });

    // Base plate
    ctx.fillStyle = COLORS.surface2;
    ctx.fillRect(startX - 4, baseY, BOX_W + 8, 6);

    if (step.description) {
      this.drawText(W / 2, 20, step.description, { size: 13, color: COLORS.text, align: 'center', baseline: 'middle' });
    }
  }

  /**
   * Draw a queue step.
   * @param {{ queue: any[], front?: number, rear?: number, description?: string }} step
   */
  drawQueueStep(step) {
    this.clear();
    const { ctx } = this;
    const W = this._cssWidth;
    const H = this._cssHeight;

    const queue = step.queue || [];
    const BOX_W = Math.min(90, Math.max(50, (W - 120) / Math.max(queue.length, 1) - 6));
    const BOX_H = 50;
    const GAP   = 4;
    const totalW = queue.length * (BOX_W + GAP);
    let startX = W / 2 - totalW / 2;
    const y    = H / 2 - BOX_H / 2;

    queue.forEach((val, i) => {
      const x       = startX + i * (BOX_W + GAP);
      const isFront = i === 0;
      const isRear  = i === queue.length - 1;

      ctx.fillStyle   = isFront ? COLORS.accent : (isRear ? COLORS.primary : COLORS.surface);
      ctx.strokeStyle = COLORS.surface2;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, BOX_W, BOX_H, 6);
      ctx.fill();
      ctx.stroke();

      this.drawText(x + BOX_W / 2, y + BOX_H / 2, String(val), {
        size: 13, color: COLORS.text, align: 'center', baseline: 'middle',
      });

      // Pointers
      if (isFront) {
        this.drawArrow(x + BOX_W / 2, y - 8, x + BOX_W / 2, y - 28, COLORS.accent);
        this.drawText(x + BOX_W / 2, y - 32, 'FRONT', { size: 10, color: COLORS.accent, align: 'center', baseline: 'bottom' });
      }
      if (isRear && queue.length > 1) {
        this.drawArrow(x + BOX_W / 2, y + BOX_H + 8, x + BOX_W / 2, y + BOX_H + 28, COLORS.primary);
        this.drawText(x + BOX_W / 2, y + BOX_H + 32, 'REAR', { size: 10, color: COLORS.primary, align: 'center', baseline: 'top' });
      }
    });

    if (step.description) {
      this.drawText(W / 2, 20, step.description, { size: 13, color: COLORS.text, align: 'center', baseline: 'middle' });
    }
  }

  /**
   * Draw a linked list step.
   * @param {{ nodes: Array<{ value: any, highlighted?: boolean }>, description?: string }} step
   */
  drawLinkedListStep(step) {
    this.clear();
    const { ctx } = this;
    const W = this._cssWidth;
    const H = this._cssHeight;

    const nodes = step.nodes || [];
    const BOX_W = Math.min(100, Math.max(60, (W - 80) / Math.max(nodes.length + 1, 1) - 10));
    const BOX_H = 50;
    const GAP   = 30;
    const totalW = nodes.length * (BOX_W + GAP);
    let startX   = Math.max(20, W / 2 - totalW / 2);
    const y      = H / 2 - BOX_H / 2;

    nodes.forEach((node, i) => {
      const x           = startX + i * (BOX_W + GAP);
      const isHighlighted = node.highlighted;

      ctx.fillStyle   = isHighlighted ? COLORS.primary : COLORS.surface;
      ctx.strokeStyle = isHighlighted ? COLORS.primary : COLORS.surface2;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, BOX_W, BOX_H, 6);
      ctx.fill();
      ctx.stroke();

      this.drawText(x + BOX_W / 2, y + BOX_H / 2, String(node.value), {
        size: 13, color: COLORS.text, align: 'center', baseline: 'middle',
      });

      // Arrow to next node
      if (i < nodes.length - 1) {
        const ax1 = x + BOX_W + 2;
        const ax2 = x + BOX_W + GAP - 2;
        const ay  = y + BOX_H / 2;
        this.drawArrow(ax1, ay, ax2, ay, COLORS.textMuted);
      }
    });

    // NULL terminator
    if (nodes.length > 0) {
      const nullX = startX + nodes.length * (BOX_W + GAP) - GAP / 2;
      const nullY = y + BOX_H / 2;
      this.drawArrow(nullX, nullY, nullX + 20, nullY, COLORS.textMuted);
      ctx.fillStyle   = COLORS.surface;
      ctx.strokeStyle = COLORS.surface2;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.roundRect(nullX + 22, y + BOX_H / 4, 36, BOX_H / 2, 4);
      ctx.fill();
      ctx.stroke();
      this.drawText(nullX + 40, nullY, 'null', { size: 11, color: COLORS.textMuted, align: 'center', baseline: 'middle' });
    }

    // HEAD label
    if (nodes.length > 0) {
      const headX = startX + BOX_W / 2;
      this.drawArrow(headX, y - 10, headX, y - 30, COLORS.accent);
      this.drawText(headX, y - 34, 'HEAD', { size: 10, color: COLORS.accent, align: 'center', baseline: 'bottom' });
    }

    if (step.description) {
      this.drawText(W / 2, 20, step.description, { size: 13, color: COLORS.text, align: 'center', baseline: 'middle' });
    }
  }

  /**
   * Draw a hash table step.
   * @param {{ buckets: Array<{ key: any, values: any[] }>, size: number, highlighted?: number, description?: string }} step
   */
  drawHashTableStep(step) {
    this.clear();
    const { ctx } = this;
    const W = this._cssWidth;
    const H = this._cssHeight;

    const size    = step.size || (step.buckets ? step.buckets.length : 8);
    const buckets = step.buckets || Array.from({ length: size }, () => ({ values: [] }));

    const BUCKET_H = Math.min(44, Math.max(28, (H - 80) / size));
    const BUCKET_W = 70;
    const ENTRY_W  = 70;
    const GAP      = 6;
    const startX   = 60;
    const startY   = (H - size * (BUCKET_H + GAP)) / 2;

    buckets.forEach((bucket, i) => {
      const y         = startY + i * (BUCKET_H + GAP);
      const isHighlighted = step.highlighted === i;

      // Index label
      this.drawText(startX - 10, y + BUCKET_H / 2, String(i), {
        size: 12, color: COLORS.textMuted, align: 'right', baseline: 'middle',
      });

      // Bucket box
      ctx.fillStyle   = isHighlighted ? COLORS.primary : COLORS.surface;
      ctx.strokeStyle = isHighlighted ? COLORS.primary : COLORS.surface2;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.roundRect(startX, y, BUCKET_W, BUCKET_H, 4);
      ctx.fill();
      ctx.stroke();

      const values = bucket.values || (bucket.key != null ? [bucket.key] : []);

      if (values.length === 0) {
        this.drawText(startX + BUCKET_W / 2, y + BUCKET_H / 2, 'empty', {
          size: 11, color: COLORS.surface2, align: 'center', baseline: 'middle',
        });
      } else {
        // Show first value inside bucket
        this.drawText(startX + BUCKET_W / 2, y + BUCKET_H / 2, String(values[0]), {
          size: 12, color: COLORS.text, align: 'center', baseline: 'middle',
        });

        // Chain: remaining entries drawn to the right
        let prevX = startX + BUCKET_W;
        values.slice(1).forEach((val, j) => {
          const ex = prevX + GAP + 20;
          // Arrow
          this.drawArrow(prevX + 2, y + BUCKET_H / 2, ex - 2, y + BUCKET_H / 2, COLORS.textMuted);
          // Entry box
          ctx.fillStyle   = COLORS.surface;
          ctx.strokeStyle = COLORS.surface2;
          ctx.lineWidth   = 1.5;
          ctx.beginPath();
          ctx.roundRect(ex, y, ENTRY_W, BUCKET_H, 4);
          ctx.fill();
          ctx.stroke();
          this.drawText(ex + ENTRY_W / 2, y + BUCKET_H / 2, String(val), {
            size: 12, color: COLORS.text, align: 'center', baseline: 'middle',
          });
          prevX = ex + ENTRY_W;
        });

        // null arrow after last
        this.drawArrow(prevX + 2, y + BUCKET_H / 2, prevX + 18, y + BUCKET_H / 2, COLORS.surface2);
        this.drawText(prevX + 20, y + BUCKET_H / 2, '∅', { size: 11, color: COLORS.surface2, align: 'left', baseline: 'middle' });
      }
    });

    if (step.description) {
      this.drawText(W / 2, 20, step.description, { size: 13, color: COLORS.text, align: 'center', baseline: 'middle' });
    }
  }

  // ─────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────

  /**
   * Draw text with configurable style.
   * @param {number} x
   * @param {number} y
   * @param {string} text
   * @param {{ size?: number, color?: string, align?: string, baseline?: string, bold?: boolean }} options
   */
  drawText(x, y, text, options = {}) {
    const { ctx } = this;
    const size     = options.size     || 13;
    const color    = options.color    || COLORS.text;
    const align    = options.align    || 'left';
    const baseline = options.baseline || 'alphabetic';
    const bold     = options.bold     ? 'bold ' : '';

    ctx.font         = `${bold}${size}px 'Inter', 'Segoe UI', system-ui, sans-serif`;
    ctx.fillStyle    = color;
    ctx.textAlign    = align;
    ctx.textBaseline = baseline;
    ctx.fillText(String(text), x, y);
  }

  /**
   * Draw an arrow from (x1,y1) to (x2,y2).
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {string} color
   */
  drawArrow(x1, y1, x2, y2, color = COLORS.textMuted) {
    const { ctx } = this;
    const angle   = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 8;

    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 7), y2 - headLen * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 7), y2 - headLen * Math.sin(angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw a glowing circle effect.
   * @param {number} x
   * @param {number} y
   * @param {number} radius
   * @param {string} color
   */
  drawGlow(x, y, radius, color = COLORS.primary) {
    const { ctx } = this;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    // Parse color and add alpha variants
    gradient.addColorStop(0,   this._colorWithAlpha(color, 0.35));
    gradient.addColorStop(0.5, this._colorWithAlpha(color, 0.15));
    gradient.addColorStop(1,   this._colorWithAlpha(color, 0));

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Convert a hex color to rgba with the given alpha.
   * @private
   */
  _colorWithAlpha(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /** Destroy the renderer (remove event listeners). */
  destroy() {
    window.removeEventListener('resize', this._resizeHandler);
  }
}
