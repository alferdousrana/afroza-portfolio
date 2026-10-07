/**
 * Palette engine (v2).
 * Studio → Colours & fonts stores four base colours per theme
 * (background, text, accent, button). Everything else — raised panels,
 * lines, secondary text, glows, readable text on buttons — is derived here,
 * and every derived text colour is pushed until it reaches 4.5:1 contrast.
 *
 * The generated CSS is cached in localStorage so the next visit paints the
 * right colours before any script loads (see the boot snippet in <head>).
 */

export const ORIGINAL = {
  dark: { bg: '#14121f', ink: '#f4eef0', accent: '#a99bf0', warm: '#f09a7f' },
  light: { bg: '#fbf6f2', ink: '#26224f', accent: '#4a3f9f', warm: '#e2775b' }
};

export const PRESETS = {
  original: { label: 'Lavender night (original)', ...ORIGINAL },
  ocean: {
    label: 'Deep sea: navy, sky blue, apricot',
    dark: { bg: '#0d1620', ink: '#eaf2f5', accent: '#7cc4e4', warm: '#f2b880' },
    light: { bg: '#f3f7f8', ink: '#122b3a', accent: '#1d5f80', warm: '#e08a4f' }
  },
  forest: {
    label: 'Moss: green ink, sage, honey',
    dark: { bg: '#111612', ink: '#eef1e8', accent: '#a5c98b', warm: '#e8b86b' },
    light: { bg: '#f5f4ec', ink: '#1f2a1e', accent: '#3d6b35', warm: '#c9822f' }
  },
  rose: {
    label: 'Blush: plum, rose, marigold',
    dark: { bg: '#1a1216', ink: '#f7ecef', accent: '#f0a3bf', warm: '#f6c177' },
    light: { bg: '#fcf4f5', ink: '#3a1a28', accent: '#a3325e', warm: '#d9822b' }
  },
  citrus: {
    label: 'Sunlit: olive ink, saffron, teal',
    dark: { bg: '#16140f', ink: '#f5f1e6', accent: '#e9c46a', warm: '#7fb7a4' },
    light: { bg: '#fbf8ef', ink: '#2b2614', accent: '#7a5c00', warm: '#2f7f6b' }
  },
  mono: {
    label: 'Graphite: black and white',
    dark: { bg: '#121212', ink: '#f2f2f2', accent: '#d4d4d4', warm: '#f2f2f2' },
    light: { bg: '#f6f6f4', ink: '#161616', accent: '#3b3b3b', warm: '#161616' }
  }
};

export const PRESET_OPTIONS = [...Object.entries(PRESETS).map(([k, p]) => [k, p.label]), ['custom', 'Custom (my own colours)']];

/* Settings field names for the eight base colours */
export const COLOR_FIELDS = {
  dark: { bg: 'darkBg', ink: 'darkInk', accent: 'darkAccent', warm: 'darkWarm' },
  light: { bg: 'lightBg', ink: 'lightInk', accent: 'lightAccent', warm: 'lightWarm' }
};

