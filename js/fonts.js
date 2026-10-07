/**
 * Font pairs selectable from Studio → Colours & fonts (v2).
 * Each pair = Google Fonts query + display/body stacks + display weight/tracking.
 * "custom" lets the admin type any Google Fonts family name.
 *
 * The chosen fonts are cached in localStorage so the inline <head> script can
 * apply them before first paint on the next visit (no font flash).
 * Preview any pair without saving: add ?font=<key> to the URL.
 */
const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

export const FONT_PAIRS = {
  geist: { label: 'Geist: clean, technical (default)', url: 'family=Geist:wght@300..700', display: `"Geist", ${SANS}`, body: `"Geist", ${SANS}`, weight: 500, tracking: '-0.035em' },
  editorial: { label: 'Playfair Display + Inter: editorial serif', url: 'family=Playfair+Display:wght@400..700&family=Inter:wght@300..700', display: `"Playfair Display", ${SERIF}`, body: `"Inter", ${SANS}`, weight: 400, tracking: '-0.015em' },
  cormorant: { label: 'Cormorant Garamond + Manrope: elegant', url: 'family=Cormorant+Garamond:wght@400;500;600&family=Manrope:wght@300..700', display: `"Cormorant Garamond", ${SERIF}`, body: `"Manrope", ${SANS}`, weight: 500, tracking: '-0.01em' },
  dmserif: { label: 'DM Serif Display + DM Sans: warm, classic', url: 'family=DM+Serif+Display&family=DM+Sans:opsz,wght@9..40,300..700', display: `"DM Serif Display", ${SERIF}`, body: `"DM Sans", ${SANS}`, weight: 400, tracking: '-0.01em' },
  fraunces: { label: 'Fraunces + Inter: soft, characterful serif', url: 'family=Fraunces:opsz,wght@9..144,300..700&family=Inter:wght@300..700', display: `"Fraunces", ${SERIF}`, body: `"Inter", ${SANS}`, weight: 400, tracking: '-0.02em' },
  instrument: { label: 'Instrument Serif + Instrument Sans: refined', url: 'family=Instrument+Serif&family=Instrument+Sans:wght@400..700', display: `"Instrument Serif", ${SERIF}`, body: `"Instrument Sans", ${SANS}`, weight: 400, tracking: '-0.01em' },
  jakarta: { label: 'Plus Jakarta Sans: friendly, modern', url: 'family=Plus+Jakarta+Sans:wght@300..700', display: `"Plus Jakarta Sans", ${SANS}`, body: `"Plus Jakarta Sans", ${SANS}`, weight: 600, tracking: '-0.035em' },
  manrope: { label: 'Manrope: geometric, product-like', url: 'family=Manrope:wght@300..700', display: `"Manrope", ${SANS}`, body: `"Manrope", ${SANS}`, weight: 600, tracking: '-0.035em' },
  sora: { label: 'Sora + Inter: futuristic, wide', url: 'family=Sora:wght@300..700&family=Inter:wght@300..700', display: `"Sora", ${SANS}`, body: `"Inter", ${SANS}`, weight: 500, tracking: '-0.04em' },
  grotesk: { label: 'Space Grotesk + Inter: quirky tech', url: 'family=Space+Grotesk:wght@300..700&family=Inter:wght@300..700', display: `"Space Grotesk", ${SANS}`, body: `"Inter", ${SANS}`, weight: 500, tracking: '-0.035em' },
  outfit: { label: 'Outfit: rounded, approachable', url: 'family=Outfit:wght@300..700', display: `"Outfit", ${SANS}`, body: `"Outfit", ${SANS}`, weight: 500, tracking: '-0.03em' },
  poppins: { label: 'Poppins: bold, geometric', url: 'family=Poppins:wght@300;400;500;600;700', display: `"Poppins", ${SANS}`, body: `"Poppins", ${SANS}`, weight: 600, tracking: '-0.035em' }
};

