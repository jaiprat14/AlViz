/**
 * app.js
 * Master orchestrator for the AlViz Algorithm Visualizer.
 * Wires together algorithms, canvas renderer, playback animator, UI controls, and backend API.
 */

import { SORTING_ALGORITHMS } from './algorithms/sorting.js';
import { SEARCHING_ALGORITHMS } from './algorithms/searching.js';
import { GRAPH_ALGORITHMS, generateDefaultGraph } from './algorithms/graph.js';
import { TREE_ALGORITHMS, DS_ALGORITHMS, AVLTree, RedBlackTree } from './algorithms/trees.js';
import { CanvasRenderer } from './visualizer/canvas-renderer.js';
import { Animator } from './visualizer/animator.js';
import {
  initControls,
  updateStepInfo,
  updateComplexityDisplay,
  updateAlgorithmTitle,
  setPlaybackState,
  getArraySize,
} from './ui/controls.js';
import { initAuthUI, getCurrentUser, updateAuthUI } from './ui/auth.js';
import { showToast, showError, showSuccess, showInfo } from './ui/notifications.js';
import {
  generateRandomArray,
  generateNearlySortedArray,
  generateReverseSortedArray,
  parseUserInput,
  generateRandomGraph,
} from './utils/dataGenerator.js';
import { history } from './utils/api.js';

// ── Application State ────────────────────────────────────────────────────────

const state = {
  currentCategory: 'sorting', // 'sorting' | 'searching' | 'graph' | 'trees'
  currentAlgorithmKey: 'bubble-sort',
  currentAlgorithm: null,
  currentData: [],
  searchTarget: 42,
  graphData: null,
  treeValues: [45, 27, 68, 12, 34, 56, 89, 7, 21, 50, 75],
  renderer: null,
  animator: null,
  simulationStartTime: null,
};

// ── Init App ─────────────────────────────────────────────────────────────────

export function initApp() {
  try {
    // 1. Initialize Canvas Renderer & Playback Animator
    state.renderer = new CanvasRenderer('viz-canvas');
    state.animator = new Animator(state.renderer);

    // 2. Initialize Auth UI & attach state callback for dataset saving
    initAuthUI(() => state);

    // 3. Setup UI Controls
    initControls(state.animator, state.renderer, {
      onGenerate: handleDataGeneration,
      onRun: runCurrentAlgorithm,
      onInputChange: handleCustomInput,
      onPresetChange: handlePresetChange,
      onSizeChange: (sz) => handleDataGeneration(sz),
    });

    // 4. Setup Category Tabs (both desktop and mobile)
    setupCategoryTabs();

    // 5. Setup Mobile Sidebar & Info Drawer Toggles
    setupMobileDrawers();

    // 6. Setup Animated Hero Preview Bars
    setupHeroBars();

    // 7. Initial Data & Default Algorithm Load
    state.currentData = generateRandomArray(getArraySize());
    state.graphData = generateDefaultGraph();
    setCategory('sorting');

    console.log('AlViz initialized successfully with 20+ algorithms.');
  } catch (err) {
    console.error('AlViz initialization failed:', err);
    showError(`Initialization error: ${err.message}`);
  }
}

// ── Category & Algorithm Selection ──────────────────────────────────────────

function setupCategoryTabs() {
  document.querySelectorAll('.category-tab').forEach((tab) => {
    tab.addEventListener('click', (e) => {
      const cat = e.currentTarget.getAttribute('data-category');
      if (cat) {
        setCategory(cat);
      }
    });
  });
}

