import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isFinePointer() {
  return window.matchMedia('(pointer: fine)').matches;
}

export function revealAll() {
  document.querySelectorAll('[data-anim]').forEach((el) => {
    el.style.opacity = '';
    el.style.transform = '';
    el.classList.add('is-in');
  });
  document.querySelectorAll('[data-split] .line-inner').forEach((el) => {
    el.style.transform = '';
  });
}

function splitLines(el) {
  if (el.dataset.splitReady) return;
  const nodes = Array.from(el.childNodes);
  const words = [];

  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          words.push(document.createTextNode(part));
        } else {
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = part;
          words.push(span);
        }
      });
    } else {
      words.push(node);
    }
  });

  el.textContent = '';
  const line = document.createElement('span');
  line.className = 'line';
  const inner = document.createElement('span');
  inner.className = 'line-inner';
  words.forEach((w) => inner.appendChild(w));
  line.appendChild(inner);
  el.appendChild(line);
  el.dataset.splitReady = 'true';
}

function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  const close = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'Menu';
    document.body.classList.remove('nav-open');
  };

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.textContent = open ? 'Close' : 'Menu';
    document.body.classList.toggle('nav-open', open);
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) close();
  });
}

function initAvatars() {
  document.querySelectorAll('.avatar > img').forEach((img) => {
    const fail = () => {
      if (!img.parentNode) return;
      img.parentNode.classList.add('is-empty');
      img.remove();
    };
    if (img.complete && img.naturalWidth === 0) fail();
    else img.addEventListener('error', fail, { once: true });
  });
}

function initCursor() {
  if (!isFinePointer() || prefersReducedMotion()) return null;
  const root = document.getElementById('cursor');
  if (!root) return null;
  root.hidden = false;
  document.documentElement.classList.add('has-cursor');

  const dot = root.querySelector('.cursor-dot');
  const ring = root.querySelector('.cursor-ring');
  const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const ringPos = { x: pos.x, y: pos.y };

  window.addEventListener('pointermove', (event) => {
    pos.x = event.clientX;
    pos.y = event.clientY;
    if (dot) {
      dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    }
  }, { passive: true });

  const hoverables = 'a, button, .prize-card, .nav-toggle';
  document.addEventListener('pointerover', (event) => {
    if (event.target.closest(hoverables)) root.classList.add('is-hover');
  });
  document.addEventListener('pointerout', (event) => {
    if (event.target.closest(hoverables)) root.classList.remove('is-hover');
  });

  gsap.ticker.add(() => {
    ringPos.x += (pos.x - ringPos.x) * 0.18;
    ringPos.y += (pos.y - ringPos.y) * 0.18;
    if (ring) {
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
    }
  });

  return root;
}

function initMagnetic() {
  if (!isFinePointer() || prefersReducedMotion()) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const strength = 18;
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      gsap.to(el, {
        x: x / rect.width * strength,
        y: y / rect.height * strength,
        duration: 0.35,
        ease: 'power3.out',
      });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.55, ease: 'power3.out' });
    });
  });
}

function initTilt() {
  if (!isFinePointer() || prefersReducedMotion()) return;
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * 10;
      const ry = (px - 0.5) * 12;
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      card.style.setProperty('--sheen-x', `${px * 100}%`);
      card.style.setProperty('--sheen-y', `${py * 100}%`);
      card.classList.add('is-tilting');
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
      card.classList.remove('is-tilting');
    });
  });
}

function initMarquee(lenis) {
  const track = document.querySelector('[data-marquee]');
  if (!track || prefersReducedMotion()) return;
  const bits = track.innerHTML;
  track.innerHTML = bits + bits;
  const tween = gsap.to(track, {
    xPercent: -50,
    duration: 28,
    ease: 'none',
    repeat: -1,
  });
  if (lenis) {
    lenis.on('scroll', ({ velocity }) => {
      const boost = 1 + Math.min(Math.abs(velocity) * 0.08, 2.2);
      tween.timeScale(boost);
    });
  }
}

function initParallax() {
  document.querySelectorAll('[data-speed]').forEach((el) => {
    const speed = parseFloat(el.getAttribute('data-speed') || '0');
    gsap.to(el, {
      yPercent: speed * -40,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
      },
    });
  });
}

function initSchedule() {
  const pin = document.querySelector('[data-schedule-pin]');
  const items = document.querySelectorAll('[data-schedule-item]');
  if (!pin || !items.length || window.innerWidth < 768) return;

  ScrollTrigger.create({
    trigger: pin,
    start: 'top top+=78',
    end: () => `+=${Math.max(window.innerHeight * 1.35, 900)}`,
    pin: pin.querySelector('.schedule-stage') || pin,
    scrub: 0.65,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const index = Math.min(items.length - 1, Math.floor(self.progress * items.length));
      items.forEach((item, i) => {
        item.classList.toggle('is-active', i === index);
        item.classList.toggle('is-past', i < index);
      });
      pin.style.setProperty('--schedule-progress', String(self.progress));
    },
  });
}

function initCounters() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseFloat(el.getAttribute('data-count'));
    const suffix = el.getAttribute('data-suffix') || '';
    const box = { v: 0 };
    gsap.to(box, {
      v: target,
      duration: 1.4,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true,
      },
      onUpdate: () => {
        el.textContent = `${Math.round(box.v)}${suffix}`;
      },
      onComplete: () => {
        el.textContent = `${target}${suffix}`;
      },
    });
  });
}

function initReveals() {
  const nodes = gsap.utils.toArray('[data-anim]');
  if (!nodes.length) return;
  ScrollTrigger.batch(nodes, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => {
      gsap.fromTo(batch, { y: 18, opacity: 0.55 }, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.06,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    },
  });
}

function playIntro() {
  const hero = gsap.utils.toArray('[data-anim="hero"]');
  const lines = gsap.utils.toArray('[data-split] .line-inner');
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (lines.length) {
    tl.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 0.85, stagger: 0.08 }, 0);
  }
  if (hero.length) {
    tl.fromTo(hero, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.06 }, 0.12);
  }
  return tl;
}

export function createLenis() {
  const lenis = new Lenis({
    lerp: 0.085,
    smoothWheel: true,
    syncTouch: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function initMotion({ reduced, lenis }) {
  initNav();
  initAvatars();

  if (reduced) {
    revealAll();
    return { playIntro: () => {}, refresh: () => {} };
  }

  document.querySelectorAll('[data-split]').forEach(splitLines);

  initCursor();
  initMagnetic();
  initTilt();
  initMarquee(lenis);
  initParallax();
  initSchedule();
  initCounters();
  initReveals();

  window.addEventListener('load', () => ScrollTrigger.refresh());

  return {
    playIntro,
    bindScene,
    refresh: () => ScrollTrigger.refresh(),
  };
}

export function bindScene(scene) {
  if (!scene || prefersReducedMotion()) return;
  ScrollTrigger.create({
    trigger: document.documentElement,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.7,
    onUpdate: (self) => scene.setScroll(self.progress),
  });
}
