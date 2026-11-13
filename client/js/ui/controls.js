/**
 * controls.js — Playback and configuration control bindings for AlViz.
 * Handles both desktop and mobile control strips, progress indicators,
 * and data inputs.
 */

function $(id) {
  return document.getElementById(id);
}

/**
 * Wire up all playback / configuration controls.
 *
 * @param {import('../visualizer/animator.js').Animator} animator
 * @param {import('../visualizer/canvas-renderer.js').CanvasRenderer} renderer
 * @param {Object} [callbacks]
 * @param {Function} [callbacks.onGenerate] - Called when new random data is requested.
 * @param {Function} [callbacks.onRun] - Called when play/run is requested.
 * @param {Function} [callbacks.onInputChange] - Called when custom input changes.
 * @param {Function} [callbacks.onPresetChange] - Called when preset changes.
 * @param {Function} [callbacks.onSizeChange] - Called when size slider changes.
 */
export function initControls(animator, renderer, callbacks = {}) {
  const { onGenerate, onRun, onInputChange, onPresetChange, onSizeChange } = callbacks;

  // ── Play / Pause helper ──
  const togglePlay = () => {
    if (animator.isPlaying()) {
      animator.pause();
      setPlaybackState(false);
    } else {
      // If there's an overlay present, hide it
      $('canvas-overlay')?.classList.add('hidden');
      if (typeof onRun === 'function' && animator.getTotalSteps() === 0) {
        onRun();
      }
      animator.play();
      setPlaybackState(true);
    }
  };

  // ── Play / Pause (Desktop & Mobile) ──
  $('btn-play')?.addEventListener('click', togglePlay);
  $('m-btn-play')?.addEventListener('click', togglePlay);

  // ── Step Forward (Desktop & Mobile) ──
  const stepForward = () => {
    $('canvas-overlay')?.classList.add('hidden');
    animator.pause();
    setPlaybackState(false);
    animator.stepForward();
  };
  $('btn-step-fwd')?.addEventListener('click', stepForward);
  $('btn-step-forward')?.addEventListener('click', stepForward);
  $('m-btn-stepfwd')?.addEventListener('click', stepForward);

  // ── Step Backward (Desktop & Mobile) ──
  const stepBackward = () => {
    $('canvas-overlay')?.classList.add('hidden');
    animator.pause();
    setPlaybackState(false);
    animator.stepBackward();
  };
  $('btn-step-back')?.addEventListener('click', stepBackward);
  $('m-btn-stepback')?.addEventListener('click', stepBackward);

  // ── Reset (Desktop & Mobile) ──
  const resetPlayback = () => {
    animator.reset();
    setPlaybackState(false);
  };
  $('btn-reset')?.addEventListener('click', resetPlayback);
  $('m-btn-reset')?.addEventListener('click', resetPlayback);

  // ── Speed Slider (Desktop & Mobile) ──
  const speedSlider = $('speed-slider');
  const speedDisplay = $('speed-display');
  const mSpeedSlider = $('m-speed-slider');

  const handleSpeedUpdate = (val) => {
    const v = Math.max(1, Math.min(10, parseInt(val, 10) || 5));
    animator.setSpeed(v);
    if (speedDisplay) speedDisplay.textContent = v;
    if (speedSlider) speedSlider.value = v;
    if (mSpeedSlider) mSpeedSlider.value = v;
  };

  if (speedSlider) {
    speedSlider.addEventListener('input', (e) => handleSpeedUpdate(e.target.value));
  }
  if (mSpeedSlider) {
    mSpeedSlider.addEventListener('input', (e) => handleSpeedUpdate(e.target.value));
  }

  // ── Size Slider ──
  const sizeSlider = $('size-slider');
  const sizeDisplay = $('size-display');
  if (sizeSlider) {
    sizeSlider.addEventListener('input', (e) => {
      const sz = parseInt(e.target.value, 10);
      if (sizeDisplay) sizeDisplay.textContent = sz;
      if (typeof onSizeChange === 'function') onSizeChange(sz);
    });
  }

  // ── Generate Random Data Button ──
  const handleRandomGen = () => {
    const sz = getArraySize();
    if (typeof onGenerate === 'function') onGenerate(sz);
  };
  $('btn-random')?.addEventListener('click', handleRandomGen);
  $('btn-generate')?.addEventListener('click', handleRandomGen);

  // ── Custom Input Button / Change ──
  const applyCustomInput = () => {
    const raw = getCustomInput();
    if (typeof onInputChange === 'function') onInputChange(raw);
  };
  $('btn-use-input')?.addEventListener('click', applyCustomInput);
  $('custom-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      applyCustomInput();
    }
  });

  // ── Preset Select ──
  const presetSelect = $('preset-select');
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      if (typeof onPresetChange === 'function') {
        onPresetChange(e.target.value);
      }
    });
  }
}

