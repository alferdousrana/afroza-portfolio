/**
 * Selected work — sticky storytelling.
 * Desktop: a sticky stage on the left swaps covers (clip-path wipe) as each
 *          project chapter on the right reaches the reading line.
 * Mobile:  chapters become a swipeable, snap-scrolling full-bleed gallery.
 * Opening a project plays a curtain transition into the case-study page.
 */
import { $, $$, esc, safeUrl, motionOK } from './utils.js';
import { observeReveals } from './animations.js';

export function coverHTML(p, { eager = false } = {}) {
  const gen = `<div class="gen-cover" style="--hue:${Number(p.hue) || 228}" role="img" aria-label="${esc(p.title)} cover">
    <span class="gen-cover__device"></span><span class="gen-cover__device"></span>
    <span class="gen-cover__title" aria-hidden="true">${esc(p.title)}</span></div>`;
  if (!p.coverImage?.url) return gen;
  return `<img src="${esc(p.coverImage.url)}" alt="${esc(p.coverImage.alt || `${p.title} cover`)}"
    ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" data-fallback="${encodeURIComponent(gen)}">`;
}

/** Replace failed images with the generated cover so layout never breaks. */
export function guardImages(root = document) {
  $$('img[data-fallback]', root).forEach((img) => {
    const swap = () => { img.outerHTML = decodeURIComponent(img.dataset.fallback); };
    if (img.complete && img.naturalWidth === 0 && img.src) swap();
    else img.addEventListener('error', swap, { once: true });
  });
}

export const caseUrl = (p) => `./case-study.html?p=${encodeURIComponent(p.slug || p.id)}`;

/** Curtain page transition (skipped for reduced motion / modified clicks). */
export function transitionTo(url, label = '') {
  const curtain = $('#curtain');
  if (!curtain || !motionOK()) { location.href = url; return; }
  $('.curtain__label', curtain).textContent = label;
  curtain.classList.add('is-on');
  try { sessionStorage.setItem('ar-transition', '1'); } catch (e) { /* ignore */ }
  setTimeout(() => { location.href = url; }, 620);
}

