/**
 * graph.js — Graph algorithm step generators for AlViz
 *
 * Graph format:
 *   { nodes: [{ id, label, x, y }, ...], edges: [{ from, to, weight, directed }, ...] }
 *
 * Each algorithm returns an array of STEP objects:
 *   { graph, visitedNodes, currentNode, frontier, visitedEdges, treeEdges, distances, description }
 */

// ─── Utilities ────────────────────────────────────────────────────────────────

function cloneGraph(graph) {
  return {
    nodes: graph.nodes.map(n => ({ ...n })),
    edges: graph.edges.map(e => ({ ...e })),
  };
}

/** Build adjacency list. For undirected edges, adds both directions. */
function buildAdjacency(graph) {
  const adj = {};
  for (const node of graph.nodes) adj[node.id] = [];
  for (const edge of graph.edges) {
    adj[edge.from].push({ to: edge.to, weight: edge.weight ?? 1 });
    if (!edge.directed) {
      adj[edge.to].push({ to: edge.from, weight: edge.weight ?? 1 });
    }
  }
  return adj;
}

function nodeLabel(graph, id) {
  const node = graph.nodes.find(n => n.id === id);
  return node ? node.label : String(id);
}

function makeStep(override) {
  return {
    graph: null,
    visitedNodes: [],
    currentNode: null,
    frontier: [],
    visitedEdges: [],
    treeEdges: [],
    distances: {},
    description: '',
    ...override,
  };
}

// ─── BFS ──────────────────────────────────────────────────────────────────────

/**
 * bfs(graph, startNodeId)
 * Returns array of steps showing BFS traversal with queue state.
 */
export function bfs(graph, startNodeId) {
  const steps = [];
  const adj = buildAdjacency(graph);
  const visited = new Set();
  const visitedEdges = [];
  const treeEdges = [];
  const queue = [startNodeId];
  visited.add(startNodeId);

  steps.push(makeStep({
    graph: cloneGraph(graph),
    visitedNodes: [...visited],
    currentNode: startNodeId,
    frontier: [...queue],
    visitedEdges: [...visitedEdges],
    treeEdges: [...treeEdges],
    description: `Start BFS from node ${nodeLabel(graph, startNodeId)}. Add it to the queue.`,
  }));

  while (queue.length > 0) {
    const current = queue.shift();

    steps.push(makeStep({
      graph: cloneGraph(graph),
      visitedNodes: [...visited],
      currentNode: current,
      frontier: [...queue],
      visitedEdges: [...visitedEdges],
      treeEdges: [...treeEdges],
      description: `Dequeue node ${nodeLabel(graph, current)}. Queue: [${queue.map(id => nodeLabel(graph, id)).join(', ')}]`,
    }));

    for (const { to } of adj[current]) {
      visitedEdges.push({ from: current, to });

      if (!visited.has(to)) {
        visited.add(to);
        treeEdges.push({ from: current, to });
        queue.push(to);

        steps.push(makeStep({
          graph: cloneGraph(graph),
          visitedNodes: [...visited],
          currentNode: current,
          frontier: [...queue],
          visitedEdges: [...visitedEdges],
          treeEdges: [...treeEdges],
          description: `Discover neighbor ${nodeLabel(graph, to)} from ${nodeLabel(graph, current)}. Enqueue it. Queue: [${queue.map(id => nodeLabel(graph, id)).join(', ')}]`,
        }));
      } else {
        steps.push(makeStep({
          graph: cloneGraph(graph),
          visitedNodes: [...visited],
          currentNode: current,
          frontier: [...queue],
          visitedEdges: [...visitedEdges],
          treeEdges: [...treeEdges],
          description: `Neighbor ${nodeLabel(graph, to)} already visited — skip.`,
        }));
      }
    }
  }

  steps.push(makeStep({
    graph: cloneGraph(graph),
    visitedNodes: [...visited],
    currentNode: null,
    frontier: [],
    visitedEdges: [...visitedEdges],
    treeEdges: [...treeEdges],
    description: `BFS complete. Visited: [${[...visited].map(id => nodeLabel(graph, id)).join(', ')}]`,
  }));

  return steps;
}

// ─── DFS ──────────────────────────────────────────────────────────────────────

/**
 * dfs(graph, startNodeId)
 * Returns array of steps showing iterative DFS with explicit stack.
 */
