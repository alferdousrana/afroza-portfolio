/**
 * Custom cursor (fine pointers only, disabled for reduced motion).
 * States communicate what a click will do:
 *   project → "View case study" (large)   image → "Explore" (large)
 *   external link → "Open"               CTA → "Let's talk"
 *   frame → grab                          text field → caret
 */
import { $, lerp, finePointer, motionOK } from './utils.js';

export function initCursor() {
  if (!finePointer() || !motionOK()) return;
  const root = $('#cursor');
  if (!root) return;
  document.documentElement.classList.add('has-cursor');

  const dot = $('.cursor__dot', root);
  const ring = $('.cursor__ring', root);
  const label = $('.cursor__label', root);
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  let raf = 0;

  const STATES = ['is-label', 'is-small', 'is-text', 'is-grab', 'is-link'];
  const setState = (state, text = '') => {
    root.classList.remove(...STATES);
    if (state) root.classList.add(state);
    label.textContent = text;
  };

  const loop = () => {
    rx = lerp(rx, mx, 0.2);
    ry = lerp(ry, my, 0.2);
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    raf = Math.abs(rx - mx) + Math.abs(ry - my) > 0.1 ? requestAnimationFrame(loop) : 0;
  };

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    root.classList.remove('is-hidden');
    root.classList.add('is-live');
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });

  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor], [data-frame], a, button, input, textarea, [role="tab"]');
    if (!t) return setState(null);
    if (t.matches('input:not([type="radio"]), textarea')) return setState('is-text');
    if (t.hasAttribute('data-frame')) return setState('is-grab');
    const text = t.getAttribute('data-cursor');
    if (text) return setState(t.dataset.cursorSize === 'lg' ? 'is-label' : 'is-small', text);
    if (t.matches('a[target="_blank"]')) return setState('is-small', 'Open');
    setState('is-link');
  });

  document.addEventListener('pointerdown', () => root.classList.add('is-down'));
  document.addEventListener('pointerup', () => root.classList.remove('is-down'));
  document.documentElement.addEventListener('pointerleave', () => root.classList.add('is-hidden'));
}
