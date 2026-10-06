/**
 * Section renderers. Each takes data from the content layer and owns
 * its own interaction. All selectable groups follow the WAI-ARIA tabs
 * pattern: arrow keys move, Home/End jump, selection is announced.
 */
import { $, $$, esc, safeUrl, iconSvg, richOrPlain } from './utils.js';
import { onScroll, progressOf, initTilt, observeReveals } from './animations.js';

/* ---------- Shared: roving tablist keyboard support ---------- */
function rovingTabs(list, selector, onSelect, orientation = 'both') {
  const tabs = () => $$(selector, list);
  list.addEventListener('keydown', (e) => {
    const all = tabs();
    const i = all.indexOf(document.activeElement);
    if (i < 0) return;
    const prev = orientation !== 'horizontal' ? ['ArrowUp', 'ArrowLeft'] : ['ArrowLeft'];
    const next = orientation !== 'horizontal' ? ['ArrowDown', 'ArrowRight'] : ['ArrowRight'];
    let n = null;
    if (prev.includes(e.key)) n = (i - 1 + all.length) % all.length;
    if (next.includes(e.key)) n = (i + 1) % all.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = all.length - 1;
    if (n === null) return;
    e.preventDefault();
    all[n].focus();
    onSelect(n);
  });
  list.addEventListener('click', (e) => {
    const t = e.target.closest(selector);
    if (t) onSelect(tabs().indexOf(t));
  });
}
const setSelected = (all, i) => all.forEach((t, j) => {
  t.setAttribute('aria-selected', String(i === j));
  t.tabIndex = i === j ? 0 : -1;
});

/* ==========================================================================
   Capabilities — a layers panel
   ========================================================================== */
export function renderCapabilities(skills) {
  const list = $('#layersList'), stage = $('#layersStage');
  if (!list || !stage) return;
  if (!skills.length) { $('#capabilities').hidden = true; return; }
  const chevron = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M5 3l4 4-4 4"/></svg>';
  list.innerHTML = skills.map((s, i) => `
    <button class="layer-btn" role="tab" id="layer-${i}" aria-controls="layersStage" aria-selected="false" tabindex="-1">
      ${chevron}<span>${esc(s.category)}</span><span class="count" aria-hidden="true">${(s.items || []).length}</span>
    </button>`).join('');
  stage.setAttribute('role', 'tabpanel');
  const select = (i) => {
    const s = skills[i];
    setSelected($$('.layer-btn', list), i);
    stage.setAttribute('aria-labelledby', `layer-${i}`);
    stage.innerHTML = `<div class="swap-in">
      <h3 class="stage-title">${esc(s.category)}</h3>
      ${s.description ? `<p class="stage-desc">${esc(s.description)}</p>` : ''}
      <ul class="chips">${(s.items || []).map((it, j) => `<li class="chip" style="--i:${j}">${esc(it)}</li>`).join('')}</ul>
    </div>`;
  };
  rovingTabs(list, '.layer-btn', select);
  list.addEventListener('pointerover', (e) => { // hover previews on desktop
    const t = e.target.closest('.layer-btn');
    if (t && matchMedia('(hover: hover)').matches && t.getAttribute('aria-selected') !== 'true') select($$('.layer-btn', list).indexOf(t));
  });
  select(0);
}

/* ==========================================================================
   Process — "How I think"
   ========================================================================== */
export function renderProcess(steps) {
  const rail = $('#processTabs'), panel = $('#processPanel');
  if (!rail || !panel || !steps.length) { $('#process')?.setAttribute('hidden', ''); return; }
  rail.innerHTML = steps.map((s, i) => `
    <button class="step-tab" role="tab" id="step-${i}" aria-controls="processPanel" aria-selected="false" tabindex="-1">
      <span class="step-tab__num">${String(i + 1).padStart(2, '0')}</span>
      <span class="step-tab__label">${esc(s.title)}</span>
    </button>`).join('');
  const block = (title, items, cls = '') => items?.length
    ? `<div class="pp__block ${cls}"><h3>${title}</h3><ul>${items.map((x, j) => `<li style="--i:${j}">${esc(x)}</li>`).join('')}</ul></div>` : '';
  const select = (i, fromUser = false) => {
    const s = steps[i];
    const tabs = $$('.step-tab', rail);
    setSelected(tabs, i);
    tabs.forEach((t, j) => t.classList.toggle('is-past', j < i));
    panel.setAttribute('aria-labelledby', `step-${i}`);
    panel.innerHTML = `<div class="swap-in">
      <div class="pp__head"><span class="pp__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><h3 class="pp__title">${esc(s.title)}</h3></div>
      ${s.summary ? `<p class="pp__summary">${esc(s.summary)}</p>` : ''}
      <div class="pp__grid">
        ${block('Activities', s.activities)}
        ${block('Deliverables', s.deliverables)}
        ${block('Methods', s.methods)}
        ${s.mindset ? `<div class="pp__block pp__block--mindset"><h3>Mindset</h3><p>${esc(s.mindset)}</p></div>` : ''}
      </div></div>`;
    // Keep the active step visible in the mobile stepper (scroll the rail only, never the page)
    if (fromUser && rail.scrollWidth > rail.clientWidth) {
      const t = tabs[i];
      rail.scrollTo({ left: t.offsetLeft - rail.clientWidth / 2 + t.offsetWidth / 2, behavior: 'smooth' });
    }
  };
  rovingTabs(rail, '.step-tab', (i) => select(i, true));
  select(0, false);
}