export function dfs(graph, startNodeId) {
  const steps = [];
  const adj = buildAdjacency(graph);
  const visited = new Set();
  const visitedEdges = [];
  const treeEdges = [];
  const stack = [startNodeId];

  steps.push(makeStep({
    graph: cloneGraph(graph),
    visitedNodes: [...visited],
    currentNode: startNodeId,
    frontier: [...stack],
    visitedEdges: [...visitedEdges],
    treeEdges: [...treeEdges],
    description: `Start DFS from node ${nodeLabel(graph, startNodeId)}. Push onto stack.`,
  }));

  // Track parent for tree edges
  const parent = { [startNodeId]: null };

  while (stack.length > 0) {
    const current = stack.pop();

    if (visited.has(current)) {
      steps.push(makeStep({
        graph: cloneGraph(graph),
        visitedNodes: [...visited],
        currentNode: current,
        frontier: [...stack],
        visitedEdges: [...visitedEdges],
        treeEdges: [...treeEdges],
        description: `Pop node ${nodeLabel(graph, current)} — already visited, skip. Stack: [${stack.map(id => nodeLabel(graph, id)).join(', ')}]`,
      }));
      continue;
    }

    visited.add(current);
    if (parent[current] !== null && parent[current] !== undefined) {
      treeEdges.push({ from: parent[current], to: current });
    }

    steps.push(makeStep({
      graph: cloneGraph(graph),
      visitedNodes: [...visited],
      currentNode: current,
      frontier: [...stack],
      visitedEdges: [...visitedEdges],
      treeEdges: [...treeEdges],
      description: `Visit node ${nodeLabel(graph, current)}. Stack: [${stack.map(id => nodeLabel(graph, id)).join(', ')}]`,
    }));

    // Push neighbors in reverse so we process them left-to-right
    const neighbors = [...adj[current]];
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const { to } = neighbors[i];
      visitedEdges.push({ from: current, to });
      if (!visited.has(to)) {
        stack.push(to);
        if (parent[to] === undefined) parent[to] = current;

        steps.push(makeStep({
          graph: cloneGraph(graph),
          visitedNodes: [...visited],
          currentNode: current,
          frontier: [...stack],
          visitedEdges: [...visitedEdges],
          treeEdges: [...treeEdges],
          description: `Push unvisited neighbor ${nodeLabel(graph, to)} onto stack. Stack: [${stack.map(id => nodeLabel(graph, id)).join(', ')}]`,
        }));
      }
    }
  }

  steps.push(makeStep({
    graph: cloneGraph(graph),
    visitedNodes: [...visited],
    currentNode: null,
    frontier: [],
    visitedEdges: [...visitedEdges],
    treeEdges: [...treeEdges],
    description: `DFS complete. Visited: [${[...visited].map(id => nodeLabel(graph, id)).join(', ')}]`,
  }));

  return steps;
}

// ─── Dijkstra ─────────────────────────────────────────────────────────────────

/**
 * dijkstra(graph, startNodeId)
 * Returns steps for Dijkstra's shortest-path algorithm.
 * Requires weighted edges; falls back to weight=1 if unweighted.
 */
