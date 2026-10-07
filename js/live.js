/**
 * v2 "live" layer: things that keep moving so the site feels alive.
 *  - Let's talk button: travelling light on the border, availability pulse,
 *    and the label rolling over on a loop (style chosen in Studio)
 *  - Marquee ticker: two rows, opposite directions, speeds up with scroll
 *  - Right now panel: ticking local clock, day line, typewriter of what
 *    Afroza is working on, counters that count up when seen
 * Everything stops off-screen and in background tabs, and reduced-motion
 * users get the same information without the movement.
 */
import { $, $$, esc, safeUrl, motionOK, clamp } from './utils.js';

/* ==========================================================================
   Let's talk button
   ========================================================================== */
export const CTA_STYLES = [
  ['live', 'Live: travelling light, pulse and rolling text (recommended)'],
  ['ring', 'Travelling light around the border'],
  ['pulse', 'Soft pulse rings'],
  ['shine', 'Shine sweeping across'],
  ['roll', 'Rolling text only'],
  ['none', 'No animation']
];

export function initCTA(settings = {}) {
  const a = $('#ctaLive');
  if (!a) return;
  const label = String(settings.ctaLabel || "Let's talk").trim().slice(0, 28);
  let href = safeUrl(settings.ctaHref || '#contact', '#contact');
  // On other pages (case study), an in-page link points back to the home page
  if (href.startsWith('#') && !document.getElementById(href.slice(1))) href = `./index.html${href}`;
  a.setAttribute('href', href);
  if (/^https?:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
  a.dataset.ctaStyle = CTA_STYLES.some(([k]) => k === settings.ctaStyle) ? settings.ctaStyle : 'live';
  a.dataset.cursor = label;
  const chars = [...label];
  const glyph = (c) => (c === ' ' ? '&nbsp;' : esc(c));
  $('.cta-live__label', a).innerHTML = `<span class="visually-hidden">${esc(label)}</span><span class="roll" aria-hidden="true">${chars
    .map((c, i) => `<span class="roll__l" style="--i:${i}"><span>${glyph(c)}</span><span>${glyph(c)}</span></span>`).join('')}</span>`;
}

/* ==========================================================================
   Marquee ticker
   ========================================================================== */
export function initMarquee(page = {}) {
  const root = $('#marquee');
  if (!root) return;
  const sets = [page.marqueeItems, page.marqueeItems2].map((a) => (a || []).map((x) => String(x).trim()).filter(Boolean));
  if (!sets[0].length && !sets[1].length) { root.hidden = true; return; }
  $('#marqueeList').innerHTML = [...sets[0], ...sets[1]].map((x) => `<li>${esc(x)}</li>`).join('');

  const rows = $$('.marquee__row', root).map((row, r) => {
    const items = sets[r].length ? sets[r] : [];
    if (!items.length) { row.hidden = true; return null; }
    const track = $('.marquee__track', row);
    track.innerHTML = `<div class="marquee__group">${items.map((x) => `<span class="marquee__item">${esc(x)}</span><span class="marquee__star">✦</span>`).join('')}</div>`;
    return { row, track, group: track.firstElementChild, dir: Number(row.dataset.dir) || 1, x: 0, w: 1 };
  }).filter(Boolean);

  const layout = () => rows.forEach((st) => {
    st.track.replaceChildren(st.group);
    st.w = st.group.getBoundingClientRect().width || 1;
    const copies = Math.ceil((innerWidth * 2) / st.w) + 1;
    for (let i = 0; i < copies; i++) st.track.append(st.group.cloneNode(true));
  });
  layout();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 150); }, { passive: true });
  document.fonts?.ready.then(layout);
  if (!motionOK()) { root.classList.add('is-static'); return; }

  const speed = clamp(Number(page.marqueeSpeed) || 1, 0.2, 4);
  let inView = false, raf = 0, last = 0, lastY = scrollY, vel = 0, sign = 1;
  const loop = (t) => {
    if (!inView || document.hidden) { raf = 0; return; }
    const dt = last ? Math.min(0.064, (t - last) / 1000) : 0.016;
    last = t;
    const dy = scrollY - lastY; lastY = scrollY;
    if (Math.abs(dy) > 0.5) sign = dy > 0 ? 1 : -1;
    vel += (Math.abs(dy) / Math.max(dt, 0.001) - vel) * 0.12; // smoothed scroll speed, px/s
    const v = 42 * speed + Math.min(vel * 0.35, 1100);
    rows.forEach((st) => {
      st.x -= v * dt * st.dir * sign;
      st.x = (((st.x % st.w) + st.w) % st.w) - st.w;
      st.track.style.transform = `translate3d(${st.x.toFixed(2)}px,0,0)`;
    });
    root.style.setProperty('--skew', `${(-clamp(vel / 260, 0, 5) * sign).toFixed(2)}deg`);
    raf = requestAnimationFrame(loop);
  };
  const start = () => { if (!raf && inView) { last = 0; lastY = scrollY; raf = requestAnimationFrame(loop); } };
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; start(); }, { rootMargin: '80px 0px' }).observe(root);
  document.addEventListener('visibilitychange', start);
}

