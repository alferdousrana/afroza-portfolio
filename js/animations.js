/**
 * Animation engine — one scroll listener, one rAF, many subscribers.
 * Uses IntersectionObserver for reveals so nothing measures layout on scroll
 * unless it genuinely needs scroll progress.
 */
import { $, $$, clamp, motionOK, finePointer, esc } from './utils.js';

/* ---------- Central scroll scheduler ---------- */
const subscribers = new Set();
let ticking = false;
export function onScroll(fn) { subscribers.add(fn); fn(); return () => subscribers.delete(fn); }
function tick() { ticking = false; subscribers.forEach((fn) => fn()); }
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }, { passive: true });
addEventListener('resize', () => requestAnimationFrame(tick), { passive: true });

/** Progress (0→1) of an element travelling through the viewport. */
export function progressOf(el, start = 0.85, end = 0.25) {
  const r = el.getBoundingClientRect();
  const vh = innerHeight;
  const from = vh * start;              // element top hits this → 0
  const to = vh * end - r.height;       // element bottom hits this → 1
  return clamp((from - r.top) / (from - to), 0, 1);
}

/* ---------- Word split (accessible: real text stays for screen readers) ---------- */
export function splitWords(el) {
  if (!el || el.dataset.splitDone === '1') return;
  const text = el.textContent.trim().replace(/\s+/g, ' ');
  const words = text.split(' ');
  el.innerHTML = `<span class="visually-hidden">${esc(text)}</span>` +
    words.map((w, i) => `<span class="split-word" aria-hidden="true"><span style="--i:${i}">${esc(w)}</span></span>`).join(' ');
  el.classList.add('is-split');
  el.dataset.splitDone = '1';
}

/* ---------- Reveals ---------- */
let io;
export function observeReveals(root = document) {
  const targets = $$('[data-reveal], .is-split, [data-inview]', root).filter((el) => !el.classList.contains('is-in'));
  if (!motionOK() || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in', 'in-view'));
    return;
  }
  io ??= new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in', 'in-view');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  targets.forEach((el) => io.observe(el));
}

/* ---------- Scroll-scrubbed statement: words light up with reading position ---------- */
export function scrubWords(el) {
  if (!el) return;
  if (!motionOK()) { el.classList.add('no-scrub'); return; }
  const text = el.textContent.trim().replace(/\s+/g, ' ');
  el.innerHTML = `<span class="visually-hidden">${esc(text)}</span>` +
    text.split(' ').map((w) => `<span class="w" aria-hidden="true">${esc(w)}</span>`).join(' ');
  const words = $$('.w', el);
  let lit = -1;
  onScroll(() => {
    const p = progressOf(el, 0.9, 0.45);
    const n = Math.round(p * words.length);
    if (n === lit) return;
    words.forEach((w, i) => w.classList.toggle('is-lit', i < n));
    lit = n;
  });
}

/* ---------- Scroll progress bar ---------- */
export function initProgress() {
  const bar = $('#progressBar');
  if (!bar) return;
  onScroll(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  });
}

/* ---------- Magnetic elements: pull toward the pointer (feedback, not decoration) ---------- */
export function initMagnetic(root = document) {
  if (!finePointer() || !motionOK()) return;
  $$('.magnetic', root).forEach((el) => {
    if (el.dataset.mag) return;
    el.dataset.mag = '1';
    const strength = 0.28;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength * 1.2;
      el.classList.add('is-magnet');
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-magnet');
      el.style.transform = '';
    });
  });
}

/* ---------- Tilt toward pointer (used on the interview reel) ---------- */
export function initTilt(el, max = 8) {
  if (!el || !finePointer() || !motionOK()) return;
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${px * max}deg`);
    el.style.setProperty('--rx', `${-py * max}deg`);
  });
  el.addEventListener('pointerleave', () => { el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
}