export function dijkstra(graph, startNodeId) {
  const steps = [];
  const adj = buildAdjacency(graph);

  // distances map
  const dist = {};
  const finalized = new Set();
  const treeEdges = [];
  const visitedEdges = [];
  const prev = {};

  for (const node of graph.nodes) {
    dist[node.id] = Infinity;
  }
  dist[startNodeId] = 0;

  // Simple min-heap via sorted array (small graphs)
  // pq entries: { nodeId, dist }
  const pq = [{ nodeId: startNodeId, dist: 0 }];

  steps.push(makeStep({
    graph: cloneGraph(graph),
    visitedNodes: [...finalized],
    currentNode: startNodeId,
    frontier: pq.map(e => e.nodeId),
    visitedEdges: [...visitedEdges],
    treeEdges: [...treeEdges],
    distances: { ...dist },
    description: `Initialize Dijkstra from ${nodeLabel(graph, startNodeId)}. All distances = ∞ except start = 0.`,
  }));

  while (pq.length > 0) {
    // Extract min
    pq.sort((a, b) => a.dist - b.dist);
    const { nodeId: u, dist: uDist } = pq.shift();

    if (finalized.has(u)) continue;
    if (uDist > dist[u]) continue; // stale entry

    finalized.add(u);

    steps.push(makeStep({
      graph: cloneGraph(graph),
      visitedNodes: [...finalized],
      currentNode: u,
      frontier: pq.map(e => e.nodeId),
      visitedEdges: [...visitedEdges],
      treeEdges: [...treeEdges],
      distances: { ...dist },
      description: `Extract min: node ${nodeLabel(graph, u)} with distance ${dist[u]}. Finalize it.`,
    }));

    for (const { to: v, weight: w } of adj[u]) {
      visitedEdges.push({ from: u, to: v });
      const newDist = dist[u] + w;

      if (newDist < dist[v]) {
        const oldDist = dist[v];
        dist[v] = newDist;
        prev[v] = u;
        pq.push({ nodeId: v, dist: newDist });

        steps.push(makeStep({
          graph: cloneGraph(graph),
          visitedNodes: [...finalized],
          currentNode: u,
          frontier: pq.map(e => e.nodeId),
          visitedEdges: [...visitedEdges],
          treeEdges: [...treeEdges],
          distances: { ...dist },
          description: `Relax edge ${nodeLabel(graph, u)}→${nodeLabel(graph, v)}: ${dist[u]} + ${w} = ${newDist} < ${oldDist === Infinity ? '∞' : oldDist}. Update distance.`,
        }));
      } else {
        steps.push(makeStep({
          graph: cloneGraph(graph),
          visitedNodes: [...finalized],
          currentNode: u,
          frontier: pq.map(e => e.nodeId),
          visitedEdges: [...visitedEdges],
          treeEdges: [...treeEdges],
          distances: { ...dist },
          description: `Edge ${nodeLabel(graph, u)}→${nodeLabel(graph, v)}: ${dist[u]} + ${w} = ${newDist} ≥ ${dist[v] === Infinity ? '∞' : dist[v]}. No improvement.`,
        }));
      }
    }
  }

  // Build shortest-path tree edges from prev
  for (const [v, u] of Object.entries(prev)) {
    treeEdges.push({ from: Number(u), to: Number(v) });
  }

  steps.push(makeStep({
    graph: cloneGraph(graph),
    visitedNodes: [...finalized],
    currentNode: null,
    frontier: [],
    visitedEdges: [...visitedEdges],
    treeEdges: [...treeEdges],
    distances: { ...dist },
    description: `Dijkstra complete. Shortest distances from ${nodeLabel(graph, startNodeId)}: ${Object.entries(dist).map(([id, d]) => `${nodeLabel(graph, Number(id))}=${d === Infinity ? '∞' : d}`).join(', ')}`,
  }));

  return steps;
}

// ─── Prim's MST ───────────────────────────────────────────────────────────────

/**
 * prim(graph)
 * Returns steps for Prim's Minimum Spanning Tree algorithm.
 */
export function prim(graph) {
  const steps = [];
  const adj = buildAdjacency(graph);

  if (graph.nodes.length === 0) return steps;

  const inMST = new Set();
  const treeEdges = [];
  const visitedEdges = [];

  // Start from node 0 (or first node)
  const startId = graph.nodes[0].id;
  inMST.add(startId);

  // Candidate edges: { from, to, weight }
  let candidates = adj[startId].map(({ to, weight }) => ({ from: startId, to, weight }));

  steps.push(makeStep({
    graph: cloneGraph(graph),
    visitedNodes: [...inMST],
    currentNode: startId,
    frontier: candidates.map(e => e.to),
    visitedEdges: [...visitedEdges],
    treeEdges: [...treeEdges],
    description: `Start Prim's MST from node ${nodeLabel(graph, startId)}. Candidate edges: ${candidates.map(e => `${nodeLabel(graph, e.from)}–${nodeLabel(graph, e.to)}(${e.weight})`).join(', ')}`,
  }));

  while (inMST.size < graph.nodes.length && candidates.length > 0) {
    // Filter out edges going to already-in-MST nodes
    candidates = candidates.filter(e => !inMST.has(e.to));

    if (candidates.length === 0) break;

    // Pick minimum weight candidate
    candidates.sort((a, b) => a.weight - b.weight);
    const best = candidates[0];

    // Mark all as visited edges for visualization
    for (const c of candidates) {
      visitedEdges.push({ from: c.from, to: c.to });
    }

    steps.push(makeStep({
      graph: cloneGraph(graph),
      visitedNodes: [...inMST],
      currentNode: best.to,
      frontier: candidates.map(e => e.to),
      visitedEdges: [...visitedEdges],
      treeEdges: [...treeEdges],
      description: `Candidates: [${candidates.map(e => `${nodeLabel(graph, e.from)}–${nodeLabel(graph, e.to)}(${e.weight})`).join(', ')}]. Choose minimum edge: ${nodeLabel(graph, best.from)}–${nodeLabel(graph, best.to)} weight=${best.weight}.`,
    }));

    // Add best edge to MST
    inMST.add(best.to);
    treeEdges.push({ from: best.from, to: best.to });

    // Add new candidate edges from newly added node
    const newCandidates = adj[best.to]
      .filter(({ to }) => !inMST.has(to))
      .map(({ to, weight }) => ({ from: best.to, to, weight }));

    candidates.push(...newCandidates);

    steps.push(makeStep({
      graph: cloneGraph(graph),
      visitedNodes: [...inMST],
      currentNode: best.to,
      frontier: candidates.filter(e => !inMST.has(e.to)).map(e => e.to),
      visitedEdges: [...visitedEdges],
      treeEdges: [...treeEdges],
      description: `Add node ${nodeLabel(graph, best.to)} and edge ${nodeLabel(graph, best.from)}–${nodeLabel(graph, best.to)} to MST. New candidates from ${nodeLabel(graph, best.to)}: ${newCandidates.map(e => `${nodeLabel(graph, e.to)}(${e.weight})`).join(', ') || 'none'}.`,
    }));
  }

  steps.push(makeStep({
    graph: cloneGraph(graph),
    visitedNodes: [...inMST],
    currentNode: null,
    frontier: [],
    visitedEdges: [...visitedEdges],
    treeEdges: [...treeEdges],
    description: `Prim's MST complete. Tree edges: ${treeEdges.map(e => `${nodeLabel(graph, e.from)}–${nodeLabel(graph, e.to)}`).join(', ')}. Total nodes in MST: ${inMST.size}.`,
  }));

  return steps;
}

