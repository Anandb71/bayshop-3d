import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import '@fontsource/outfit/latin-400.css';
import '@fontsource/outfit/latin-500.css';
import '@fontsource/outfit/latin-600.css';
import '@fontsource/outfit/latin-700.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '../styles/main.css';

import { bindScene, createLenis, initMotion, prefersReducedMotion, revealAll } from './motion.js';

const reduced = prefersReducedMotion();
const page = document.body.dataset.page || 'home';
const preloader = document.getElementById('preloader');
const countEl = document.querySelector('[data-preloader-count]');
const fillEl = document.querySelector('[data-preloader-fill]');
const bar = document.querySelector('[data-preloader-bar]');

const progress = { fonts: 0.2, motion: 0.15, scene: 0 };
let displayed = 0;
let sealed = false;

function paintProgress(value) {
  displayed = Math.max(displayed, Math.min(100, Math.round(value)));
  if (countEl) countEl.textContent = String(displayed).padStart(2, '0');
  if (fillEl) fillEl.style.transform = `scaleX(${displayed / 100})`;
  if (bar) bar.setAttribute('aria-valuenow', String(displayed));
}

function currentProgress() {
  return (progress.fonts * 0.25 + progress.motion * 0.25 + progress.scene * 0.5) * 100;
}

function markReady() {
  document.documentElement.classList.add('is-ready');
  if (reduced) document.documentElement.classList.add('is-reduced');
}

function hidePreloader() {
  if (sealed) return;
  sealed = true;
  paintProgress(100);
  markReady();
  if (!preloader) return;
  preloader.classList.add('is-done');
  window.setTimeout(() => {
    preloader.hidden = true;
    preloader.setAttribute('aria-hidden', 'true');
  }, 420);
}

async function boot() {
  if (reduced) {
    document.documentElement.classList.add('is-reduced');
    if (preloader) preloader.hidden = true;
    markReady();
  }

  if (document.fonts) {
    document.fonts.ready.then(() => {
      progress.fonts = 1;
      paintProgress(currentProgress());
    });
  } else {
    progress.fonts = 1;
  }

  const lenis = reduced ? null : createLenis();
  progress.motion = 1;
  paintProgress(currentProgress());

  const motion = initMotion({ reduced, lenis });

  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

  let scene = null;
  const canvas = document.getElementById('webgl');

  if (canvas) {
    try {
      const mod = await import('./scene.js');
      scene = mod.initScene({ canvas, reduced, page });
    } catch {
      document.documentElement.classList.add('no-webgl');
    }
  }

  progress.scene = 1;
  paintProgress(currentProgress());

  if (scene && !reduced) bindScene(scene);

  if (!reduced) motion.playIntro();
  else {
    revealAll();
    scene?.renderOnce();
  }

  hidePreloader();
  window.setTimeout(() => motion.refresh?.(), 80);
}

boot().catch(() => {
  revealAll();
  hidePreloader();
});

window.setTimeout(() => {
  revealAll();
  hidePreloader();
}, 1500);