function setCategory(category) {
  state.currentCategory = category;

  // Update active tab styling
  document.querySelectorAll('.category-tab').forEach((tab) => {
    if (tab.getAttribute('data-category') === category) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Populate algorithm list
  renderAlgorithmList(category);

  // Pick first algorithm in new category
  const firstKey = getDefaultAlgoForCategory(category);
  loadAlgorithm(firstKey);
}

function getDefaultAlgoForCategory(category) {
  switch (category) {
    case 'sorting':
      return 'bubble-sort';
    case 'searching':
      return 'binary-search';
    case 'graph':
      return 'bfs';
    case 'trees':
      return 'avl-tree';
    default:
      return 'bubble-sort';
  }
}

function getCategoryAlgorithms(category) {
  switch (category) {
    case 'sorting':
      return SORTING_ALGORITHMS;
    case 'searching':
      return SEARCHING_ALGORITHMS;
    case 'graph':
      return GRAPH_ALGORITHMS;
    case 'trees':
      return { ...TREE_ALGORITHMS, ...DS_ALGORITHMS };
    default:
      return SORTING_ALGORITHMS;
  }
}

function renderAlgorithmList(category) {
  const algos = getCategoryAlgorithms(category);
  const containers = [
    document.getElementById('algo-list'),
    document.getElementById('mobile-algo-list'),
  ].filter(Boolean);

  containers.forEach((container) => {
    container.innerHTML = '';

    Object.entries(algos).forEach(([key, info]) => {
      const btn = document.createElement('button');
      btn.className = `algo-list-item w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors ${
        key === state.currentAlgorithmKey ? 'active bg-primary/20 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-surface2'
      }`;
      btn.setAttribute('data-algo', key);

      btn.innerHTML = `
        <span class="truncate pr-2">${info.name || key}</span>
        <span class="text-[10px] font-mono bg-darker px-1.5 py-0.5 rounded border border-surface2 text-accent whitespace-nowrap">
          ${info.timeComplexity || ''}
        </span>
      `;

      btn.addEventListener('click', () => {
        loadAlgorithm(key);
        // On mobile, close sidebar after pick
        window.closeSidebar?.();
      });

      container.appendChild(btn);
    });
  });
}

function updateActiveAlgoButton(key) {
  document.querySelectorAll('.algo-list-item').forEach((item) => {
    if (item.getAttribute('data-algo') === key) {
      item.classList.add('active', 'bg-primary/20', 'text-white', 'font-semibold');
      item.classList.remove('text-slate-400');
    } else {
      item.classList.remove('active', 'bg-primary/20', 'text-white', 'font-semibold');
      item.classList.add('text-slate-400');
    }
  });
}

// ── Algorithm Loading & Step Generation ──────────────────────────────────────

function loadAlgorithm(key) {
  state.currentAlgorithmKey = key;
  updateActiveAlgoButton(key);

  const catAlgos = getCategoryAlgorithms(state.currentCategory);
  const algo = catAlgos[key];
  if (!algo) {
    console.warn(`Algorithm ${key} not found in category ${state.currentCategory}`);
    return;
  }
  state.currentAlgorithm = algo;

  // Update UI Labels
  updateAlgorithmTitle(algo.name, algo.timeComplexity);
  updateComplexityDisplay(algo.timeComplexity, algo.spaceComplexity);

  // Generate steps and configure renderer
  generateAndLoadSteps();
}

function generateAndLoadSteps() {
  state.animator.pause();
  setPlaybackState(false);
  state.simulationStartTime = Date.now();

  let steps = [];
  let renderFn = null;
  const key = state.currentAlgorithmKey;
  const cat = state.currentCategory;

  if (cat === 'sorting') {
    state.renderer.setRenderMode('sorting');
    const sortAlgo = SORTING_ALGORITHMS[key];
    if (sortAlgo && typeof sortAlgo.fn === 'function') {
      const arrCopy = state.currentData.slice();
      steps = sortAlgo.fn(arrCopy);
    }
    renderFn = (step) => state.renderer.drawSortingStep(step, state.currentAlgorithm);
  } else if (cat === 'searching') {
    state.renderer.setRenderMode('searching');
    const searchAlgo = SEARCHING_ALGORITHMS[key];
    if (searchAlgo) {
      let data = state.currentData.slice();
      if (searchAlgo.requiresSorted) {
        data.sort((a, b) => a - b);
      }
      // Pick target from middle of data or random
      state.searchTarget = data[Math.floor(data.length / 2)] || 42;
      steps = searchAlgo.fn(data, state.searchTarget);
    }
    renderFn = (step) => state.renderer.drawSearchingStep(step, state.searchTarget);
  } else if (cat === 'graph') {
    state.renderer.setRenderMode('graph');
    const graphAlgo = GRAPH_ALGORITHMS[key];
    if (graphAlgo && typeof graphAlgo.fn === 'function') {
      const g = state.graphData || generateDefaultGraph();
      const startId = g.nodes[0] ? g.nodes[0].id : 0;
      steps = graphAlgo.fn(g, startId);
    }
    renderFn = (step) => state.renderer.drawGraphStep(step);
  } else if (cat === 'trees') {
    const isDS = !!DS_ALGORITHMS[key];
    if (isDS) {
      state.renderer.setRenderMode('ds');
      steps = generateDataStructureSteps(key);
      renderFn = (step) => renderDataStructureStep(key, step);
    } else {
      state.renderer.setRenderMode('tree');
      steps = generateTreeSteps(key);
      renderFn = (step) => state.renderer.drawTreeStep(step);
    }
  }

  // Load steps into animator
  state.animator.load(
    steps,
    renderFn,
    (index, total, desc) => {
      updateStepInfo(index, total, desc);
    },
    () => {
      // On complete callback
      setPlaybackState(false);
      logSimulationHistory(steps.length);
    }
  );

  updateStepInfo(0, steps.length, steps[0]?.description || 'Ready. Click Play to start.');
}

function runCurrentAlgorithm() {
  generateAndLoadSteps();
  state.animator.play();
  setPlaybackState(true);
}

// ── Tree & Data Structure Generators ────────────────────────────────────────

function generateTreeSteps(key) {
  if (key === 'avl-tree') {
    const avl = new AVLTree();
    const allSteps = [];
    for (const val of state.treeValues) {
      const insertSteps = avl.insert(val);
      allSteps.push(...insertSteps);
    }
    return allSteps;
  } else if (key === 'red-black-tree') {
    const rbt = new RedBlackTree();
    const allSteps = [];
    for (const val of state.treeValues) {
      const insertSteps = rbt.insert(val);
      allSteps.push(...insertSteps);
    }
    return allSteps;
  }
  return [];
}

function generateDataStructureSteps(key) {
  const ops = DS_ALGORITHMS[key];
  if (!ops || typeof ops.fn !== 'function') return [];

  if (key === 'stack') {
    const stackOps = [
      { type: 'push', value: 10 },
      { type: 'push', value: 25 },
      { type: 'push', value: 40 },
      { type: 'pop' },
      { type: 'push', value: 55 },
      { type: 'push', value: 70 },
      { type: 'pop' },
      { type: 'push', value: 99 },
    ];
    return ops.fn(stackOps);
  } else if (key === 'queue') {
    const queueOps = [
      { type: 'enqueue', value: 15 },
      { type: 'enqueue', value: 30 },
      { type: 'enqueue', value: 45 },
      { type: 'dequeue' },
      { type: 'enqueue', value: 60 },
      { type: 'dequeue' },
      { type: 'enqueue', value: 75 },
    ];
    return ops.fn(queueOps);
  } else if (key === 'linked-list') {
    const listOps = [
      { type: 'insert', value: 12 },
      { type: 'insert', value: 34 },
      { type: 'insert', value: 56 },
      { type: 'search', value: 34 },
      { type: 'delete', value: 34 },
      { type: 'insert', value: 78 },
    ];
    return ops.fn(listOps);
  } else if (key === 'hash-table') {
    const hashOps = [
      { type: 'set', key: 'apple', value: 10 },
      { type: 'set', key: 'banana', value: 25 },
      { type: 'set', key: 'orange', value: 40 },
      { type: 'get', key: 'banana' },
      { type: 'set', key: 'grape', value: 60 },
      { type: 'delete', key: 'apple' },
    ];
    return ops.fn(hashOps);
  }
  return [];
}

function renderDataStructureStep(key, step) {
  if (key === 'stack') {
    state.renderer.drawStackStep(step);
  } else if (key === 'queue') {
    state.renderer.drawQueueStep(step);
  } else if (key === 'linked-list') {
    state.renderer.drawLinkedListStep(step);
  } else if (key === 'hash-table') {
    state.renderer.drawHashTableStep(step);
  }
}

// ── Data Input & Generation Handlers ─────────────────────────────────────────

function handleDataGeneration(size) {
  const sz = size || getArraySize();
  state.currentData = generateRandomArray(sz);
  state.graphData = generateDefaultGraph();
  state.treeValues = generateRandomArray(9, 10, 99);
  generateAndLoadSteps();
  showToast(`Generated new dataset (${sz} items)`, 'info', 1500);
}

function handlePresetChange(preset) {
  const sz = getArraySize();
  switch (preset) {
    case 'nearly-sorted':
      state.currentData = generateNearlySortedArray(sz);
      break;
    case 'reverse-sorted':
      state.currentData = generateReverseSortedArray(sz);
      break;
    case 'random':
    default:
      state.currentData = generateRandomArray(sz);
      break;
  }
  generateAndLoadSteps();
  showToast(`Applied preset: ${preset}`, 'info', 1500);
}

function handleCustomInput(rawText) {
  if (!rawText) return;
  try {
    const parsed = parseUserInput(rawText);
    state.currentData = parsed;
    // Update size slider and display
    const slider = document.getElementById('size-slider');
    const display = document.getElementById('size-display');
    if (slider) slider.value = Math.min(200, parsed.length);
    if (display) display.textContent = parsed.length;

    generateAndLoadSteps();
    showSuccess(`Loaded custom input of ${parsed.length} numbers`);
  } catch (err) {
    showError(err.message || 'Invalid input format');
  }
}

// ── Simulation History Logging ───────────────────────────────────────────────

async function logSimulationHistory(stepCount) {
  const user = getCurrentUser();
  if (!user) return; // Only log if user is logged in

  const duration = Date.now() - (state.simulationStartTime || Date.now());
  try {
    await history.log(
      state.currentAlgorithmKey,
      Array.isArray(state.currentData) ? state.currentData.slice(0, 100) : null,
      stepCount,
      duration
    );
  } catch (e) {
    console.warn('Could not record history:', e.message);
  }
}

// ── Mobile Drawer and Responsive Helpers ─────────────────────────────────────

function setupMobileDrawers() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const hamOpen = document.getElementById('ham-open');
  const hamClose = document.getElementById('ham-close');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isClosed = mobileMenu.classList.contains('hidden');
      if (isClosed) {
        mobileMenu.classList.remove('hidden');
        hamOpen?.classList.add('hidden');
        hamClose?.classList.remove('hidden');
      } else {
        mobileMenu.classList.add('hidden');
        hamOpen?.classList.remove('hidden');
        hamClose?.classList.add('hidden');
      }
    });
  }

  // Mobile sidebar drawer
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const mobileSidebar = document.getElementById('mobile-sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  window.openSidebar = () => {
    mobileSidebar?.classList.remove('-translate-x-full');
    sidebarOverlay?.classList.remove('hidden');
  };

  window.closeSidebar = () => {
    mobileSidebar?.classList.add('-translate-x-full');
    sidebarOverlay?.classList.add('hidden');
  };

  sidebarToggle?.addEventListener('click', window.openSidebar);
  sidebarOverlay?.addEventListener('click', window.closeSidebar);

  // Mobile info drawer
  const mobileInfoBtn = document.getElementById('mobile-info-btn');
  const infoDrawer = document.getElementById('info-drawer');

  mobileInfoBtn?.addEventListener('click', () => {
    infoDrawer?.classList.toggle('open');
  });
}

function setupHeroBars() {
  const container = document.getElementById('hero-bars');
  if (!container) return;

  const barCount = 28;
  const bars = [];
  container.innerHTML = '';

  for (let i = 0; i < barCount; i++) {
    const bar = document.createElement('div');
    const heightPct = Math.floor(Math.random() * 85) + 15;
    bar.className = 'w-1.5 sm:w-2 bg-gradient-to-t from-primary to-accent rounded-t transition-all duration-500';
    bar.style.height = `${heightPct}%`;
    container.appendChild(bar);
    bars.push(bar);
  }

  // Light periodic animation on hero bars
  setInterval(() => {
    const idx1 = Math.floor(Math.random() * bars.length);
    const idx2 = Math.floor(Math.random() * bars.length);
    const h1 = bars[idx1].style.height;
    bars[idx1].style.height = bars[idx2].style.height;
    bars[idx2].style.height = h1;
  }, 600);
}

// ── Auto Boot ────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