// ─── Kruskal's MST ────────────────────────────────────────────────────────────

/**
 * kruskal(graph)
 * Returns steps for Kruskal's Minimum Spanning Tree algorithm using Union-Find.
 */
export function kruskal(graph) {
  const steps = [];

  if (graph.nodes.length === 0) return steps;

  // Union-Find
  const parent = {};
  const rank = {};
  for (const node of graph.nodes) {
    parent[node.id] = node.id;
    rank[node.id] = 0;
  }

  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }

  function union(x, y) {
    const px = find(x), py = find(y);
    if (px === py) return false;
    if (rank[px] < rank[py]) { parent[px] = py; }
    else if (rank[px] > rank[py]) { parent[py] = px; }
    else { parent[py] = px; rank[px]++; }
    return true;
  }

  // Collect unique edges (avoid duplicates for undirected)
  const seen = new Set();
  const allEdges = [];
  for (const edge of graph.edges) {
    const key = edge.from < edge.to ? `${edge.from}-${edge.to}` : `${edge.to}-${edge.from}`;
    if (!seen.has(key)) {
      seen.add(key);
      allEdges.push({ from: edge.from, to: edge.to, weight: edge.weight ?? 1 });
    }
  }

  allEdges.sort((a, b) => a.weight - b.weight);

  const treeEdges = [];
  const rejectedEdges = [];
  const visitedNodes = new Set();

  steps.push(makeStep({
    graph: cloneGraph(graph),
    visitedNodes: [...visitedNodes],
    currentNode: null,
    frontier: [],
    visitedEdges: [],
    treeEdges: [],
    description: `Kruskal's MST: Sort all edges by weight. Sorted: [${allEdges.map(e => `${nodeLabel(graph, e.from)}–${nodeLabel(graph, e.to)}(${e.weight})`).join(', ')}]`,
  }));

  for (const edge of allEdges) {
    const { from, to, weight } = edge;
    const pFrom = find(from);
    const pTo = find(to);
    const cycleWouldForm = pFrom === pTo;

    steps.push(makeStep({
      graph: cloneGraph(graph),
      visitedNodes: [...visitedNodes],
      currentNode: null,
      frontier: [],
      visitedEdges: [...treeEdges, ...rejectedEdges, { from, to }],
      treeEdges: [...treeEdges],
      description: `Consider edge ${nodeLabel(graph, from)}–${nodeLabel(graph, to)} (weight=${weight}). Components: ${nodeLabel(graph, from)} in set ${pFrom}, ${nodeLabel(graph, to)} in set ${pTo}. ${cycleWouldForm ? 'Same component → would form cycle.' : 'Different components → safe to add.'}`,
    }));

    if (!cycleWouldForm) {
      union(from, to);
      treeEdges.push({ from, to });
      visitedNodes.add(from);
      visitedNodes.add(to);

      steps.push(makeStep({
        graph: cloneGraph(graph),
        visitedNodes: [...visitedNodes],
        currentNode: null,
        frontier: [],
        visitedEdges: [...treeEdges, ...rejectedEdges],
        treeEdges: [...treeEdges],
        description: `✓ Accept edge ${nodeLabel(graph, from)}–${nodeLabel(graph, to)} (weight=${weight}). MST edges so far: ${treeEdges.length}/${graph.nodes.length - 1}. Merge components.`,
      }));

      if (treeEdges.length === graph.nodes.length - 1) break;
    } else {
      rejectedEdges.push({ from, to });
      steps.push(makeStep({
        graph: cloneGraph(graph),
        visitedNodes: [...visitedNodes],
        currentNode: null,
        frontier: [],
        visitedEdges: [...treeEdges, ...rejectedEdges],
        treeEdges: [...treeEdges],
        description: `✗ Reject edge ${nodeLabel(graph, from)}–${nodeLabel(graph, to)} (weight=${weight}). Would create a cycle.`,
      }));
    }
  }

  steps.push(makeStep({
    graph: cloneGraph(graph),
    visitedNodes: [...visitedNodes],
    currentNode: null,
    frontier: [],
    visitedEdges: [...treeEdges],
    treeEdges: [...treeEdges],
    description: `Kruskal's MST complete. ${treeEdges.length} edges: ${treeEdges.map(e => `${nodeLabel(graph, e.from)}–${nodeLabel(graph, e.to)}`).join(', ')}. Total weight: ${treeEdges.reduce((s, e) => s + (graph.edges.find(ge => (ge.from === e.from && ge.to === e.to) || (ge.from === e.to && ge.to === e.from))?.weight ?? 1), 0)}.`,
  }));

  return steps;
}

