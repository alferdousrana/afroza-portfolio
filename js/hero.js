/**
 * Hero canvas — "a designer's workspace coming alive".
 * - Frames are draggable (pointer) and movable with arrow keys (keyboard),
 *   showing W/H like a design tool. Drag is the point: visitors handle UI.
 * - Dashed connectors redraw as frames move (flows link artifacts).
 * - A collaborator cursor visits frames to show the canvas is live.
 * - Pointer parallax adds depth. All motion pauses off-screen and
 *   is disabled for reduced motion.
 */
import { $, $$, motionOK, finePointer } from './utils.js';

const LINKS = [
  ['.frame--contrast', '.frame--phone'],
  ['.frame--phone', '.frame--component'],
  ['.frame--persona', '.frame--note'],
  ['.frame--note', '.frame--component']
];

export function initHero(content) {
  const canvas = $('#heroCanvas');
  const hero = $('.hero');
  if (!canvas || !hero) return;
  const frames = $$('[data-frame]', canvas);
  const svg = $('#heroLinks');

  if (content?.hero?.noteText) {
    const p = $('.frame--note .note p', canvas);
    if (p) p.textContent = content.hero.noteText;
  }

  frames.forEach((f, i) => {
    f.style.setProperty('--x', f.dataset.x);
    f.style.setProperty('--y', f.dataset.y);
    f.style.setProperty('--fi', i);
    f.dataset.depth = (0.4 + (i % 3) * 0.3).toFixed(2);
    f._dx = 0; f._dy = 0;
    const size = document.createElement('span');
    size.className = 'frame__size';
    size.setAttribute('aria-hidden', 'true');
    f.appendChild(size);
  });

  const updateSize = (f) => {
    const b = $('.frame__body', f);
    $('.frame__size', f).textContent = `W ${Math.round(b.offsetWidth)}  H ${Math.round(b.offsetHeight)}`;
  };
  const move = (f, dx, dy) => {
    // keep frames inside the canvas
    const c = canvas.getBoundingClientRect();
    const r = f.getBoundingClientRect();
    const nextL = r.left + (dx - f._dx), nextT = r.top + (dy - f._dy);
    if (nextL < c.left - r.width * 0.4 || nextL + r.width > c.right + r.width * 0.4) dx = f._dx;
    if (nextT < c.top || nextT + r.height > c.bottom + r.height * 0.3) dy = f._dy;
    f._dx = dx; f._dy = dy;
    f.style.setProperty('--dx', `${dx}px`);
    f.style.setProperty('--dy', `${dy}px`);
    drawLinks();
  };

  /* ---------- Connectors ---------- */
  function drawLinks() {
    if (!svg) return;
    const c = canvas.getBoundingClientRect();
    let html = '';
    LINKS.forEach(([a, b]) => {
      const A = $(a, canvas), B = $(b, canvas);
      if (!A || !B || !A.offsetParent || !B.offsetParent) return;
      const ra = $('.frame__body', A).getBoundingClientRect();
      const rb = $('.frame__body', B).getBoundingClientRect();
      const x1 = ra.left + ra.width / 2 - c.left, y1 = ra.top + ra.height / 2 - c.top;
      const x2 = rb.left + rb.width / 2 - c.left, y2 = rb.top + rb.height / 2 - c.top;
      const mx = (x1 + x2) / 2;
      html += `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}"/><circle cx="${x1}" cy="${y1}" r="2.5"/><circle cx="${x2}" cy="${y2}" r="2.5"/>`;
    });
    svg.innerHTML = html;
  }

  /* ---------- Pointer drag ---------- */
  let dragging = null;
  frames.forEach((f) => {
    f.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      dragging = { f, sx: e.clientX, sy: e.clientY, ox: f._dx, oy: f._dy };
      f.setPointerCapture(e.pointerId);
      f.classList.add('is-dragging');
      updateSize(f);
    });
    f.addEventListener('pointermove', (e) => {
      if (!dragging || dragging.f !== f) return;
      move(f, dragging.ox + e.clientX - dragging.sx, dragging.oy + e.clientY - dragging.sy);
    });
    const end = () => { if (dragging?.f === f) { f.classList.remove('is-dragging'); dragging = null; } };
    f.addEventListener('pointerup', end);
    f.addEventListener('pointercancel', end);

    /* Keyboard: arrows move, shift = larger steps */
    f.addEventListener('focus', () => updateSize(f));
    f.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 40 : 8;
      const map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (!map[e.key]) return;
      e.preventDefault();
      move(f, f._dx + map[e.key][0], f._dy + map[e.key][1]);
    });
  });

  /* ---------- Coordinate readout + parallax ---------- */
  const coords = $('#coords');
  const parallax = finePointer() && motionOK();
  let pr = 0;
  hero.addEventListener('pointermove', (e) => {
    if (coords) coords.textContent = `X ${Math.round(e.clientX)}   Y ${Math.round(e.clientY + scrollY)}`;
    if (!parallax || dragging) return;
    cancelAnimationFrame(pr);
    pr = requestAnimationFrame(() => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      frames.forEach((f) => {
        const d = +f.dataset.depth;
        f.style.setProperty('--px', `${(-nx * 22 * d).toFixed(1)}px`);
        f.style.setProperty('--py', `${(-ny * 16 * d).toFixed(1)}px`);
      });
      drawLinks();
    });
  });

  /* ---------- Collaborator cursor ---------- */
  const collab = $('#collab');
  let inView = true, idx = 0, timer = 0;
  const visit = () => {
    if (!collab || !inView || document.hidden || dragging) return;
    const visible = frames.filter((f) => f.offsetParent && getComputedStyle(f).display !== 'none');
    if (!visible.length) return;
    const f = visible[idx++ % visible.length];
    const c = canvas.getBoundingClientRect();
    const r = $('.frame__body', f).getBoundingClientRect();
    collab.style.setProperty('--cx', `${r.left - c.left + r.width * 0.72}px`);
    collab.style.setProperty('--cy', `${r.top - c.top + r.height * 0.62}px`);
    frames.forEach((x) => x.classList.remove('is-collab'));
    setTimeout(() => f.classList.add('is-collab'), 1400);
    setTimeout(() => f.classList.remove('is-collab'), 2600);
  };
  if (motionOK() && collab) {
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(hero);
    setTimeout(() => { visit(); timer = setInterval(visit, 3200); }, 1800);
  } else if (collab) {
    collab.hidden = true;
  }

  /* ---------- Role rotator ---------- */
  const rot = $('#roleRotator');
  const roles = (content?.hero?.roles || []).filter(Boolean);
  if (rot && roles.length) {
    rot.innerHTML = roles.map((r, i) => `<span class="rotator__word${i === 0 ? ' is-active' : ''}">${r.replace(/</g, '&lt;')}</span>`).join('');
    rot.setAttribute('aria-label', roles.join(', '));
    const words = $$('.rotator__word', rot);
    words.forEach((w) => w.setAttribute('aria-hidden', 'true'));
    if (motionOK() && words.length > 1) {
      let i = 0;
      setInterval(() => {
        if (document.hidden) return;
        const cur = words[i]; i = (i + 1) % words.length;
        cur.classList.remove('is-active'); cur.classList.add('is-leaving');
        words[i].classList.remove('is-leaving'); words[i].classList.add('is-active');
        setTimeout(() => cur.classList.remove('is-leaving'), 700);
      }, 2600);
    }
  }

  requestAnimationFrame(drawLinks);
  addEventListener('resize', () => requestAnimationFrame(drawLinks), { passive: true });
  document.fonts?.ready.then(drawLinks);
  return { redraw: drawLinks, stop: () => clearInterval(timer) };
}
