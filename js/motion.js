/**
 * Motion v2: how the page moves under the visitor's thumb.
 *
 * 1. smoothScrollTo(): eased in-page navigation (quintic in-out) that
 *    re-aims every frame, so late-loading images can't make it miss,
 *    and stops the instant the visitor touches, scrolls or presses a key.
 * 2. Mobile "sheets" (≤ 900px): each section rises and settles as it comes
 *    in, and recedes slightly as it leaves, tied directly to scroll position.
 *    Native momentum scrolling is untouched; only transform + opacity move.
 * 3. Mobile chrome: the top bar and tab bar tuck away while reading down
 *    and come back the moment you scroll up.
 * Reduced motion: instant jumps, no sheets, chrome stays put.
 */
import { $, $$, clamp, motionOK } from './utils.js';
import { onScroll } from './animations.js';

const easeInOutQuint = (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
let raf = 0, programmatic = false;

const navOffset = () => {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
  return (Number.isFinite(v) ? v : 64) + 8;
};

export function smoothScrollTo(target) {
  const aim = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (typeof target === 'number') return clamp(target, 0, max);
    if (!target || target.id === 'top') return 0;
    return clamp(target.getBoundingClientRect().top + scrollY - navOffset(), 0, max);
  };
  cancelAnimationFrame(raf);
  const from = scrollY;
  const first = aim();
  if (!motionOK() || Math.abs(first - from) < 2) { scrollTo(0, first); return Promise.resolve(); }
  const dur = clamp(Math.abs(first - from) * 0.42, 560, 1350);
  programmatic = true;
  return new Promise((resolve) => {
    const t0 = performance.now();
    const stop = () => {
      cancelAnimationFrame(raf);
      programmatic = false;
      ['wheel', 'touchstart', 'keydown'].forEach((ev) => removeEventListener(ev, stop));
      resolve();
    };
    ['wheel', 'touchstart', 'keydown'].forEach((ev) => addEventListener(ev, stop, { passive: true }));
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      scrollTo(0, from + (aim() - from) * easeInOutQuint(t));
      if (t < 1) raf = requestAnimationFrame(step); else stop();
    };
    raf = requestAnimationFrame(step);
  });
}

/* ==========================================================================
   Mobile sheets + tucking chrome
   ========================================================================== */
export function initMotion() {
  const mq = matchMedia('(max-width: 900px)');
  const html = document.documentElement;
  const nav = $('#nav'), tabbar = $('#tabbar');

  /* ---------- Tab bar: tiny haptic tick on Android ---------- */
  tabbar?.addEventListener('click', () => { try { navigator.vibrate?.(6); } catch (e) { /* ignore */ } });

  if (!motionOK()) return;

  let sheets = [];
  const collect = () => {
    sheets = $$('main > section:not(.hero)').filter((s) => !s.hidden).map((sec) => ({
      sec,
      parts: [...sec.children].filter((c) => !c.matches('.moment__glow, .live__aurora, .visually-hidden, script'))
    }));
  };
  const clear = () => sheets.forEach(({ parts }) => parts.forEach((p) => { p.style.transform = ''; p.style.opacity = ''; }));

  const paint = () => {
    if (!mq.matches) return;
    const vh = innerHeight;
    for (const { sec, parts } of sheets) {
      const r = sec.getBoundingClientRect();
      if (r.top > vh * 1.15 || r.bottom < -vh * 0.2) continue;
      const enter = 1 - Math.pow(1 - clamp((vh - r.top) / (vh * 0.62), 0, 1), 3); // ease-out cubic
      const leave = clamp((vh * 0.22 - r.bottom) / (vh * 0.22), 0, 1);
      const settled = enter > 0.999 && leave < 0.001;
      const y = (1 - enter) * 56 - leave * 18;
      const s = 0.93 + 0.07 * enter - 0.035 * leave;
      const o = Math.min(0.2 + 0.8 * enter, 1 - 0.5 * leave);
      const tf = settled ? '' : `translate3d(0, ${y.toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
      const op = settled ? '' : o.toFixed(3);
      for (const p of parts) {
        if (p.style.transform !== tf) p.style.transform = tf;
        if (p.style.opacity !== op) p.style.opacity = op;
      }
    }
  };

  const setMode = () => {
    html.classList.toggle('m-motion', mq.matches);
    collect();
    if (mq.matches) paint(); else clear();
  };
  mq.addEventListener?.('change', setMode);
  setMode();
  onScroll(paint);
  addEventListener('layoutchange', setMode); // fired when sections are reordered/hidden

  /* ---------- Chrome tucks away while reading down ---------- */
  let lastY = scrollY, run = 0;
  const show = () => { nav?.classList.remove('is-hidden'); tabbar?.classList.remove('is-tucked'); };
  const hide = () => { nav?.classList.add('is-hidden'); tabbar?.classList.add('is-tucked'); };
  onScroll(() => {
    const y = scrollY, dy = y - lastY;
    lastY = y;
    if (!mq.matches || html.classList.contains('lb-open')) return show();
    const nearEnd = y + innerHeight > html.scrollHeight - 120;
    if (y < 140 || nearEnd || programmatic) { run = 0; return show(); }
    run = Math.sign(dy) === Math.sign(run) ? run + dy : dy;
    if (run > 28) hide();
    else if (run < -14) show();
  });
  // Any focus inside the chrome brings it back (keyboard users)
  [nav, tabbar].forEach((el) => el?.addEventListener('focusin', show));
}
