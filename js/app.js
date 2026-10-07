/**
 * App entry — orchestrates boot order:
 *   1. chrome that needs no data (cursor, nav, progress, form)
 *   2. content (Firestore or defaults) while the loader plays
 *   3. render sections, split headlines
 *   4. loader exits → one orchestrated hero entrance → scroll reveals
 */
import { $, $$, esc, safeUrl, motionOK, toast } from './utils.js';
import { loadContent, submitContact, peekCachedContent } from './content.js';
import { seed, SECTIONS } from './seed-data.js';
import { applyThemeSettings } from './palette.js';
import { initCTA, initMarquee, renderLive } from './live.js';
import { renderGallery } from './gallery.js';
import { smoothScrollTo, initMotion } from './motion.js';
import { isFirebaseConfigured } from './firebase.js';
import { initCursor } from './cursor.js';
import { initTheme } from './theme.js';
import { applyFontPair } from './fonts.js';
import { onScroll, splitWords, observeReveals, scrubWords, initProgress, initMagnetic } from './animations.js';
import { initHero } from './hero.js';
import { renderWork } from './projects.js';
import { renderCapabilities, renderProcess, renderMoment, renderExperience, renderFlow, renderArchive, renderSocial } from './sections.js';

const html = document.documentElement;

/* ==========================================================================
   Loader — brand moment, never artificial waiting.
   Finishes as soon as both the step sequence and content are ready.
   ========================================================================== */
function runLoader(contentReady) {
  const loader = $('#loader');
  const skip = html.classList.contains('skip-loader') || !loader;
  if (skip) { loader?.remove(); return contentReady; }
  // Show the admin's words immediately if we have them from last visit
  const cached = peekCachedContent();
  const words = (cached?.page?.loaderSteps || []).filter(Boolean).slice(0, 7);
  if (words.length) $('.loader__steps', loader).innerHTML = words.map((w, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${esc(w)}</li>`).join('');
  const nm = (cached?.settings?.name || '').trim().split(/\s+/);
  if (nm[0]) $('.loader__name', loader).innerHTML = nm.map((w) => `<span>${esc(w)}</span>`).join(' ');
  const steps = $$('.loader__steps li', loader);
  const bar = $('.loader__bar i', loader);
  const sequence = new Promise((resolve) => {
    steps.forEach((li, i) => setTimeout(() => {
      steps.forEach((s) => s.classList.remove('is-on'));
      li.classList.add('is-on');
      bar.style.transform = `scaleX(${(i + 1) / steps.length})`;
      if (i === steps.length - 1) setTimeout(resolve, 260);
    }, 180 + i * 190));
  });
  return Promise.all([sequence, contentReady]).then(() => {
    loader.classList.add('is-done');
    try { sessionStorage.setItem('ar-loaded', '1'); } catch (e) { /* ignore */ }
    setTimeout(() => loader.remove(), 950);
  });
}

/* ==========================================================================
   Navigation — transparent → floating pill; active section; mobile tab bar
   ========================================================================== */
const TAB_TARGETS = ['top', 'about', 'work', 'experience', 'contact'];
let navKeyOf = () => 'top';

/** Map every section to the nearest menu item at or above it, in the current order. */
function buildNavMap() {
  const ids = ['top', ...$$('main > section').filter((s) => !s.hidden && s.id).map((s) => s.id).filter((id) => id !== 'top')];
  const menu = new Set($$('.nav__links a').map((a) => a.dataset.section));
  const tabs = new Set(TAB_TARGETS);
  const navOf = {}, tabOf = {};
  let curNav = 'top', curTab = 'top';
  ids.forEach((id) => {
    if (menu.has(id)) curNav = id;
    if (tabs.has(id)) curTab = id;
    navOf[id] = curNav; tabOf[id] = curTab;
  });
  navKeyOf = (id) => [navOf[id] || 'top', tabOf[id] || 'top'];
  return ids;
}

function initNav() {
  const nav = $('#nav'), tabbar = $('#tabbar');
  onScroll(() => nav.classList.toggle('is-compact', scrollY > 40));

  const setActive = (id) => {
    const [navKey, tabKey] = navKeyOf(id);
    $$('.nav__links a').forEach((a) => {
      const on = a.dataset.section === navKey;
      a.classList.toggle('is-active', on);
      on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
    });
    const ti = Math.max(0, TAB_TARGETS.indexOf(tabKey));
    $$('a', tabbar).forEach((a, i) => {
      const on = i === ti;
      a.classList.toggle('is-active', on);
      on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
    });
    tabbar?.style.setProperty('--tab', ti);
  };
  let io;
  const observe = () => {
    io?.disconnect();
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    buildNavMap().forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  };
  observe();
  addEventListener('layoutchange', observe);
  setActive('top');

  // Smooth, eased in-page navigation; focus moves to the section heading (keyboard + screen readers)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    const id = a.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    smoothScrollTo(target);
    history.replaceState(null, '', `#${id}`);
    const heading = $('h1, h2', target);
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  });
}