/* ==========================================================================
   Featured moment — Huawei ICT interview
   ========================================================================== */
export function renderMoment(f) {
  const el = $('#moment');
  if (!el) return;
  if (!f || f.published === false || !f.reelUrl) { el.hidden = true; return; }
  const mega = (f.mega || 'HUAWEI ICT').split('').map((c) =>
    c === ' ' ? '<span class="sp"></span>' : `<span class="ch">${esc(c)}</span>`).join('');
  const url = safeUrl(f.reelUrl);
  const thumb = f.thumbnail?.url
    ? `<img src="${esc(f.thumbnail.url)}" alt="${esc(f.thumbnail.alt || 'Interview still')}" loading="lazy" decoding="async">`
    : '';
  el.innerHTML = `
    <div class="moment__glow" aria-hidden="true"></div>
    <div class="container">
      <p class="moment__label" data-reveal>${esc(f.label || 'Featured moment')}</p>
      <h2 class="moment__mega" id="momentTitle" aria-label="${esc(f.mega || 'Huawei ICT')}"><span aria-hidden="true" style="display:contents">${mega}</span></h2>
      <div class="moment__grid">
        <div>
          <p class="moment__role" data-reveal>${esc(f.title || '')}</p>
          ${f.description ? `<div class="moment__desc" data-reveal style="--delay:120ms">${richOrPlain(f.description)}</div>` : ''}
          <div class="moment__actions" data-reveal style="--delay:220ms">
            <a class="btn btn--accent btn--lg magnetic" href="${esc(url)}" target="_blank" rel="noopener" data-cursor="Open">Watch the interview</a>
          </div>
        </div>
        <a class="reel" id="reel" href="${esc(url)}" target="_blank" rel="noopener" data-cursor="Play" data-cursor-size="lg" aria-label="Watch the Huawei ICT interview reel on Facebook (opens in a new tab)" data-reveal="mask">
          ${thumb}
          <span class="reel__shade" aria-hidden="true"></span>
          <span class="reel__poster" aria-hidden="true">
            <span class="reel__poster-top"><span>Facebook Reel</span><span>Interview</span></span>
            <span class="reel__poster-title">${esc(f.posterTitle || 'Interview feature')}</span>
          </span>
          <span class="reel__play" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span>
        </a>
      </div>
    </div>`;

  // Cinematic: letterbox bars + mega type rises with scroll progress
  const chars = $$('.ch', el);
  new IntersectionObserver(([e]) => { if (e.isIntersecting) el.classList.add('is-in'); }, { threshold: 0.2 }).observe(el);
  onScroll(() => {
    const p = progressOf($('.moment__mega', el), 0.95, 0.6);
    chars.forEach((c, i) => {
      const local = Math.min(1, Math.max(0, p * 1.6 - i * 0.05));
      c.style.setProperty('--p', local.toFixed(3));
    });
  });
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`);
  });
  initTilt($('#reel', el));
}

/* ==========================================================================
   Experience — company switcher + proportional timeline
   ========================================================================== */
const toMonths = (ym) => { const [y, m] = String(ym || '').split('-').map(Number); return y ? y * 12 + ((m || 1) - 1) : null; };

export function renderExperience(items) {
  const root = $('#expRoot');
  if (!root) return;
  if (!items.length) { root.innerHTML = '<p class="empty">Experience will appear here once it is added.</p>'; return; }

  // Group roles by company, preserving order of first appearance
  const groups = [];
  items.forEach((it) => {
    let g = groups.find((x) => x.company === it.company);
    if (!g) groups.push(g = { company: it.company, roles: [] });
    g.roles.push(it);
  });

  // Timeline bounds
  const spans = items.map((it) => {
    const s = toMonths(it.start); const e = toMonths(it.end) ?? (s != null ? s + 1 : null);
    return { s, e };
  }).filter((x) => x.s != null);
  const min = Math.min(...spans.map((x) => x.s)), max = Math.max(...spans.map((x) => x.e)) + 2;
  const startYear = Math.floor(min / 12), endYear = Math.ceil(max / 12);
  const pct = (m) => ((m - startYear * 12) / ((endYear - startYear) * 12)) * 100;

  const ticks = [];
  for (let y = startYear; y <= endYear; y++) ticks.push(`<span class="ruler__tick" style="left:${pct(y * 12)}%">${y}</span>`);
  const bars = items.map((it, i) => {
    const s = toMonths(it.start); if (s == null) return '';
    const e = toMonths(it.end) ?? s + 1;
    const gi = groups.findIndex((g) => g.company === it.company);
    return `<button class="ruler__bar" data-group="${gi}" data-row="${i % 2}" style="left:${pct(s)}%;width:${Math.max(pct(e) - pct(s), 1.2)}%;animation-delay:${i * 120}ms" aria-label="${esc(it.role)} at ${esc(it.company)}, ${esc(it.period)}" tabindex="-1"></button>`;
  }).join('');

  root.innerHTML = `
    ${spans.length ? `<div class="ruler" data-inview aria-hidden="true">
      <div class="ruler__axis">${ticks.join('')}</div>
      <div class="ruler__bars">${bars}</div>
    </div>` : ''}
    <div class="exp__body">
      <div class="companies" role="tablist" aria-label="Companies">
        ${groups.map((g, i) => {
          const periods = g.roles.map((r) => r.period).filter(Boolean);
          const years = [...new Set(g.roles.flatMap((r) => [r.start, r.end]).filter(Boolean).map((d) => d.slice(0, 4)))].sort();
          return `<button class="company" role="tab" id="co-${i}" aria-controls="expPanel" aria-selected="false" tabindex="-1">
            <span class="company__name">${esc(g.company)}</span>
            <span class="company__years">${esc(years.length > 1 ? `${years[0]}–${years.at(-1)}` : (years[0] || periods[0] || ''))}</span>
          </button>`;
        }).join('')}
      </div>
      <div class="exp__panel" id="expPanel" role="tabpanel" tabindex="0" aria-live="polite"></div>
    </div>`;

  const list = $('.companies', root), panel = $('#expPanel', root);
  const select = (i) => {
    const g = groups[i];
    setSelected($$('.company', list), i);
    panel.setAttribute('aria-labelledby', `co-${i}`);
    $$('.ruler__bar', root).forEach((b) => b.classList.toggle('is-on', +b.dataset.group === i));
    panel.innerHTML = `<div class="swap-in">${g.roles.map((r) => `
      <article class="role">
        <header class="role__head"><h3 class="role__title">${esc(r.role)}</h3><span class="role__period">${esc(r.period || '')}</span></header>
        ${r.summary ? `<p class="role__summary">${esc(r.summary)}</p>` : ''}
        ${(r.responsibilities || []).length ? `<ul class="role__list">${r.responsibilities.map((x, j) => `<li style="--i:${j}">${esc(x)}</li>`).join('')}</ul>` : ''}
      </article>`).join('')}</div>`;
  };
  rovingTabs(list, '.company', select);
  $$('.ruler__bar', root).forEach((b) => b.addEventListener('click', () => { select(+b.dataset.group); $$('.company', list)[+b.dataset.group].focus({ preventScroll: true }); }));
  select(0);
  observeReveals(root);
}

/* ==========================================================================
   Design meets technology — pipeline
   ========================================================================== */
const FLOW_ICONS = {
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  flow: '<rect x="3" y="4" width="6" height="5" rx="1"/><rect x="15" y="15" width="6" height="5" rx="1"/><path d="M6 9v4a2 2 0 0 0 2 2h7"/>',
  layout: '<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M3.5 9h17M9 9v11"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
  box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>'
};

export function renderFlow(nodes) {
  const root = $('#flowRoot');
  if (!root) return;
  if (!nodes.length) { $('#tech').hidden = true; return; }
  root.innerHTML = `
    <div class="flow__track">
      <svg class="flow__svg" aria-hidden="true"><path class="flow__line"/><path class="flow__draw"/></svg>
      <div class="flow__nodes" role="tablist" aria-label="From user to product">
        ${nodes.map((n, i) => `
          <button class="node${n.designer ? ' node--designer' : ''}" role="tab" id="node-${i}" aria-controls="flowDetail" aria-selected="false" tabindex="-1">
            <span class="node__dot"><svg viewBox="0 0 24 24" aria-hidden="true">${FLOW_ICONS[n.icon] || FLOW_ICONS.box}</svg></span>
            <span class="node__label">${esc(n.label)}</span>
          </button>`).join('')}
      </div>
    </div>
    <p class="flow__legend">Stages I design directly</p>
    <div class="flow__detail" id="flowDetail" role="tabpanel" tabindex="0" aria-live="polite"></div>`;

  const list = $('.flow__nodes', root), detail = $('#flowDetail', root);
  const btns = $$('.node', list);
  const select = (i) => {
    const n = nodes[i];
    setSelected(btns, i);
    detail.setAttribute('aria-labelledby', `node-${i}`);
    detail.innerHTML = `
      <div class="swap-in"><h3>${esc(n.label)}</h3><p>${esc(n.what || '')}</p></div>
      <div class="cse swap-in" style="animation-delay:80ms"><h4>Where computer science helps</h4><p>${esc(n.cse || '')}</p></div>`;
  };
  rovingTabs(list, '.node', select);
  select(0);

  // Line drawing tied to scroll: the path "connects" stages as you read
  const svg = $('.flow__svg', root), line = $('.flow__line', svg), draw = $('.flow__draw', svg);
  const layout = () => {
    const t = $('.flow__track', root).getBoundingClientRect();
    const dots = btns.map((b) => $('.node__dot', b).getBoundingClientRect());
    if (!dots.length) return;
    const y = dots[0].top + dots[0].height / 2 - t.top;
    const d = `M${dots[0].left + dots[0].width / 2 - t.left},${y} L${dots.at(-1).left + dots.at(-1).width / 2 - t.left},${y}`;
    line.setAttribute('d', d); draw.setAttribute('d', d);
    const len = draw.getTotalLength?.() || 1000;
    draw.style.setProperty('--len', len);
  };
  layout();
  addEventListener('resize', layout, { passive: true });
  document.fonts?.ready.then(layout);
  onScroll(() => {
    const p = progressOf(root, 0.85, 0.35);
    draw.style.setProperty('--p', p.toFixed(3));
    list.style.setProperty('--p', p.toFixed(3));
    btns.forEach((b, i) => b.classList.toggle('is-reached', p >= i / (btns.length - 1) - 0.01));
  });
}

/* ==========================================================================
   Milestones archive
   ========================================================================== */
export function renderArchive(items) {
  const root = $('#archive');
  if (!root) return;
  if (!items.length) { root.innerHTML = '<li class="empty">Milestones will appear here once they are added.</li>'; return; }
  root.innerHTML = items.map((a, i) => {
    const link = a.url ? safeUrl(a.url, '') : '';
    const external = /^https?:/i.test(link);
    return `<li class="ms" data-reveal style="--delay:${i * 60}ms" tabindex="0">
      <span class="ms__year">${esc(a.year || '')}</span>
      <h3 class="ms__title">${esc(a.title)}</h3>
      <span class="ms__org">${esc(a.org || '')}</span>
      <span class="ms__type">${a.type ? `<span class="badge${a.highlight ? ' badge--accent' : ''}">${esc(a.type)}</span>` : ''}</span>
      ${a.description || link ? `<div class="ms__desc"><div>${esc(a.description || '')}${link ? ` <a class="ms__link" href="${esc(link)}"${external ? ' target="_blank" rel="noopener"' : ''}>${a.highlight ? 'See the feature' : 'Learn more'}</a>` : ''}</div></div>` : ''}
    </li>`;
  }).join('');
}

/* ==========================================================================
   Social links (contact + footer)
   ========================================================================== */
export function renderSocial(social, settings) {
  const list = $('#socials'), footer = $('#footerLinks');
  const items = social.filter((s) => s.url);
  if (list) list.innerHTML = items.map((s) => `
    <li><a class="social" href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener" data-cursor="Open" aria-label="${esc(s.label)} (opens in a new tab)">
      <span class="social__icon">${iconSvg(s.icon)}</span><span>${esc(s.label)}</span></a></li>`).join('');
  if (footer) footer.innerHTML = items.map((s) => `<li><a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')
    + (settings.email ? `<li><a href="mailto:${esc(settings.email)}">Email</a></li>` : '')
    + (settings.resumeUrl ? `<li><a href="${esc(safeUrl(settings.resumeUrl))}" target="_blank" rel="noopener">Résumé</a></li>` : '');
}