/* ==========================================================================
   Right now: live status panel
   ========================================================================== */
const SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';

function statValue(raw, content) {
  const v = String(raw ?? '').trim();
  const auto = /^auto:(\w+)$/i.exec(v)?.[1]?.toLowerCase();
  if (!auto) return v;
  if (auto === 'projects') return String((content.projects || []).length);
  if (auto === 'milestones') return String((content.achievements || []).length);
  if (auto === 'companies') return String(new Set((content.experience || []).map((e) => e.company).filter(Boolean)).size);
  if (auto === 'gallery') return String((content.gallery || []).length);
  if (auto === 'years') {
    const starts = (content.experience || []).map((e) => e.start).filter(Boolean).sort();
    if (!starts.length) return '';
    const [y, m] = starts[0].split('-').map(Number);
    const now = new Date();
    return String(Math.max(1, Math.floor((now.getFullYear() * 12 + now.getMonth() - (y * 12 + (m || 1) - 1)) / 12)));
  }
  return '';
}

function validTZ(tz) { try { new Intl.DateTimeFormat('en', { timeZone: tz }); return tz; } catch { return 'Asia/Dhaka'; } }

export function renderLive(page = {}, content = {}) {
  const section = $('#live'), root = $('#liveRoot');
  if (!section || !root) return;
  const available = page.liveAvailable !== false;
  const name = content.settings?.name || 'Afroza Riju';
  const avatar = content.hero?.profileImage?.url;
  const now = (page.liveNow || []).map((x) => String(x).trim()).filter(Boolean);
  const stats = (page.stats || []).map((s) => ({ ...s, v: statValue(s.value, content) })).filter((s) => s.v && s.label);
  const tz = validTZ(page.liveTimezone || 'Asia/Dhaka');
  const city = page.liveCity || 'Dhaka';
  const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2);

  root.innerHTML = `
    <article class="live-card live-card--status">
      <div class="presence">
        <span class="presence__avatar">${avatar ? `<img src="${esc(avatar)}" alt="" loading="lazy" decoding="async">` : `<b>${esc(initials)}</b>`}<i class="presence__dot${available ? ' is-on' : ''}" aria-hidden="true"></i></span>
        <span class="presence__who"><span class="presence__name">${esc(name)}</span><span class="presence__state">${available ? 'Available now' : 'Not taking new work right now'}</span></span>
      </div>
      ${page.liveStatus ? `<p class="live-card__big">${esc(page.liveStatus)}</p>` : ''}
      ${available ? `<a class="link-arrow" href="#contact" data-cursor="Let's talk">${esc(content.hero?.ctaSecondaryLabel || 'Start a conversation')}</a>` : ''}
    </article>
    <article class="live-card live-card--clock">
      <p class="live-card__label">Local time in ${esc(city)}</p>
      <p class="clock" id="liveClock" aria-hidden="true"></p>
      <p class="visually-hidden" id="liveClockSr"></p>
      <div class="dayline" aria-hidden="true"><i class="dayline__track"></i><span class="dayline__marker" id="liveMarker"></span></div>
      <p class="live-card__meta" id="liveMeta"></p>
    </article>
    ${now.length ? `<article class="live-card live-card--now">
      <p class="live-card__label">Currently</p>
      <p class="typer" aria-hidden="true"><span id="liveTyper"></span><i class="typer__caret"></i></p>
      <ul class="visually-hidden">${now.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <span class="typer__dots" aria-hidden="true">${now.map(() => '<i></i>').join('')}</span>
    </article>` : ''}
    ${stats.length ? `<dl class="live-stats">${stats.map((s) => {
      const n = /^\d+(\.\d+)?$/.test(s.v) ? s.v : '';
      return `<div class="lstat"><dt class="lstat__label">${esc(s.label)}</dt><dd class="lstat__num"><span ${n ? `data-count="${n}"` : ''}>${n ? '0' : esc(s.v)}</span>${s.suffix ? `<span class="lstat__suffix">${esc(s.suffix)}</span>` : ''}</dd></div>`;
    }).join('')}</dl>` : ''}`;

  startClock(tz);
  if (now.length) startTyper(now);
  if (stats.length) startCounters(root);
}