/* ==========================================================================
   v2: page layout from Studio → Sections & menu
   ========================================================================== */
function normalizeSections(list) {
  const known = SECTIONS.map(([id]) => id);
  const out = (Array.isArray(list) ? list : []).filter((x) => known.includes(x?.id))
    .filter((x, i, a) => a.findIndex((y) => y.id === x.id) === i)
    .map((x) => ({ id: x.id, visible: x.visible !== false }));
  // Sections added in later versions appear in their default position
  known.forEach((id, i) => {
    if (out.some((x) => x.id === id)) return;
    const prev = known.slice(0, i).reverse().find((k) => out.some((x) => x.id === k));
    out.splice(prev ? out.findIndex((x) => x.id === prev) + 1 : 0, 0, { id, visible: true });
  });
  return out;
}

function applyLayout(page) {
  const main = $('#main'), footer = $('footer.footer');
  const order = normalizeSections(page.sections);
  order.forEach(({ id, visible }) => {
    const el = document.getElementById(id);
    if (!el || el.parentElement !== main) return;
    main.append(el); // re-append in order (hero stays first, it is never moved)
    if (!visible) el.hidden = true;
  });
  main.after(footer);
  const hidden = new Set(order.filter((x) => !x.visible).map((x) => x.id));

  // Top menu
  const links = (page.nav || []).filter((n) => n?.label && n?.target && !hidden.has(n.target) && document.getElementById(n.target));
  if (links.length) $('#navLinks').innerHTML = links.map((n) => `<a href="#${esc(n.target)}" data-section="${esc(n.target)}">${esc(n.label)}</a>`).join('');
  $$('#navLinks a').forEach((a) => { if (hidden.has(a.dataset.section)) a.remove(); });
  // Tab bar: a hidden target falls back to the next visible section
  $$('#tabbar a').forEach((a) => {
    const id = a.dataset.section;
    if (!hidden.has(id)) return;
    const next = order.slice(order.findIndex((x) => x.id === id)).find((x) => x.visible && document.getElementById(x.id));
    a.hidden = !next;
    if (next) a.setAttribute('href', `#${next.id}`);
  });
  dispatchEvent(new Event('layoutchange'));
}

function renderFacts(facts) {
  const dl = $('#facts');
  if (!dl) return;
  const list = (facts || []).filter((f) => f?.label || f?.value);
  if (!list.length) { dl.hidden = true; return; }
  dl.innerHTML = list.map((f) => `<div class="fact"><dt>${esc(f.label || '')}</dt><dd>${esc(f.value || '')}</dd></div>`).join('');
  dl.style.setProperty('--facts', Math.min(list.length, 4));
}

function renderContactTopics(topics) {
  const box = $('#contactTopics');
  const list = (topics || []).map((t) => String(t).trim()).filter(Boolean).slice(0, 8);
  if (!box || !list.length) return;
  box.innerHTML = list.map((t, i) => `<label class="choice"><input type="radio" name="projectType" value="${esc(t.slice(0, 60))}"${i === 0 ? ' checked' : ''}><span>${esc(t)}</span></label>`).join('');
}

/* ==========================================================================
   Inspect mode — shows the grid and section specs. The site as a spec sheet.
   ========================================================================== */
function initInspect() {
  const btn = $('#inspectToggle');
  if (!btn) return;
  const measure = () => $$('[data-spec]').forEach((el) => {
    el.dataset.specSize = `${Math.round(el.offsetWidth)} × ${Math.round(el.offsetHeight)}`;
  });
  btn.addEventListener('click', () => {
    const on = !html.classList.contains('is-inspecting');
    if (on) measure();
    html.classList.toggle('is-inspecting', on);
    btn.setAttribute('aria-pressed', String(on));
    toast(on ? 'Inspect on: 12-column grid and section specs are visible' : 'Inspect off');
  });
  addEventListener('resize', () => { if (html.classList.contains('is-inspecting')) measure(); }, { passive: true });
}