// ─── Default Graph ─────────────────────────────────────────────────────────────

/**
 * generateDefaultGraph()
 * Returns a sample weighted undirected graph with 8 nodes for an 800×500 canvas.
 */
export function generateDefaultGraph() {
  return {
    nodes: [
      { id: 0, label: 'A', x: 100, y: 150 },
      { id: 1, label: 'B', x: 280, y:  70 },
      { id: 2, label: 'C', x: 460, y: 100 },
      { id: 3, label: 'D', x: 620, y: 200 },
      { id: 4, label: 'E', x: 580, y: 370 },
      { id: 5, label: 'F', x: 380, y: 420 },
      { id: 6, label: 'G', x: 190, y: 360 },
      { id: 7, label: 'H', x: 350, y: 240 },
    ],
    edges: [
      { from: 0, to: 1, weight: 4,  directed: false },
      { from: 0, to: 6, weight: 7,  directed: false },
      { from: 1, to: 2, weight: 8,  directed: false },
      { from: 1, to: 7, weight: 11, directed: false },
      { from: 2, to: 3, weight: 7,  directed: false },
      { from: 2, to: 5, weight: 2,  directed: false },
      { from: 2, to: 7, weight: 4,  directed: false },
      { from: 3, to: 4, weight: 9,  directed: false },
      { from: 3, to: 5, weight: 14, directed: false },
      { from: 4, to: 5, weight: 10, directed: false },
      { from: 5, to: 6, weight: 2,  directed: false },
      { from: 6, to: 7, weight: 1,  directed: false },
      { from: 7, to: 4, weight: 7,  directed: false },
    ],
  };
}

// ─── Algorithm Registry ────────────────────────────────────────────────────────

export const GRAPH_ALGORITHMS = {
  'bfs': {
    fn: bfs,
    name: 'BFS',
    timeComplexity: 'O(V+E)',
    spaceComplexity: 'O(V)',
    description: 'Breadth-First Search explores all neighbors of a node before moving to the next level. It uses a queue and guarantees the shortest path in unweighted graphs.',
  },
  'dfs': {
    fn: dfs,
    name: 'DFS',
    timeComplexity: 'O(V+E)',
    spaceComplexity: 'O(V)',
    description: 'Depth-First Search explores as far as possible along each branch before backtracking. Uses a stack (iterative) and is useful for topological sort and cycle detection.',
  },
  'dijkstra': {
    fn: dijkstra,
    name: "Dijkstra's",
    timeComplexity: 'O((V+E) log V)',
    spaceComplexity: 'O(V)',
    description: "Dijkstra's algorithm finds the shortest path from a source node to all other nodes in a weighted graph with non-negative edge weights. Uses a priority queue.",
  },
  'prim': {
    fn: prim,
    name: "Prim's MST",
    timeComplexity: 'O((V+E) log V)',
    spaceComplexity: 'O(V)',
    description: "Prim's algorithm builds a Minimum Spanning Tree by greedily adding the lowest-weight edge that connects the growing MST to an unvisited node.",
  },
  'kruskal': {
    fn: kruskal,
    name: "Kruskal's MST",
    timeComplexity: 'O(E log E)',
    spaceComplexity: 'O(V)',
    description: "Kruskal's algorithm builds an MST by sorting all edges by weight and adding each edge if it doesn't form a cycle, using Union-Find for efficient cycle detection.",
  },
};