export const FONT_OPTIONS = [...Object.entries(FONT_PAIRS).map(([value, p]) => [value, p.label]), ['custom', 'Custom: any Google Font']];
const KEY = 'ar-font';
const fam = (name) => String(name || '').trim().replace(/["<>;{}]/g, '');
const css2 = (q) => `https://fonts.googleapis.com/css2?${q}&display=swap`;

/** Build a pair object for custom Google Fonts names. */
export function customPair({ display, body, weight } = {}) {
  const d = fam(display) || 'Geist', b = fam(body) || d;
  const serifish = /serif|garamond|playfair|fraunces|lora|merriweather|baskerville|caslon|bodoni/i.test(d) && !/sans/i.test(d);
  return {
    families: [...new Set([d, b])],
    display: `"${d}", ${serifish ? SERIF : SANS}`,
    body: `"${b}", ${SANS}`,
    weight: Number(weight) || 500,
    tracking: serifish ? '-0.015em' : '-0.03em'
  };
}

/* Static fonts reject weights they don't have, so try a few requests per family */
function loadFamily(name, id) {
  const q = name.replace(/ /g, '+');
  const tries = [`family=${q}:wght@300;400;500;600;700`, `family=${q}:wght@400;700`, `family=${q}`];
  return new Promise((resolve) => {
    let i = 0;
    let link = document.getElementById(id);
    const next = () => {
      if (i >= tries.length) return resolve(null);
      const href = css2(tries[i++]);
      if (link?.getAttribute('href') === href) return resolve(href);
      link?.remove();
      link = Object.assign(document.createElement('link'), { id, rel: 'stylesheet', href });
      link.onload = () => resolve(href);
      link.onerror = next;
      document.head.appendChild(link);
    };
    next();
  });
}

function setVars(p) {
  const st = document.documentElement.style;
  st.setProperty('--f-display', p.display);
  st.setProperty('--f-body', p.body);
  st.setProperty('--fw-display', p.weight);
  st.setProperty('--ls-display', p.tracking);
}

/** Apply a pair now: load its stylesheet(s) and set the CSS variables. */
export async function applyFontPair(key, { persist = true, custom = null } = {}) {
  const preview = new URLSearchParams(location.search).get('font');
  if (preview && FONT_PAIRS[preview]) { key = preview; persist = false; }
  document.getElementById('font-pair-2')?.remove();

  if (key === 'custom' && custom && fam(custom.display)) {
    const p = customPair(custom);
    setVars(p);
    const hrefs = (await Promise.all(p.families.map((f, i) => loadFamily(f, i ? 'font-pair-2' : 'font-pair')))).filter(Boolean);
    if (persist && hrefs.length) {
      try { localStorage.setItem(KEY, JSON.stringify({ href: hrefs[0], href2: hrefs[1] || '', display: p.display, body: p.body, weight: p.weight, tracking: p.tracking })); } catch (e) { /* ignore */ }
    }
    return;
  }

  const p = FONT_PAIRS[key] || FONT_PAIRS.geist;
  const href = css2(p.url);
  let link = document.getElementById('font-pair');
  if (!link) {
    link = Object.assign(document.createElement('link'), { id: 'font-pair', rel: 'stylesheet' });
    document.head.appendChild(link);
  }
  if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  setVars(p);
  if (persist) {
    try { localStorage.setItem(KEY, JSON.stringify({ href, display: p.display, body: p.body, weight: p.weight, tracking: p.tracking })); } catch (e) { /* ignore */ }
  }
}

/** Inline boot snippet (copied into each page's <head>). */
export const FONT_BOOT = `try{var f=JSON.parse(localStorage.getItem('${KEY}')||'null');if(f&&f.href){[f.href,f.href2].forEach(function(h,i){if(!h)return;var l=document.createElement('link');l.id=i?'font-pair-2':'font-pair';l.rel='stylesheet';l.href=h;document.head.appendChild(l);});var s=document.documentElement.style;s.setProperty('--f-display',f.display);s.setProperty('--f-body',f.body);s.setProperty('--fw-display',f.weight);s.setProperty('--ls-display',f.tracking);}}catch(e){}`;
