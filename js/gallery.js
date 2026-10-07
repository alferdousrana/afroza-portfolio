/**
 * Gallery (v2): a moodboard of work and moments, managed in Studio → Gallery.
 *  - Mixed tile sizes (normal / wide / tall / large) on a dense grid
 *  - Category filters; tiles glide to their new place (FLIP)
 *  - Images drift inside their frames as you scroll (parallax)
 *  - Lightbox grows out of the tile; swipe sideways to browse, down to close
 */
import { $, $$, esc, safeUrl, motionOK, clamp } from './utils.js';
import { onScroll } from './animations.js';

const SIZES = ['normal', 'wide', 'tall', 'large'];
let items = [];
let shown = [];

export function renderGallery(list = []) {
  const section = $('#gallery'), grid = $('#galGrid'), filters = $('#galFilters');
  if (!section || !grid) return;
  items = list.filter((g) => g?.image?.url);
  if (!items.length) { section.hidden = true; return; }

  grid.innerHTML = items.map((g, i) => {
    const size = SIZES.includes(g.size) ? g.size : 'normal';
    const title = g.title || g.caption || 'Image';
    return `<li class="gal-item gal-item--${size}" data-i="${i}" data-cat="${esc(g.category || '')}" style="--i:${i % 6}">
      <button class="gal-item__btn" type="button" data-cursor="View" data-cursor-size="lg" aria-label="View larger: ${esc(title)}">
        <span class="gal-item__media"><img src="${esc(g.image.url)}" alt="${esc(g.image.alt || title)}" loading="lazy" decoding="async"></span>
        <span class="gal-item__cap" aria-hidden="true"><b>${esc(title)}</b>${g.caption && g.caption !== title ? `<span>${esc(g.caption)}</span>` : ''}</span>
      </button>
    </li>`;
  }).join('');

  // A missing image never leaves a hole
  $$('img', grid).forEach((img) => img.addEventListener('error', () => { img.closest('.gal-item')?.remove(); refreshShown(); }, { once: true }));

  /* ---------- Filters ---------- */
  const cats = [...new Set(items.map((g) => g.category).filter(Boolean))];
  if (filters) {
    if (cats.length > 1) {
      const count = (c) => items.filter((g) => g.category === c).length;
      filters.innerHTML = [`<button class="filter" type="button" aria-pressed="true" data-filter="">All<span class="n">${items.length}</span></button>`]
        .concat(cats.map((c) => `<button class="filter" type="button" aria-pressed="false" data-filter="${esc(c)}">${esc(c)}<span class="n">${count(c)}</span></button>`)).join('');
      filters.addEventListener('click', (e) => {
        const b = e.target.closest('.filter'); if (!b) return;
        $$('.filter', filters).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        applyFilter(grid, b.dataset.filter);
      });
    } else filters.hidden = true;
  }

  /* ---------- Reveal: tiles open like frames being placed ---------- */
  const tiles = $$('.gal-item', grid);
  if (motionOK() && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    tiles.forEach((t) => io.observe(t));
    initParallax(grid);
  } else tiles.forEach((t) => t.classList.add('is-in'));

  refreshShown();
  grid.addEventListener('click', (e) => {
    const li = e.target.closest('.gal-item'); if (!li) return;
    openLightbox(shown.indexOf(li), li);
  });
  initLightbox();
}

function refreshShown() { shown = $$('#galGrid .gal-item:not(.is-filtered)'); }

/* FLIP: tiles slide from where they were to where they land */
function applyFilter(grid, cat) {
  const tiles = $$('.gal-item', grid);
  const before = new Map(tiles.map((t) => [t, t.getBoundingClientRect()]));
  tiles.forEach((t) => t.classList.toggle('is-filtered', !!cat && t.dataset.cat !== cat));
  refreshShown();
  $('#galStatus').textContent = `${shown.length} image${shown.length === 1 ? '' : 's'} shown`;
  if (!motionOK()) return;
  shown.forEach((t, k) => {
    const a = before.get(t), b = t.getBoundingClientRect();
    const wasHidden = !a.width;
    if (wasHidden) {
      t.animate([{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: k * 30, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' });
      return;
    }
    const dx = a.left - b.left, dy = a.top - b.top, sx = a.width / b.width, sy = a.height / b.height;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01) return;
    t.animate([{ transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, { transformOrigin: 'top left', transform: 'none' }],
      { duration: 620, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
  });
}

/* Images drift inside their frames: depth without moving the layout */
function initParallax(grid) {
  const visible = new Set();
  const io = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))));
  $$('.gal-item__media', grid).forEach((m) => io.observe(m));
  onScroll(() => {
    if (!visible.size) return;
    const vh = innerHeight;
    visible.forEach((m) => {
      const r = m.getBoundingClientRect();
      const p = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1); // -1 top … 1 bottom
      m.style.setProperty('--py', `${(p * 7).toFixed(2)}%`);
    });
  });
}

/* ==========================================================================
   Lightbox
   ========================================================================== */
