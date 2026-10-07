/**
 * Case-study page: ./case-study.html?p=<slug>
 * Renders only the sections that have content, in a fixed narrative order.
 */
import { $, $$, esc, safeUrl, richOrPlain, motionOK } from './utils.js';
import { applyThemeSettings } from './palette.js';
import { initCTA } from './live.js';
import { loadContent } from './content.js';
import { initCursor } from './cursor.js';
import { initTheme } from './theme.js';
import { applyFontPair } from './fonts.js';
import { splitWords, observeReveals, initProgress, initMagnetic } from './animations.js';
import { coverHTML, guardImages, caseUrl, transitionTo } from './projects.js';
import { CASE_SECTIONS } from './case-sections.js';



const main = $('#main');

function figures(images = []) {
  const valid = images.filter((im) => im?.url);
  if (!valid.length) return '';
  return `<div class="cs-figs">${valid.map((im) => `
    <figure>
      <button class="cs-fig" type="button" data-full="${esc(im.url)}" data-caption="${esc(im.caption || im.alt || '')}" data-cursor="Explore" data-cursor-size="lg" aria-label="Enlarge image: ${esc(im.alt || 'project image')}">
        <img src="${esc(im.url)}" alt="${esc(im.alt || '')}" loading="lazy" decoding="async">
      </button>
      ${im.caption ? `<figcaption>${esc(im.caption)}</figcaption>` : ''}
    </figure>`).join('')}</div>`;
}