/* ---------- colour maths ---------- */
const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
export const isHex = (v) => HEX.test(String(v || '').trim());
const toRgb = (hex) => {
  let h = HEX.exec(String(hex).trim())[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (rgb) => `#${rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a, b, t) => toHex(toRgb(a).map((c, i) => c + (toRgb(b)[i] - c) * t));
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (hex) => { const [r, g, b] = toRgb(hex); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
/** Push fg away from bg until it reaches the target ratio. */
function readable(fg, bg, min = 4.5) {
  const towards = lum(bg) < 0.25 ? '#ffffff' : '#000000';
  let c = fg;
  for (let i = 0; i < 24 && contrast(c, bg) < min; i++) c = mix(c, towards, 0.1);
  return c;
}
const rgbList = (hex, sep = ' ') => toRgb(hex).join(sep);

/* ---------- derive a full token set from four colours ---------- */
function tokens({ bg, ink, accent, warm }) {
  const dark = lum(bg) < 0.25;
  const raised = dark ? mix(bg, ink, 0.045) : mix(bg, '#ffffff', 0.8);
  const acc = readable(accent, bg);
  const pickInk = (fill) => {
    const deep = mix(bg, '#000000', dark ? 0.15 : 0.0);
    const deepInk = dark ? deep : ink;
    return contrast(fill, deepInk) >= contrast(fill, '#ffffff') ? deepInk : '#ffffff';
  };
  return {
    dark,
    vars: {
      '--c-bg': bg,
      '--c-bg-raised': raised,
      '--c-bg-sunk': dark ? mix(bg, '#000000', 0.22) : mix(bg, ink, 0.035),
      '--c-bg-hover': dark ? mix(bg, ink, 0.09) : mix(bg, ink, 0.06),
      '--c-ink': ink,
      '--c-ink-rgb': rgbList(ink),
      '--c-ink-2': readable(mix(ink, bg, 0.32), bg, 4.6),
      '--c-ink-3': mix(ink, bg, 0.52),
      '--c-raised-rgb': rgbList(raised),
      '--c-line': `rgb(${rgbList(ink)} / 0.10)`,
      '--c-line-strong': `rgb(${rgbList(ink)} / 0.20)`,
      '--c-accent': acc,
      '--c-accent-rgb': rgbList(acc, ', '),
      '--c-accent-ink': pickInk(acc),
      '--c-accent-hover': mix(acc, dark ? '#ffffff' : '#000000', 0.12),
      '--c-warm': warm,
      '--c-warm-rgb': rgbList(warm, ', '),
      '--c-warm-ink': pickInk(warm),
      '--c-warm-hover': mix(warm, dark ? '#ffffff' : '#000000', 0.12),
      '--c-warm-text': readable(warm, bg),
      '--c-note': mix(warm, '#ffffff', dark ? 0.45 : 0.62),
      '--c-backdrop': dark ? `rgb(${rgbList(mix(bg, '#000000', 0.4))} / 0.65)` : `rgb(${rgbList(ink)} / 0.32)`,
      '--c-cinema': dark ? mix(bg, '#000000', 0.3) : mix(ink, '#000000', 0.45),
      '--dot': `rgb(${rgbList(ink)} / ${dark ? 0.12 : 0.13})`,
      '--glow': dark
        ? `radial-gradient(42% 52% at 76% 44%, rgba(${rgbList(acc, ', ')}, 0.16), transparent 70%), radial-gradient(30% 36% at 88% 70%, rgba(${rgbList(warm, ', ')}, 0.08), transparent 70%)`
        : `radial-gradient(40% 55% at 76% 44%, rgba(${rgbList(mix(acc, '#ffffff', 0.62), ', ')}, 0.55), transparent 70%), radial-gradient(28% 40% at 86% 62%, rgba(${rgbList(mix(warm, '#ffffff', 0.6), ', ')}, 0.55), transparent 70%)`
    }
  };
}
const block = (sel, vars) => `${sel}{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')}}`;

/** Resolve the 8 base colours from settings: field → preset → original. */
export function resolvePalette(s = {}) {
  const preset = PRESETS[s.palettePreset] || PRESETS.original;
  const legacy = /^#?(7b93ff|a99bf0|4a3f9f)$/i.test(s.accentColor || '') ? '' : s.accentColor; // v1 single accent
  const out = {};
  ['dark', 'light'].forEach((t) => {
    out[t] = {};
    Object.entries(COLOR_FIELDS[t]).forEach(([k, field]) => {
      const v = s[field];
      out[t][k] = isHex(v) ? (v.startsWith('#') ? v : `#${v}`)
        : (k === 'accent' && isHex(legacy) && (!s.palettePreset || s.palettePreset === 'original')) ? legacy
          : preset[t][k];
    });
  });
  return out;
}

/** Build the override stylesheet. Returns '' when nothing differs from the defaults. */
export function buildThemeCSS(s = {}) {
  const pal = resolvePalette(s);
  const same = ['dark', 'light'].every((t) => Object.keys(ORIGINAL[t]).every((k) => pal[t][k].toLowerCase() === ORIGINAL[t][k]));
  const ts = Number(s.typeScale) || 1, bs = Number(s.bodyScale) || 1;
  let css = '';
  if (ts !== 1 || bs !== 1) css += `:root{--type-scale:${ts};--body-scale:${bs}}`;
  if (same) return css;
  const D = tokens(pal.dark), L = tokens(pal.light);
  css += block(':root,:root[data-theme="light"] .moment,:root[data-theme="light"] .footer', D.vars);
  css += block(':root[data-theme="light"]', L.vars);
  // The light theme keeps its "navy" footer: the light text colour becomes the panel
  const navy = pal.light.ink;
  css += block(':root[data-theme="light"] .footer', { '--c-bg': navy, '--c-bg-raised': mix(navy, '#ffffff', 0.07), '--c-line': 'rgb(255 255 255 / 0.14)' });
  css += block(':root[data-theme="light"] .moment', { '--c-cinema': mix(navy, '#000000', 0.25) });
  css += `:root[data-theme="light"] .about__statement .w{color:${mix(pal.light.ink, pal.light.bg, 0.72)}}`;
  css += `:root[data-theme="light"] .about__statement .w.is-lit{color:var(--c-ink)}`;
  css += `:root[data-theme="light"] .layers__stage{background-color:${mix(pal.light.bg, '#ffffff', 0.6)}}`;
  return css;
}

const STORE = 'ar-theme-css';
/** Apply colours + type scale now. In Studio, preview without persisting. */
export function applyThemeSettings(s = {}, { persist = true } = {}) {
  const css = buildThemeCSS(s);
  let el = document.getElementById(STORE);
  if (!el) { el = document.createElement('style'); el.id = STORE; }
  el.textContent = css;
  document.head.appendChild(el); // always last, so it wins over tokens.css
  if (persist) {
    try { css ? localStorage.setItem(STORE, css) : localStorage.removeItem(STORE); } catch (e) { /* private mode */ }
  }
  syncThemeColor();
}

/** Keep the browser UI colour (mobile address bar) in step with the page. */
export function syncThemeColor() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--c-bg').trim();
  if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}
addEventListener('themechange', () => requestAnimationFrame(syncThemeColor));

/** Inline boot snippet (copied into each page's <head>, after the stylesheets). */
export const THEME_BOOT = `try{var c=localStorage.getItem('${STORE}');if(c){var s=document.createElement('style');s.id='${STORE}';s.textContent=c;document.head.appendChild(s);}}catch(e){}`;