/* ---------- clock: digits roll when they change ---------- */
function startClock(tz) {
  const el = $('#liveClock'), sr = $('#liveClockSr'), meta = $('#liveMeta'), marker = $('#liveMarker');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const fmtMeta = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'long', timeZoneName: 'shortOffset' });
  const fmtSr = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true });
  let prev = '', prevMin = '';
  const roll = motionOK();
  const tick = () => {
    const d = new Date();
    const s = fmt.format(d);
    if (s !== prev) {
      if (!el.childElementCount) el.innerHTML = [...s].map((c) => (c === ':' ? '<span class="clock__sep">:</span>' : '<span class="clock__d"><i></i></span>')).join('');
      const slots = $$('.clock__d', el), digits = s.replace(/:/g, '');
      [...digits].forEach((c, i) => {
        const slot = slots[i], old = slot.dataset.v;
        if (old === c) return;
        slot.dataset.v = c;
        if (!roll || old == null) { slot.innerHTML = `<i>${c}</i>`; return; }
        slot.innerHTML = `<i class="is-out">${old}</i><i class="is-in">${c}</i>`;
      });
      prev = s;
      const [h, m] = s.split(':').map(Number);
      marker.style.setProperty('--p', ((h * 60 + m) / 1440).toFixed(4));
      marker.innerHTML = h >= 6 && h < 18 ? SUN : MOON;
      const minute = s.slice(0, 5);
      if (minute !== prevMin) {
        prevMin = minute;
        const parts = fmtMeta.formatToParts(d);
        const wd = parts.find((p) => p.type === 'weekday')?.value || '';
        const off = parts.find((p) => p.type === 'timeZoneName')?.value || '';
        meta.textContent = `${wd}, ${off}`;
        sr.textContent = `Local time: ${fmtSr.format(d)}, ${wd}`;
      }
    }
  };
  tick();
  // Align ticks with the real second
  setTimeout(() => { tick(); setInterval(() => { if (!document.hidden) tick(); }, 1000); }, 1000 - (Date.now() % 1000));
}

/* ---------- typewriter loop ---------- */
function startTyper(items) {
  const el = $('#liveTyper'), dots = $$('.typer__dots i');
  let i = 0;
  const mark = () => dots.forEach((d, j) => d.classList.toggle('is-on', j === i));
  if (!motionOK()) {
    el.textContent = items[0]; mark();
    if (items.length > 1) setInterval(() => { i = (i + 1) % items.length; el.textContent = items[i]; mark(); }, 4000);
    return;
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(el.closest('.live-card'));
  (async () => {
    for (;;) {
      const text = items[i]; mark();
      for (let n = 1; n <= text.length; n++) { el.textContent = text.slice(0, n); await sleep(28 + Math.random() * 40); }
      await sleep(2200);
      while (!visible || document.hidden) await sleep(400);
      if (items.length === 1) continue;
      for (let n = text.length; n >= 0; n--) { el.textContent = text.slice(0, n); await sleep(14); }
      await sleep(260);
      i = (i + 1) % items.length;
    }
  })();
}

/* ---------- counters count up the first time they are seen ---------- */
function startCounters(root) {
  const nums = $$('[data-count]', root);
  if (!nums.length) return;
  const run = (el) => {
    const target = Number(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
    if (!motionOK()) { el.textContent = target.toFixed(dec); return; }
    const t0 = performance.now(), dur = 1500;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(2, -10 * p);
      el.textContent = (target * (p === 1 ? 1 : e)).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
  }), { threshold: 0.6 });
  nums.forEach((n) => io.observe(n));
}
