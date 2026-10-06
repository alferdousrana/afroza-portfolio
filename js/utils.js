/* Small, dependency-free helpers shared by the site, case study and admin. */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export const motionOK = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Escape text for safe HTML interpolation. */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Allow only http(s), mailto, tel, hash and relative URLs. */
export function safeUrl(url, fallback = '#') {
  const u = String(url ?? '').trim();
  if (!u) return fallback;
  if (/^(https?:|mailto:|tel:|#|\.\/|\/(?!\/))/i.test(u)) return u;
  return fallback;
}

/**
 * Allow-list HTML sanitizer for rich text written in the admin.
 * Anything not explicitly allowed is unwrapped (text kept, tag dropped).
 */
const ALLOWED = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'A', 'H3', 'H4', 'BLOCKQUOTE']);
export function sanitizeHTML(html) {
  if (!html) return '';
  const tpl = document.createElement('template');
  tpl.innerHTML = String(html);
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 1) {
        walk(child);
        if (!ALLOWED.has(child.tagName)) {
          child.replaceWith(...child.childNodes);
          return;
        }
        [...child.attributes].forEach((attr) => {
          if (child.tagName === 'A' && attr.name === 'href') return;
          child.removeAttribute(attr.name);
        });
        if (child.tagName === 'A') {
          child.setAttribute('href', safeUrl(child.getAttribute('href')));
          child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noopener');
        }
      } else if (child.nodeType !== 3) {
        child.remove();
      }
    });
  };
  walk(tpl.content);
  return tpl.innerHTML;
}

/** Plain text → paragraphs (for fields that may be plain or rich). */
export function richOrPlain(value) {
  const v = String(value ?? '').trim();
  if (!v) return '';
  if (/<[a-z][\s\S]*>/i.test(v)) return sanitizeHTML(v);
  return v.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
}

export const byOrder = (a, b) => (a.order ?? 999) - (b.order ?? 999);

export function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export function debounce(fn, ms = 150) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/** Promise with timeout so a slow network never blocks the UI. */
export function withTimeout(promise, ms, label = 'timeout') {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error(label)), ms))]);
}

let toastTimer;
export function toast(message, ms = 2600) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), ms);
}

/**
 * Apply an admin-chosen accent colour.
 * The same hue is adjusted per theme until it reaches 4.5:1 against the
 * background, so a custom accent can never make text unreadable.
 * The default accent is left to the theme tokens.
 */
const DEFAULTS = ['7b93ff', 'a99bf0', '4a3f9f'];
let accentBase = null;
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
export function applyAccent(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return;
  accentBase = m[1].toLowerCase();
  paintAccent();
}
function paintAccent() {
  const st = document.documentElement.style;
  if (!accentBase || DEFAULTS.includes(accentBase)) {
    ['--c-accent', '--c-accent-rgb', '--c-accent-ink', '--c-accent-hover'].forEach((p) => st.removeProperty(p));
    return;
  }
  const n = parseInt(accentBase, 16);
  let rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const light = document.documentElement.dataset.theme === 'light';
  const bg = light ? [251, 246, 242] : [20, 18, 31];
  for (let i = 0; i < 20 && ratio(rgb, bg) < 4.5; i++) {
    rgb = rgb.map((c) => Math.round(light ? c * 0.9 : c + (255 - c) * 0.12));
  }
  const hexOut = `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  st.setProperty('--c-accent', hexOut);
  st.setProperty('--c-accent-hover', hexOut);
  st.setProperty('--c-accent-rgb', rgb.join(', '));
  st.setProperty('--c-accent-ink', ratio(rgb, [16, 18, 24]) >= ratio(rgb, [255, 255, 255]) ? '#101218' : '#ffffff');
}
window.addEventListener('themechange', paintAccent);

/** Social icon paths (simple, 24×24, filled). */
export const ICONS = {
  behance: '<path d="M8.2 11.3c.9-.4 1.5-1.2 1.5-2.4C9.7 6.5 8 6 6.1 6H1v12h5.3c2 0 4-.9 4-3.4 0-1.5-.7-2.7-2.1-3.3zM3.5 8h2.3c.9 0 1.6.3 1.6 1.2 0 .9-.6 1.3-1.5 1.3H3.5zm2.5 8H3.5v-3.3H6c1 0 1.8.4 1.8 1.7S7 16 6 16zm11.4-7.4c-2.8 0-4.6 2-4.6 4.6 0 2.7 1.7 4.6 4.6 4.6 2.2 0 3.6-1 4.3-3.1h-2.2c-.3.8-1.2 1.2-2 1.2-1.5 0-2.3-.9-2.3-2.4h6.6c.1-2.8-1.4-4.9-4.4-4.9zm-2.2 3.8c.1-1.1.8-1.9 2.1-1.9 1.2 0 1.9.7 2 1.9zM15 6.5h5v1.3h-5z"/>',
  linkedin: '<path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5zM3 9.75h4V21H3zM9.5 9.75h3.8v1.6h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1V21h-4v-4.9c0-1.17-.02-2.68-1.63-2.68-1.64 0-1.89 1.28-1.89 2.6V21h-4z"/>',
  facebook: '<path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.87.25-1.46 1.5-1.46h1.6V4.46A21 21 0 0 0 14.27 4.3c-2.3 0-3.87 1.4-3.87 3.98V10.5H8v3h2.4V21z"/>',
  dribbble: '<path d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zm6.2 4.5a8 8 0 0 1 1.8 5c-.3-.06-2.9-.6-5.6-.25l-.66-1.55c2.95-1.2 4.3-2.95 4.46-3.2zM12 4a8 8 0 0 1 5.3 2c-.13.2-1.35 1.83-4.2 2.9A41 41 0 0 0 10.13 4.2 8 8 0 0 1 12 4zm-3.5.8a48 48 0 0 1 2.94 4.58 30 30 0 0 1-7.33.96A8.03 8.03 0 0 1 8.5 4.8zM4 12v-.25a29 29 0 0 0 8.1-1.12l.62 1.32c-3.4 1.1-5.2 4.04-5.36 4.3A8 8 0 0 1 4 12zm8 8a8 8 0 0 1-4.9-1.67c.12-.25 1.46-2.84 5.26-4.17a33 33 0 0 1 1.7 6.06A8 8 0 0 1 12 20zm3.6-.9a35 35 0 0 0-1.55-5.68c2.5-.4 4.7.26 4.97.35a8 8 0 0 1-3.42 5.33z"/>',
  mail: '<path d="M3 5.5h18v13H3zm1.6 1.5 7.4 5.4L19.4 7z" fill-rule="evenodd"/>',
  link: '<path d="M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a1 1 0 1 1 1.4 1.4L12 13.4a1 1 0 0 1-1.4 0zM8.5 19.5a4 4 0 0 1-2.8-6.8l2-2a1 1 0 1 1 1.4 1.4l-2 2a2 2 0 0 0 2.8 2.8l2-2a1 1 0 1 1 1.4 1.4l-2 2a4 4 0 0 1-2.8 1.2zm7.2-6.4a1 1 0 0 1-.7-1.7l2-2a2 2 0 0 0-2.8-2.8l-2 2a1 1 0 1 1-1.4-1.4l2-2a4 4 0 0 1 5.6 5.6l-2 2a1 1 0 0 1-.7.3z"/>'
};
export const iconSvg = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.link}</svg>`;