let lb = null;
function initLightbox() {
  if (lb) return;
  const d = $('#lightbox');
  if (!d) return;
  lb = { d, stage: $('#lbStage'), title: $('#lbTitle'), cap: $('#lbCap'), count: $('#lbCount'), i: 0 };
  $('#lbClose').addEventListener('click', closeLightbox);
  $('#lbPrev').addEventListener('click', () => go(-1));
  $('#lbNext').addEventListener('click', () => go(1));
  d.addEventListener('cancel', (e) => { e.preventDefault(); closeLightbox(); });
  d.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  });
  lb.stage.addEventListener('click', (e) => { if (e.target === lb.stage) closeLightbox(); });

  // Swipe: follow the finger, then decide (sideways = browse, down = close)
  let drag = null;
  lb.stage.addEventListener('pointerdown', (e) => {
    const img = $('img', lb.stage);
    if (!img || e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, img, t: performance.now(), axis: null };
    lb.stage.setPointerCapture(e.pointerId);
  });
  lb.stage.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.axis ??= Math.abs(dx) > 8 ? 'x' : Math.abs(dy) > 8 ? 'y' : null;
    if (drag.axis === 'x') drag.img.style.transform = `translateX(${dx}px) rotate(${dx / 60}deg)`;
    if (drag.axis === 'y' && dy > 0) {
      drag.img.style.transform = `translateY(${dy}px) scale(${1 - Math.min(dy / 1600, 0.15)})`;
      lb.d.style.setProperty('--fade', String(1 - Math.min(dy / 500, 0.7)));
    }
  });
  const end = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y, fast = performance.now() - drag.t < 260;
    const { img, axis } = drag; drag = null;
    if (axis === 'x' && (Math.abs(dx) > 80 || (fast && Math.abs(dx) > 30))) return go(dx < 0 ? 1 : -1, dx);
    if (axis === 'y' && (dy > 120 || (fast && dy > 50))) return closeLightbox();
    img.style.transition = 'transform 420ms cubic-bezier(0.34, 1.4, 0.64, 1)';
    img.style.transform = '';
    lb.d.style.removeProperty('--fade');
    setTimeout(() => { img.style.transition = ''; }, 440);
  };
  lb.stage.addEventListener('pointerup', end);
  lb.stage.addEventListener('pointercancel', end);
}

function paint(dir = 0, fromDx = 0) {
  const g = items[+shown[lb.i].dataset.i];
  const title = g.title || '';
  const link = g.link ? safeUrl(g.link, '') : '';
  lb.title.textContent = title;
  lb.cap.innerHTML = `${esc(g.caption && g.caption !== title ? g.caption : '')}${g.year ? ` <span class="lightbox__year">${esc(g.year)}</span>` : ''}${link ? ` <a class="link-arrow" href="${esc(link)}" ${/^https?:/i.test(link) ? 'target="_blank" rel="noopener"' : ''}>Open</a>` : ''}`;
  lb.count.textContent = `${lb.i + 1} of ${shown.length}`;
  const img = new Image();
  img.src = g.image.url; img.alt = g.image.alt || title; img.decoding = 'async'; img.draggable = false;
  const old = $('img', lb.stage);
  lb.stage.append(img);
  if (old) {
    if (motionOK() && dir) {
      old.animate([{ transform: old.style.transform || `translateX(${fromDx}px)` , opacity: 1 }, { transform: `translateX(${dir * -40}%)`, opacity: 0 }], { duration: 380, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }).finished.then(() => old.remove());
      img.animate([{ transform: `translateX(${dir * 40}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    } else old.remove();
  }
  // Preload neighbours so browsing feels instant
  [-1, 1].forEach((k) => { const n = shown[(lb.i + k + shown.length) % shown.length]; if (n) new Image().src = items[+n.dataset.i].image.url; });
  const single = shown.length < 2;
  $('#lbPrev').hidden = single; $('#lbNext').hidden = single;
  return img;
}

function go(step, fromDx = 0) {
  if (!lb || shown.length < 2) return;
  lb.i = (lb.i + step + shown.length) % shown.length;
  paint(step, fromDx);
}

let opener = null;
function openLightbox(i, tile) {
  if (!lb || i < 0) return;
  opener = tile;
  lb.i = i;
  lb.stage.innerHTML = '';
  lb.d.style.removeProperty('--fade');
  document.documentElement.classList.add('lb-open');
  lb.d.showModal();
  const img = paint();
  $('#lbClose').focus({ preventScroll: true });
  if (!motionOK() || !tile) return;
  // Grow out of the tile that was tapped
  const from = $('.gal-item__media', tile).getBoundingClientRect();
  const grow = () => {
    const to = img.getBoundingClientRect();
    if (!to.width) return;
    const sx = from.width / to.width, sy = from.height / to.height;
    const s = Math.max(sx, sy);
    img.animate([
      { transform: `translate(${from.left + from.width / 2 - (to.left + to.width / 2)}px, ${from.top + from.height / 2 - (to.top + to.height / 2)}px) scale(${s})`, clipPath: `inset(${(1 - sy / s) * 50}% ${(1 - sx / s) * 50}% round 12px)` },
      { transform: 'none', clipPath: 'inset(0 0 0 0 round 0px)' }
    ], { duration: 560, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
  };
  img.complete ? grow() : img.addEventListener('load', grow, { once: true });
}

function closeLightbox() {
  if (!lb?.d.open) return;
  const finish = () => {
    lb.d.close(); lb.d.classList.remove('is-closing');
    document.documentElement.classList.remove('lb-open');
    $('.gal-item__btn', opener || document)?.focus({ preventScroll: true });
  };
  if (!motionOK()) return finish();
  lb.d.classList.add('is-closing');
  setTimeout(finish, 260);
}