/* ==========================================================================
   Data binding for simple text/href slots in the static HTML
   ========================================================================== */
function resolve(content, path) {
  const [scope, key] = path.split('.');
  if (scope === 'page') return content.page?.[key] ?? seed.page[key];
  if (scope === 'social') return content.social?.find((s) => s.id === key || s.icon === key)?.url;
  return content[scope]?.[key];
}
function bind(content) {
  $$('[data-bind]').forEach((el) => {
    const v = resolve(content, el.dataset.bind);
    if (typeof v === 'string' && v.trim()) el.textContent = v;
  });
  $$('[data-bind-href]').forEach((el) => {
    const v = resolve(content, el.dataset.bindHref);
    if (v) el.setAttribute('href', safeUrl(v));
  });
  $$('[data-bind-mailto]').forEach((el) => {
    const v = resolve(content, el.dataset.bindMailto);
    if (v) el.setAttribute('href', `mailto:${v}`);
  });
}

function applySettings(s) {
  if (s.seoTitle) document.title = s.seoTitle;
  if (s.seoDescription) $('meta[name="description"]')?.setAttribute('content', s.seoDescription);
  applyThemeSettings(s);
  applyFontPair(s.fontPair || 'geist', { custom: { display: s.customDisplayFont, body: s.customBodyFont, weight: s.customDisplayWeight } });
  initCTA(s);
  document.body.classList.toggle('no-grain', s.showGrain === false);
  if (s.favicon?.url) $('link[rel="icon"]')?.setAttribute('href', safeUrl(s.favicon.url));
  try { s.showLoader === false ? localStorage.setItem('ar-no-loader', '1') : localStorage.removeItem('ar-no-loader'); } catch (e) { /* ignore */ }
}

function renderPortrait(hero) {
  const fig = $('#portrait'), intro = $('#aboutIntro');
  if (!fig || !hero?.profileImage?.url) return;
  const img = new Image();
  img.alt = hero.profileImage.alt || 'Portrait of Afroza Riju';
  img.decoding = 'async';
  // Only reveal the frame once the photo really loads: a missing file never leaves a hole
  img.onload = () => {
    $('.portrait__frame', fig).append(img);
    $('.portrait__caption', fig).textContent = `W ${img.naturalWidth}  H ${img.naturalHeight}`;
    fig.hidden = false;
    intro.classList.add('has-portrait');
  };
  img.src = hero.profileImage.url;
}

/* ==========================================================================
   Contact form — inline validation, loading/success/error states
   ========================================================================== */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
function initContactForm(getContent) {
  const form = $('#contactForm');
  if (!form) return;
  const status = $('#formStatus');
  const fields = {
    name: { el: $('#f-name'), check: (v) => v.trim().length >= 2 || 'Enter your name so I know who to reply to.' },
    email: { el: $('#f-email'), check: (v) => EMAIL_RE.test(v.trim()) || 'Enter an email like name@company.com.' },
    message: { el: $('#f-message'), check: (v) => v.trim().length >= 10 || 'Add a little more detail (at least 10 characters).' }
  };
  const validate = (key, show = true) => {
    const { el, check } = fields[key];
    const res = check(el.value);
    const wrap = el.closest('.field');
    const err = $(`#${el.id}-err`);
    const ok = res === true;
    if (show) {
      wrap.classList.toggle('is-invalid', !ok);
      wrap.classList.toggle('is-valid', ok);
      err.textContent = ok ? '' : res;
      el.setAttribute('aria-invalid', String(!ok));
      ok ? el.removeAttribute('aria-describedby') : el.setAttribute('aria-describedby', err.id);
    }
    return ok;
  };
  Object.keys(fields).forEach((k) => {
    const el = fields[k].el;
    el.addEventListener('blur', () => { if (el.value) validate(k); });
    el.addEventListener('input', () => { if (el.closest('.field').classList.contains('is-invalid')) validate(k); });
  });
  const count = $('#msgCount');
  fields.message.el.addEventListener('input', (e) => { count.textContent = e.target.value.length; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const results = Object.keys(fields).map((k) => validate(k));
    if (results.includes(false)) {
      const first = Object.values(fields).find((f) => f.el.getAttribute('aria-invalid') === 'true');
      first?.el.focus();
      status.className = 'form__status is-error';
      status.textContent = 'Check the highlighted fields.';
      return;
    }
    if (form.company.value) return; // honeypot: silently ignore bots
    const data = {
      name: fields.name.el.value, email: fields.email.el.value,
      message: fields.message.el.value,
      projectType: form.querySelector('input[name="projectType"]:checked')?.value || ''
    };
    form.classList.add('is-loading');
    status.className = 'form__status';
    status.textContent = 'Sending…';
    try {
      if (!isFirebaseConfigured()) throw new Error('firebase-not-configured');
      await submitContact(data);
      form.reset();
      count.textContent = '0';
      $$('.field', form).forEach((f) => f.classList.remove('is-valid', 'is-invalid'));
      status.className = 'form__status is-success';
      status.textContent = `Message sent. Thanks, ${data.name.split(' ')[0]}. I'll reply to ${data.email}.`;
      toast('Message sent');
    } catch (err) {
      const email = getContent()?.settings?.email || 'afrozariju@gmail.com';
      if (err.message === 'firebase-not-configured') {
        const subject = encodeURIComponent(`${data.projectType}: hello from ${data.name}`);
        const body = encodeURIComponent(`${data.message}\n\n— ${data.name} (${data.email})`);
        location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        status.className = 'form__status is-success';
        status.textContent = `Your email app should open with the message ready to send. If it doesn't, write to ${email}.`;
      } else {
        console.error('[contact]', err);
        status.className = 'form__status is-error';
        status.textContent = navigator.onLine
          ? `The message didn't send. Try again, or email ${email} directly.`
          : `You're offline. Reconnect and send again, or email ${email} later.`;
      }
    } finally {
      form.classList.remove('is-loading');
    }
  });

  // Copy email
  $('#copyEmail')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const email = $('.email-card__link')?.textContent.trim();
    try { await navigator.clipboard.writeText(email); }
    catch { const t = Object.assign(document.createElement('textarea'), { value: email }); document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
    btn.classList.add('is-done');
    toast('Email copied');
    setTimeout(() => btn.classList.remove('is-done'), 2000);
  });
}

