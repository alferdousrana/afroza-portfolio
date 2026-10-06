/**
 * Light / dark theme.
 * - First visit follows the system setting (and keeps following it live).
 * - Once the visitor picks a theme with the toggle, that choice is remembered.
 * - The switch animates as a circle growing from the button (View Transitions),
 *   or a quick colour fade where that API isn't supported. No motion for
 *   reduced-motion users.
 * The initial theme is applied by a tiny inline script in <head> so the page
 * never flashes the wrong colours.
 */
const KEY = 'ar-theme';
const META = { dark: '#14121f', light: '#fbf6f2' };
const root = document.documentElement;

export const currentTheme = () => (root.dataset.theme === 'light' ? 'light' : 'dark');

function apply(theme) {
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META[theme]);
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
    b.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    b.setAttribute('aria-pressed', String(theme === 'light'));
  });
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

export function setTheme(theme, origin) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { localStorage.setItem(KEY, theme); } catch (e) { /* private mode */ }
  if (reduce) return apply(theme);

  if (document.startViewTransition && origin) {
    const r = origin.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(() => apply(theme));
    t.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
    return;
  }
  root.classList.add('theme-fade');
  apply(theme);
  setTimeout(() => root.classList.remove('theme-fade'), 360);
}

export function initTheme() {
  apply(currentTheme());
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => setTheme(currentTheme() === 'light' ? 'dark' : 'light', btn));
  });
  // Follow the system until the visitor makes a choice
  matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', (e) => {
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (err) { /* ignore */ }
    if (!saved) apply(e.matches ? 'light' : 'dark');
  });
}

/** Inline-able boot snippet (kept here for reference; copied into each page's <head>). */
export const BOOT = `try{var t=localStorage.getItem('${KEY}')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=t;}catch(e){}`;
