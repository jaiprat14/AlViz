/**
 * landing.js
 * Lightweight scripts for the AlViz landing page.
 * Handles auth modal triggers, hero animation, and mobile navigation.
 */

import { initAuthUI, getCurrentUser, updateAuthUI } from './ui/auth.js';

function setupLandingHeroBars() {
  const container = document.getElementById('hero-bars');
  if (!container) return;

  const barCount = 32;
  const bars = [];
  container.innerHTML = '';

  for (let i = 0; i < barCount; i++) {
    const bar = document.createElement('div');
    const heightPct = Math.floor(Math.random() * 80) + 20;
    bar.className = 'w-1.5 sm:w-2 bg-gradient-to-t from-primary to-accent rounded-t transition-all duration-500';
    bar.style.height = `${heightPct}%`;
    container.appendChild(bar);
    bars.push(bar);
  }

  // Periodic visual shuffle effect
  setInterval(() => {
    if (bars.length < 2) return;
    const idx1 = Math.floor(Math.random() * bars.length);
    const idx2 = Math.floor(Math.random() * bars.length);
    const temp = bars[idx1].style.height;
    bars[idx1].style.height = bars[idx2].style.height;
    bars[idx2].style.height = temp;
  }, 500);
}

function setupMobileMenu() {
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
}

function initLanding() {
  // Initialize Auth state
  initAuthUI();
  const user = getCurrentUser();
  updateAuthUI(user);

  // Setup UI components
  setupLandingHeroBars();
  setupMobileMenu();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanding);
} else {
  initLanding();
}