export function renderWork(projects) {
  const chapters = $('#workChapters'), stage = $('#workStage'), filtersEl = $('#workFilters');
  if (!chapters || !stage) return;

  if (!projects.length) {
    stage.hidden = true;
    filtersEl.innerHTML = '';
    chapters.innerHTML = '<li class="work__empty">No projects published yet. New case studies are on the way. Meanwhile, see the work on Behance.</li>';
    return;
  }

  /* ---------- Chapters ---------- */
  chapters.innerHTML = projects.map((p, i) => {
    const beats = [['Problem', p.problem], ['Solution', p.solution], ['Outcome', p.outcome]].filter(([, v]) => v);
    const meta = [p.industry, p.role, p.year].filter(Boolean);
    return `<li class="chapter" data-index="${i}" data-tags="${esc((p.tags || []).join('|'))}" id="project-${esc(p.slug || p.id)}">
      <a class="chapter__cover" href="${esc(caseUrl(p))}" data-case="${i}" data-cursor="View case study" data-cursor-size="lg" tabindex="-1" aria-hidden="true">${coverHTML(p)}</a>
      <p class="chapter__cat">${esc(p.category || '')}</p>
      <h3 class="chapter__title"><a href="${esc(caseUrl(p))}" data-case="${i}" data-cursor="View case study" data-cursor-size="lg">${esc(p.title)}</a></h3>
      ${p.shortDescription ? `<p class="chapter__desc">${esc(p.shortDescription)}</p>` : ''}
      ${beats.length ? `<dl class="chapter__story">${beats.map(([k, v]) => `<div class="story-beat"><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      ${meta.length ? `<div class="chapter__meta">${meta.map((m) => `<span class="tag">${esc(m)}</span>`).join('')}</div>` : ''}
      <div class="chapter__actions">
        <a class="btn btn--ghost magnetic" href="${esc(caseUrl(p))}" data-case="${i}" data-cursor="View case study" data-cursor-size="lg">View case study</a>
        ${p.behanceUrl ? `<a class="link-arrow" href="${esc(safeUrl(p.behanceUrl))}" target="_blank" rel="noopener" data-cursor="Open">On Behance</a>` : ''}
      </div>
    </li>`;
  }).join('');

  /* ---------- Sticky stage ---------- */
  stage.innerHTML = `
    <div class="stage-media">
      ${projects.map((p, i) => `<a class="stage-slide${i === 0 ? ' is-active' : ''}" href="${esc(caseUrl(p))}" data-case="${i}" data-cursor="Explore" data-cursor-size="lg" tabindex="-1">${coverHTML(p, { eager: i === 0 })}</a>`).join('')}
    </div>
    <div class="stage-caption">
      <span class="stage-counter"><b id="stageNum">1</b><span>of ${projects.length}</span></span>
      <span class="stage-bars">${projects.map((_, i) => `<i class="${i === 0 ? 'is-on' : ''}"></i>`).join('')}</span>
    </div>`;
  const slides = $$('.stage-slide', stage);
  const bars = $$('.stage-bars i', stage);
  const chapterEls = $$('.chapter', chapters);
  let active = -1;

  const activate = (i) => {
    if (i === active || i < 0) return;
    slides.forEach((s, j) => {
      s.classList.toggle('is-before', j === active);
      s.classList.toggle('is-active', j === i);
      if (j !== i && j !== active) s.classList.remove('is-before');
    });
    bars.forEach((b, j) => b.classList.toggle('is-on', j === i));
    chapterEls.forEach((c, j) => c.classList.toggle('is-active', j === i));
    const num = $('#stageNum', stage);
    if (num) num.textContent = String(i + 1);
    active = i;
  };

  // Reading line at 50% viewport height decides the active chapter
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) activate(+e.target.dataset.index); });
    }, { rootMargin: '-50% 0px -50% 0px' });
    chapterEls.forEach((c) => io.observe(c));
  }
  activate(0);

  /* ---------- Filters (derived from project tags) ---------- */
  const tags = [...new Set(projects.flatMap((p) => p.tags || []))];
  if (tags.length > 1) {
    const count = (t) => projects.filter((p) => (p.tags || []).includes(t)).length;
    filtersEl.innerHTML = [`<button class="filter" type="button" aria-pressed="true" data-filter="">All<span class="n">${projects.length}</span></button>`]
      .concat(tags.map((t) => `<button class="filter" type="button" aria-pressed="false" data-filter="${esc(t)}">${esc(t)}<span class="n">${count(t)}</span></button>`)).join('');
    filtersEl.addEventListener('click', (e) => {
      const b = e.target.closest('.filter'); if (!b) return;
      $$('.filter', filtersEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const f = b.dataset.filter;
      chapterEls.forEach((c) => c.classList.toggle('is-filtered', !!f && !c.dataset.tags.split('|').includes(f)));
      const first = chapterEls.find((c) => !c.classList.contains('is-filtered'));
      if (first) { activate(+first.dataset.index); }
      chapters.scrollTo?.({ left: 0, behavior: 'smooth' });
      updateDots();
      const shown = chapterEls.filter((c) => !c.classList.contains('is-filtered')).length;
      announce(`${shown} project${shown === 1 ? '' : 's'} shown`);
    });
  } else {
    filtersEl.innerHTML = '';
  }

  /* ---------- Mobile: swipe gallery dots ---------- */
  let dots = $('.work__dots');
  if (!dots) {
    dots = document.createElement('div');
    dots.className = 'work__dots';
    dots.setAttribute('aria-hidden', 'true');
    $('#workStory').after(dots);
  }
  function updateDots() {
    const visible = chapterEls.filter((c) => !c.classList.contains('is-filtered'));
    dots.innerHTML = visible.map(() => '<i></i>').join('');
    syncDots();
  }
  function syncDots() {
    const visible = chapterEls.filter((c) => !c.classList.contains('is-filtered'));
    if (!visible.length) return;
    const w = visible[0].offsetWidth + 12;
    const i = Math.round(chapters.scrollLeft / (w || 1));
    $$('i', dots).forEach((d, j) => d.classList.toggle('is-on', j === Math.min(i, visible.length - 1)));
  }
  chapters.addEventListener('scroll', () => requestAnimationFrame(syncDots), { passive: true });
  updateDots();

  /* ---------- Page transition on open ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-case]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const p = projects[+a.dataset.case];
    transitionTo(a.getAttribute('href'), p?.title || '');
  });

  guardImages(stage);
  guardImages(chapters);
  observeReveals(chapters);
}

function announce(msg) {
  let live = $('#workLive');
  if (!live) {
    live = document.createElement('p');
    live.id = 'workLive'; live.className = 'visually-hidden'; live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);
  }
  live.textContent = msg;
}