// ─── UI Update Helpers ────────────────────────────────────────────────────────

/**
 * Update the step counter and description elements across all panels.
 *
 * @param {number} stepIndex   - Current step (0-based).
 * @param {number} totalSteps  - Total number of steps.
 * @param {string} description - Human-readable description.
 */
export function updateStepInfo(stepIndex, totalSteps, description) {
  const current1Based = totalSteps > 0 ? stepIndex + 1 : 0;

  // Header step counter
  const stepCounter = $('step-counter');
  if (stepCounter) {
    stepCounter.textContent = `Step ${current1Based} / ${totalSteps}`;
  }

  // Right sidebar step indicators
  const stepCurrent = $('info-step-current');
  if (stepCurrent) stepCurrent.textContent = current1Based;

  const stepTotal = $('info-step-total');
  if (stepTotal) stepTotal.textContent = totalSteps;

  const stepDesc = $('info-step-desc');
  if (stepDesc) {
    stepDesc.textContent = description || (totalSteps === 0 ? 'Ready to visualize.' : 'Step in progress.');
  }

  // Drawer (mobile)
  const drawerDesc = $('drawer-step-desc');
  if (drawerDesc) drawerDesc.textContent = description || '';

  // Progress Bar
  const progressEl = $('step-progress');
  if (progressEl) {
    const pct = totalSteps > 1 ? Math.round((stepIndex / (totalSteps - 1)) * 100) : 0;
    progressEl.style.width = `${pct}%`;
  }
}

/**
 * Update the complexity display elements.
 *
 * @param {string} timeComplexity
 * @param {string} spaceComplexity
 */
export function updateComplexityDisplay(timeComplexity, spaceComplexity) {
  const t = timeComplexity || '—';
  const s = spaceComplexity || '—';

  const timeEl = $('info-time');
  if (timeEl) timeEl.textContent = t;

  const spaceEl = $('info-space');
  if (spaceEl) spaceEl.textContent = s;

  const drawerTime = $('drawer-time');
  if (drawerTime) drawerTime.textContent = t;

  const drawerSpace = $('drawer-space');
  if (drawerSpace) drawerSpace.textContent = s;
}

/**
 * Update the algorithm title element across desktop and mobile.
 *
 * @param {string} name - Display name of the algorithm.
 * @param {string} [timeComp] - Optional time complexity.
 */
export function updateAlgorithmTitle(name, timeComp = '') {
  const infoName = $('info-algo-name');
  if (infoName) infoName.textContent = name || '';

  const label = $('canvas-algo-label');
  if (label) {
    label.textContent = timeComp ? `${name} · ${timeComp}` : name;
  }

  const mobileTitle = $('mobile-algo-title');
  if (mobileTitle) mobileTitle.textContent = name || '';

  const drawerName = $('drawer-algo-name');
  if (drawerName) drawerName.textContent = name || '';
}

/**
 * Toggle play/pause buttons (Desktop and Mobile).
 *
 * @param {boolean} isPlaying
 */
export function setPlaybackState(isPlaying) {
  // Desktop icon toggling
  const playIcon = $('play-icon');
  const pauseIcon = $('pause-icon');
  if (playIcon && pauseIcon) {
    if (isPlaying) {
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
    } else {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
    }
  }

  // Mobile button text
  const mBtnPlay = $('m-btn-play');
  if (mBtnPlay) {
    mBtnPlay.textContent = isPlaying ? '⏸' : '▶';
    mBtnPlay.title = isPlaying ? 'Pause' : 'Play';
  }
}

/**
 * Read the current array size from the size slider.
 *
 * @returns {number}
 */
export function getArraySize() {
  return parseInt($('size-slider')?.value ?? '50', 10);
}

/**
 * Read the raw text from the custom-input field.
 *
 * @returns {string}
 */
export function getCustomInput() {
  return $('custom-input')?.value ?? '';
}
