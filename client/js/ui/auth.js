/**
 * auth.js
 * Authentication modal handling, login/register state, and user session management.
 */

import { auth, datasets, getStoredUser, setToken, saveStoredUser, removeToken } from '../utils/api.js';
import { showError, showSuccess, showInfo } from './notifications.js';

function $(id) {
  return document.getElementById(id);
}

export function getCurrentUser() {
  return getStoredUser();
}

export function showLoginModal() {
  const loginModal = $('login-modal');
  const regModal = $('register-modal');
  if (regModal) regModal.classList.add('hidden');
  if (loginModal) {
    loginModal.classList.remove('hidden');
    $('login-email')?.focus();
  }
}

export function showRegisterModal() {
  const loginModal = $('login-modal');
  const regModal = $('register-modal');
  if (loginModal) loginModal.classList.add('hidden');
  if (regModal) {
    regModal.classList.remove('hidden');
    $('reg-username')?.focus();
  }
}

export function hideModals() {
  $('login-modal')?.classList.add('hidden');
  $('register-modal')?.classList.add('hidden');
  $('save-dataset-modal')?.classList.add('hidden');
}

export function updateAuthUI(user) {
  const authButtons = $('auth-buttons');
  const userInfo = $('user-info');
  const navUsername = $('nav-username');
  const saveSection = $('save-dataset-section');

  if (user && user.username) {
    if (authButtons) authButtons.classList.add('hidden');
    if (userInfo) {
      userInfo.classList.remove('hidden');
      userInfo.classList.add('flex');
    }
    if (navUsername) navUsername.textContent = user.username;
    if (saveSection) saveSection.classList.remove('hidden');
  } else {
    if (authButtons) authButtons.classList.remove('hidden');
    if (userInfo) {
      userInfo.classList.add('hidden');
      userInfo.classList.remove('flex');
    }
    if (navUsername) navUsername.textContent = '';
    if (saveSection) saveSection.classList.add('hidden');
  }
}

export async function handleLogin(email, password) {
  const btnText = $('login-btn-text');
  const spinner = $('login-btn-spinner');

  try {
    if (btnText) btnText.textContent = 'Logging in...';
    if (spinner) spinner.classList.remove('hidden');

    const result = await auth.login(email, password);
    hideModals();
    updateAuthUI(result.user);
    showSuccess(`Welcome back, ${result.user.username}!`);
    return result.user;
  } catch (err) {
    showError(err.message || 'Login failed');
    throw err;
  } finally {
    if (btnText) btnText.textContent = 'Login';
    if (spinner) spinner.classList.add('hidden');
  }
}

export async function handleRegister(username, email, password) {
  const btnText = $('reg-btn-text');
  const spinner = $('reg-btn-spinner');

  try {
    if (btnText) btnText.textContent = 'Creating account...';
    if (spinner) spinner.classList.remove('hidden');

    const result = await auth.register(username, email, password);
    hideModals();
    updateAuthUI(result.user);
    showSuccess(`Account created! Welcome, ${result.user.username}`);
    return result.user;
  } catch (err) {
    showError(err.message || 'Registration failed');
    throw err;
  } finally {
    if (btnText) btnText.textContent = 'Create Account';
    if (spinner) spinner.classList.add('hidden');
  }
}

export async function handleLogout() {
  await auth.logout();
  updateAuthUI(null);
  showInfo('Logged out successfully');
}

/**
 * Initialize event handlers for modals and forms.
 */
export function initAuthUI(getStateCallback) {
  // Check session on load
  const user = getCurrentUser();
  updateAuthUI(user);

  // Expose global AlVizAuth object for inline HTML handlers
  window.AlVizAuth = {
    showLoginModal,
    showRegisterModal,
    hideModals,
    handleLogout,
  };

  // Close modals on clicking backdrop
  ['login-modal', 'register-modal', 'save-dataset-modal'].forEach((id) => {
    const el = $(id);
    if (el) {
      el.addEventListener('click', (e) => {
        if (e.target === el) hideModals();
      });
    }
  });

  // Close modals on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModals();
  });

  // Login form submit
  const loginForm = $('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('login-email')?.value.trim();
      const password = $('login-password')?.value;
      if (!email || !password) {
        showError('Please fill in both email and password');
        return;
      }
      try {
        await handleLogin(email, password);
        loginForm.reset();
      } catch {
        // error handled in handleLogin
      }
    });
  }

  // Register form submit
  const regForm = $('register-form');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = $('reg-username')?.value.trim();
      const email = $('reg-email')?.value.trim();
      const password = $('reg-password')?.value;

      if (!username || !email || !password) {
        showError('All fields are required');
        return;
      }
      if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
      }
      try {
        await handleRegister(username, email, password);
        regForm.reset();
      } catch {
        // error handled in handleRegister
      }
    });
  }

  // Save Dataset Modal & Form
  const btnSaveDataset = $('btn-save-dataset');
  const saveModal = $('save-dataset-modal');
  const saveForm = $('save-dataset-form');

  if (btnSaveDataset && saveModal) {
    btnSaveDataset.addEventListener('click', () => {
      const u = getCurrentUser();
      if (!u) {
        showError('Please log in to save custom datasets');
        showLoginModal();
        return;
      }
      saveModal.classList.remove('hidden');
      $('ds-name')?.focus();
    });
  }

  if (saveForm) {
    saveForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('ds-name')?.value.trim();
      const desc = $('ds-description')?.value.trim();

      if (!name) {
        showError('Dataset name is required');
        return;
      }

      if (typeof getStateCallback !== 'function') return;
      const state = getStateCallback();

      try {
        await datasets.create(name, state.currentAlgorithm, state.currentData, desc);
        saveModal?.classList.add('hidden');
        saveForm.reset();
        showSuccess(`Dataset "${name}" saved to your account!`);
      } catch (err) {
        showError(err.message || 'Failed to save dataset');
      }
    });
  }
}