function render(p, next) {
  document.title = `${p.title} — Case study by Afroza Riju`;
  $('meta[name="description"]')?.setAttribute('content', p.shortDescription || `${p.title}, a case study by Afroza Riju.`);

  const cs = p.caseStudy || {};
  // Fall back to the summary fields where a dedicated section is empty
  const sectionData = (key) => {
    const s = cs[key] || {};
    let body = s.body || '';
    if (!body && key === 'overview') body = p.overview || '';
    if (!body && key === 'problem') body = p.problem || '';
    if (!body && key === 'outcome') body = p.outcome || '';
    return { body, images: s.images || [], link: s.link };
  };
  const sections = CASE_SECTIONS.map(([key, label]) => ({ key, label, ...sectionData(key) }))
    .filter((s) => s.body || s.images.filter((i) => i?.url).length || s.link?.url);

  const meta = [['Role', p.role], ['Industry', p.industry], ['Year', p.year], ['Tools', (p.tools || []).join(', ')]].filter(([, v]) => v);
  const summary = [['Problem', p.problem], ['Solution', p.solution], ['Outcome', p.outcome]].filter(([, v]) => v);
  const gallery = (p.gallery || []).filter((g) => g?.url);

  main.innerHTML = `
    <section class="container cs-hero">
      <a class="cs-back" href="./index.html#work">Selected work</a>
      <p class="cs-cat" data-reveal>${esc(p.category || 'Case study')}</p>
      <h1 class="cs-title" data-split>${esc(p.title)}</h1>
      ${p.shortDescription ? `<p class="cs-lede" data-reveal style="--delay:200ms">${esc(p.shortDescription)}</p>` : ''}
      ${meta.length ? `<dl class="cs-meta" data-reveal style="--delay:300ms">${meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
    </section>
    <div class="container"><div class="cs-cover" data-reveal="mask">${coverHTML(p, { eager: true })}</div>
      ${summary.length ? `<div class="cs-summary">${summary.map(([k, v]) => `<article data-reveal><h2>${k}</h2><p>${esc(v)}</p></article>`).join('')}</div>` : ''}
    </div>
    ${sections.length ? `
    <div class="container cs-body">
      <nav class="cs-toc" aria-label="Case study sections"><p>On this page</p>
        <ol>${sections.map((s) => `<li><a href="#cs-${s.key}">${esc(s.label)}</a></li>`).join('')}</ol>
      </nav>
      <div>${sections.map((s, i) => `
        <section class="cs-section" id="cs-${s.key}" aria-labelledby="cs-h-${s.key}">
          <p class="cs-section__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</p>
          <h2 id="cs-h-${s.key}" data-reveal="blur">${esc(s.label)}</h2>
          ${s.body ? `<div class="prose" data-reveal>${richOrPlain(s.body)}</div>` : ''}
          ${figures(s.images)}
          ${s.link?.url ? `<p style="margin-top:var(--s-5)"><a class="link-arrow" href="${esc(safeUrl(s.link.url))}" target="_blank" rel="noopener">${esc(s.link.label || 'Open prototype')}</a></p>` : ''}
        </section>`).join('')}
      </div>
    </div>` : `
    <div class="container"><div class="cs-notice" data-reveal>
      <div><h2>The full case study is on Behance</h2>
      <p>The complete process for ${esc(p.title)}, including research, flows and final screens, is published on Behance while this page is being written up.</p></div>
      ${p.behanceUrl ? `<a class="btn btn--accent btn--lg magnetic" href="${esc(safeUrl(p.behanceUrl))}" target="_blank" rel="noopener" data-cursor="Open">View on Behance</a>` : ''}
    </div></div>`}
    ${gallery.length ? `<section class="container" aria-labelledby="gal-h" style="padding-bottom:var(--section-y)"><h2 id="gal-h" class="section-title" style="font-size:var(--t-2xl)">Gallery</h2>${figures(gallery)}</section>` : ''}
    ${sections.length && p.behanceUrl ? `<div class="container" style="padding-bottom:var(--s-8)"><a class="link-arrow" href="${esc(safeUrl(p.behanceUrl))}" target="_blank" rel="noopener">See this project on Behance</a></div>` : ''}
    ${next ? `<a class="cs-next" href="${esc(caseUrl(next))}" data-next data-cursor="Next project" data-cursor-size="lg">
      <span class="container" style="display:block"><span class="cs-next__label">Next project</span><br><span class="cs-next__title">${esc(next.title)}</span></span></a>` : ''}
    <footer class="cs-foot"><div class="container"><span>© ${new Date().getFullYear()} Afroza Riju</span><a class="link-arrow" href="./index.html#contact">Start a conversation</a></div></footer>`;

  main.removeAttribute('aria-busy');
  $$('[data-split]', main).forEach(splitWords);
  guardImages(main);

  // TOC highlight
  const links = $$('.cs-toc a', main);
  if (links.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
    }), { rootMargin: '-30% 0px -60% 0px' });
    $$('.cs-section', main).forEach((s) => io.observe(s));
  }

  // Next project transition
  $('[data-next]', main)?.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    transitionTo(e.currentTarget.getAttribute('href'), next.title);
  });

  // Lightbox
  const lb = $('#lightbox');
  main.addEventListener('click', (e) => {
    const b = e.target.closest('.cs-fig');
    if (!b || !lb?.showModal) return;
    $('img', lb).src = b.dataset.full;
    $('img', lb).alt = b.querySelector('img')?.alt || '';
    $('figcaption', lb).textContent = b.dataset.caption || '';
    lb.showModal();
    lb._opener = b;
  });
  $('.lightbox__close', lb)?.addEventListener('click', () => lb.close());
  lb?.addEventListener('click', (e) => { if (e.target === lb || e.target.tagName === 'FIGURE') lb.close(); });
  lb?.addEventListener('close', () => lb._opener?.focus());
}

function renderMissing() {
  document.title = 'Project not found — Afroza Riju';
  main.removeAttribute('aria-busy');
  main.innerHTML = `<section class="container cs-empty">
    <h1>This project isn't available.</h1>
    <p>It may have been renamed or unpublished. Browse the current selected work instead.</p>
    <a class="btn btn--accent btn--lg" href="./index.html#work">See selected work</a></section>`;
}

async function boot() {
  initTheme();
  initCursor();
  initProgress();
  const curtain = $('#curtain');
  const slug = new URLSearchParams(location.search).get('p');
  const content = await loadContent();
  const st = content.settings || {};
  applyThemeSettings(st);
  initCTA(st);
  applyFontPair(st.fontPair || 'geist', { custom: { display: st.customDisplayFont, body: st.customBodyFont, weight: st.customDisplayWeight } });
  const list = content.projects || [];
  const i = list.findIndex((p) => (p.slug || p.id) === slug);
  if (i < 0) renderMissing();
  else render(list[i], list.length > 1 ? list[(i + 1) % list.length] : null);

  // Lift the curtain if we arrived via a transition
  if (document.documentElement.classList.contains('from-transition')) {
    try { sessionStorage.removeItem('ar-transition'); } catch (e) { /* ignore */ }
    if (i >= 0) $('.curtain__label', curtain).textContent = list[i].title;
    requestAnimationFrame(() => requestAnimationFrame(() => curtain.classList.add('is-leaving')));
    setTimeout(() => document.documentElement.classList.remove('from-transition'), 900);
  }
  requestAnimationFrame(() => { observeReveals(); initMagnetic(); });
  addEventListener('pageshow', (e) => { if (e.persisted) curtain.classList.remove('is-on'); });
}

boot();