/* ==========================================================================
   PWA — register service worker, surface updates
   ========================================================================== */
function initPWA() {
  if (!('serviceWorker' in navigator)) return;
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (location.protocol !== 'https:' && !local) return;
  addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) toast('A new version is ready. Reload to update.', 5000);
        });
      });
    }).catch((err) => console.warn('[pwa] SW registration failed', err));
  });
}

/* ==========================================================================
   Boot
   ========================================================================== */
async function boot() {
  let content = null;
  initTheme();
  initCursor();
  initProgress();
  initNav();
  initInspect();
  initContactForm(() => content);
  initPWA();
  $('#year').textContent = new Date().getFullYear();

  const contentPromise = loadContent().then((c) => { content = c; return c; });
  const ready = runLoader(contentPromise);
  await contentPromise;

  content.page = { ...seed.page, ...(content.page || {}) };
  const safely = (name, fn) => { try { fn(); } catch (err) { console.error(`[render:${name}]`, err); } };
  try {
    applySettings(content.settings);
    applyLayout(content.page);
    bind(content);
    renderFacts(content.page.facts);
    renderContactTopics(content.page.contactTopics);
    renderCapabilities(content.skills || []);
    renderProcess(content.process || []);
    renderWork(content.projects || []);
    renderMoment(content.featured);
    renderExperience(content.experience || []);
    renderFlow(content.techflow || []);
    renderArchive(content.achievements || []);
    renderSocial(content.social || [], content.settings);
    renderPortrait(content.hero);
    safely('marquee', () => initMarquee(content.page));
    safely('live', () => renderLive(content.page, content));
    safely('gallery', () => renderGallery(content.gallery || []));
  } catch (err) {
    // A rendering bug in one section must never blank the page
    console.error('[render]', err);
  }

  $$('[data-split]').forEach(splitWords);
  scrubWords($('#aboutStatement'));
  initHero(content);
  $$('.section-title, .section-lede, .facts, .layers, .process__wrap, .flow, .contact__lede, .email-card, .form, .footer__grid, .live-card, .live-stats, .gal-filters').forEach((el, i) => {
    if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', el.matches('.section-title') ? 'blur' : '');
  });

  await ready;
  // Returning from a case study via bfcache: drop the curtain
  addEventListener('pageshow', (e) => { if (e.persisted) $('#curtain')?.classList.remove('is-on'); });
  requestAnimationFrame(() => {
    document.body.classList.add('is-ready');
    observeReveals();
    initMagnetic();
    initMotion();
  });

  if (content.source === 'cache') toast('Showing saved content. Live updates will load when the connection returns.', 4000);
}

boot();
