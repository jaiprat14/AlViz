/**
 * notifications.js — Toast notification system for AlViz.
 *
 * Creates a fixed toast container in the top-right of the viewport and
 * animates individual toast messages in and out.
 */

// ─── Toast Container ──────────────────────────────────────────────────────────

let _container = null;

function getContainer() {
  if (_container) return _container;

  _container = document.createElement('div');
  _container.id = 'alviz-toast-container';
  Object.assign(_container.style, {
    position:     'fixed',
    top:          '1rem',
    right:        '1rem',
    zIndex:       '9999',
    display:      'flex',
    flexDirection:'column',
    gap:          '0.5rem',
    maxWidth:     '340px',
    width:        '100%',
    pointerEvents:'none',
  });
  document.body.appendChild(_container);
  return _container;
}

// ─── Type Config ─────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  success: {
    bgColor:    '#22c55e',
    textColor:  '#ffffff',
    icon:       '✓',
  },
  error: {
    bgColor:    '#ef4444',
    textColor:  '#ffffff',
    icon:       '✕',
  },
  warning: {
    bgColor:    '#f59e0b',
    textColor:  '#ffffff',
    icon:       '⚠',
  },
  info: {
    bgColor:    '#3b82f6',
    textColor:  '#ffffff',
    icon:       'ℹ',
  },
};

// ─── Core showToast ───────────────────────────────────────────────────────────

/**
 * Display a toast notification.
 *
 * @param {string}  message   - The text to display.
 * @param {string}  type      - 'success' | 'error' | 'info' | 'warning'
 * @param {number}  duration  - Auto-dismiss delay in ms (0 = never).
 * @returns {HTMLElement}     The toast element (can be dismissed manually).
 */
export function showToast(message, type = 'info', duration = 3000) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const container = getContainer();

  // ── Build toast ──
  const toast = document.createElement('div');
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');

  Object.assign(toast.style, {
    display:        'flex',
    alignItems:     'center',
    gap:            '0.5rem',
    padding:        '0.75rem 1rem',
    borderRadius:   '0.5rem',
    background:     config.bgColor,
    color:          config.textColor,
    fontSize:       '0.875rem',
    fontFamily:     'system-ui, sans-serif',
    boxShadow:      '0 4px 12px rgba(0,0,0,0.25)',
    pointerEvents:  'auto',
    cursor:         'pointer',
    userSelect:     'none',
    // Slide-in start
    opacity:        '0',
    transform:      'translateX(110%)',
    transition:     'opacity 0.3s ease, transform 0.3s ease',
    wordBreak:      'break-word',
  });

  // Icon
  const iconEl = document.createElement('span');
  iconEl.textContent = config.icon;
  Object.assign(iconEl.style, {
    fontSize:    '1rem',
    fontWeight:  'bold',
    flexShrink:  '0',
    lineHeight:  '1',
  });

  // Message
  const msgEl = document.createElement('span');
  msgEl.textContent = message;
  Object.assign(msgEl.style, { flex: '1' });

  // Close button
  const closeEl = document.createElement('span');
  closeEl.textContent = '×';
  Object.assign(closeEl.style, {
    fontSize:   '1.1rem',
    lineHeight: '1',
    flexShrink: '0',
    opacity:    '0.75',
  });
  closeEl.addEventListener('mouseenter', () => { closeEl.style.opacity = '1'; });
  closeEl.addEventListener('mouseleave', () => { closeEl.style.opacity = '0.75'; });

  toast.appendChild(iconEl);
  toast.appendChild(msgEl);
  toast.appendChild(closeEl);
  container.appendChild(toast);

  // ── Animate in ──
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity   = '1';
      toast.style.transform = 'translateX(0)';
    });
  });

  // ── Dismiss helpers ──
  let dismissed = false;

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(110%)';
    toast.addEventListener('transitionend', () => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, { once: true });
  }

  toast.addEventListener('click', dismiss);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }

  return toast;
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export const showError   = (msg, duration) => showToast(msg, 'error',   duration);
export const showSuccess = (msg, duration) => showToast(msg, 'success', duration);
export const showInfo    = (msg, duration) => showToast(msg, 'info',    duration);
export const showWarning = (msg, duration) => showToast(msg, 'warning', duration);
