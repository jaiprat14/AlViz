/**
 * animator.js
 * Step-by-step playback engine for AlViz.
 * Drives animation transitions and dispatches render and progress updates.
 */

// Delay in ms per step for speed settings 1-10
const SPEED_DELAYS = [null, 1000, 750, 500, 350, 220, 140, 90, 60, 40, 20];

export class Animator {
  /**
   * @param {import('./canvas-renderer.js').CanvasRenderer} renderer
   */
  constructor(renderer) {
    this.renderer = renderer;
    this.steps = [];
    this.currentStep = 0;
    this.renderFn = null;
    this.onStepChange = null;
    this.onComplete = null;
    this.speed = 5;
    this.timer = null;
    this.running = false;
  }

  /**
   * Load an algorithm run.
   *
   * @param {Array<Object>} steps - List of step snapshots
   * @param {Function} renderFn - (step, index) => void
   * @param {Function} [onStepChange] - (index, total, description) => void
   * @param {Function} [onComplete] - () => void
   */
  load(steps, renderFn, onStepChange, onComplete) {
    this.pause();
    this.steps = Array.isArray(steps) ? steps : [];
    this.currentStep = 0;
    this.renderFn = renderFn;
    this.onStepChange = onStepChange || null;
    this.onComplete = onComplete || null;

    if (this.steps.length > 0) {
      this._renderCurrent();
    } else {
      if (this.renderer && typeof this.renderer.clear === 'function') {
        this.renderer.clear();
      }
      this._notify();
    }
  }

  /** Start or resume playback */
  play() {
    if (this.running) return;
    if (this.steps.length === 0) return;

    // If at the end, restart from beginning
    if (this.currentStep >= this.steps.length - 1) {
      this.currentStep = 0;
    }

    this.running = true;
    this._startTimer();
  }

  /** Pause playback */
  pause() {
    this.running = false;
    this._clearTimer();
  }

  /** Reset to the first step */
  reset() {
    this.pause();
    this.currentStep = 0;
    if (this.steps.length > 0) {
      this._renderCurrent();
    }
  }

  /** Step forward one frame */
  stepForward() {
    if (this.steps.length === 0) return;
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this._renderCurrent();
    } else {
      this.pause();
      if (typeof this.onComplete === 'function') {
        this.onComplete();
      }
    }
  }

  /** Step backward one frame */
  stepBackward() {
    if (this.steps.length === 0) return;
    if (this.currentStep > 0) {
      this.currentStep--;
      this._renderCurrent();
    }
  }

  /** Jump directly to a step index */
  jumpTo(index) {
    if (this.steps.length === 0) return;
    const clamped = Math.max(0, Math.min(this.steps.length - 1, Math.floor(index)));
    this.currentStep = clamped;
    this._renderCurrent();
  }

  /**
   * Set playback speed (1 to 10)
   * @param {number} speed
   */
  setSpeed(speed) {
    const val = Math.max(1, Math.min(10, Math.round(speed)));
    this.speed = val;
    if (this.running) {
      this._clearTimer();
      this._startTimer();
    }
  }

  /** @returns {number} */
  getSpeed() {
    return this.speed;
  }

  /** @returns {boolean} */
  isPlaying() {
    return this.running;
  }

  /** @returns {number} */
  getCurrentStep() {
    return this.currentStep;
  }

  /** @returns {number} */
  getTotalSteps() {
    return this.steps.length;
  }

  /** @returns {Object|null} */
  getCurrentStepData() {
    return this.steps[this.currentStep] || null;
  }

  // ── Internal Helpers ──

  _getDelay() {
    return SPEED_DELAYS[this.speed] || 220;
  }

  _startTimer() {
    this._clearTimer();
    const delay = this._getDelay();
    this.timer = setInterval(() => this._tick(), delay);
  }

  _clearTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  _tick() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this._renderCurrent();
    } else {
      this.pause();
      if (typeof this.onComplete === 'function') {
        this.onComplete();
      }
    }
  }

  _renderCurrent() {
    const step = this.steps[this.currentStep];
    if (step && typeof this.renderFn === 'function') {
      try {
        this.renderFn(step, this.currentStep);
      } catch (err) {
        console.error('Render error on step', this.currentStep, err);
      }
    }
    this._notify();
  }

  _notify() {
    if (typeof this.onStepChange === 'function') {
      const step = this.steps[this.currentStep];
      const desc = step ? (step.description || '') : '';
      this.onStepChange(this.currentStep, this.steps.length, desc);
    }
  }
}

