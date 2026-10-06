/**
 * Font pairs selectable from Studio → Settings → Theme.
 * Each pair = Google Fonts URL + display/body stacks + display weight/tracking.
 * The chosen pair is cached in localStorage so the inline <head> script can
 * apply it before first paint on the next visit (no font flash).
 *
 * Preview any pair without saving: add ?font=<key> to the URL,
 * e.g. index.html?font=editorial
 */
const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

export const FONT_PAIRS = {
  geist: {
    label: 'Geist — clean, technical (default)',
    url: 'family=Geist:wght@300..700',
    display: `"Geist", ${SANS}`, body: `"Geist", ${SANS}`, weight: 500, tracking: '-0.035em'
  },
  editorial: {
    label: 'Playfair Display + Inter — editorial serif (like the reference)',
    url: 'family=Playfair+Display:wght@400..700&family=Inter:wght@300..700',
    display: `"Playfair Display", ${SERIF}`, body: `"Inter", ${SANS}`, weight: 400, tracking: '-0.015em'
  },
  cormorant: {
    label: 'Cormorant Garamond + Manrope — elegant, luxurious',
    url: 'family=Cormorant+Garamond:wght@400;500;600&family=Manrope:wght@300..700',
    display: `"Cormorant Garamond", ${SERIF}`, body: `"Manrope", ${SANS}`, weight: 500, tracking: '-0.01em'
  },
  dmserif: {
    label: 'DM Serif Display + DM Sans — warm, classic',
    url: 'family=DM+Serif+Display&family=DM+Sans:opsz,wght@9..40,300..700',
    display: `"DM Serif Display", ${SERIF}`, body: `"DM Sans", ${SANS}`, weight: 400, tracking: '-0.01em'
  },
  fraunces: {
    label: 'Fraunces + Inter — soft, characterful serif',
    url: 'family=Fraunces:opsz,wght@9..144,300..700&family=Inter:wght@300..700',
    display: `"Fraunces", ${SERIF}`, body: `"Inter", ${SANS}`, weight: 400, tracking: '-0.02em'
  },
  jakarta: {
    label: 'Plus Jakarta Sans — friendly, modern',
    url: 'family=Plus+Jakarta+Sans:wght@300..700',
    display: `"Plus Jakarta Sans", ${SANS}`, body: `"Plus Jakarta Sans", ${SANS}`, weight: 600, tracking: '-0.035em'
  },
  manrope: {
    label: 'Manrope — geometric, product-like',
    url: 'family=Manrope:wght@300..700',
    display: `"Manrope", ${SANS}`, body: `"Manrope", ${SANS}`, weight: 600, tracking: '-0.035em'
  }
};

export const FONT_OPTIONS = Object.entries(FONT_PAIRS).map(([value, p]) => [value, p.label]);
const KEY = 'ar-font';

/** Apply a pair now: load its stylesheet and set the CSS variables. */
export function applyFontPair(key, { persist = true } = {}) {
  const preview = new URLSearchParams(location.search).get('font');
  if (preview && FONT_PAIRS[preview]) { key = preview; persist = false; }
  const p = FONT_PAIRS[key] || FONT_PAIRS.geist;
  const href = `https://fonts.googleapis.com/css2?${p.url}&display=swap`;
  let link = document.getElementById('font-pair');
  if (!link) {
    link = Object.assign(document.createElement('link'), { id: 'font-pair', rel: 'stylesheet' });
    document.head.appendChild(link);
  }
  if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  const st = document.documentElement.style;
  st.setProperty('--f-display', p.display);
  st.setProperty('--f-body', p.body);
  st.setProperty('--fw-display', p.weight);
  st.setProperty('--ls-display', p.tracking);
  if (persist) {
    try { localStorage.setItem(KEY, JSON.stringify({ href, display: p.display, body: p.body, weight: p.weight, tracking: p.tracking })); } catch (e) { /* ignore */ }
  }
}

/** Inline boot snippet (copied into each page's <head>). */
export const FONT_BOOT = `try{var f=JSON.parse(localStorage.getItem('${KEY}')||'null');if(f&&f.href){var l=document.createElement('link');l.id='font-pair';l.rel='stylesheet';l.href=f.href;document.head.appendChild(l);var s=document.documentElement.style;s.setProperty('--f-display',f.display);s.setProperty('--f-body',f.body);s.setProperty('--fw-display',f.weight);s.setProperty('--ls-display',f.tracking);}}catch(e){}`;
