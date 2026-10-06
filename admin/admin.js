/**
 * Studio — admin dashboard for the portfolio.
 * Schema-driven: every content type is described once in SCHEMAS and gets
 * list, search, filter, reorder, publish toggles and an editor for free.
 *
 * Security model: the UI hides itself from non-admins, but the real
 * protection is firestore.rules / storage.rules (admins/{uid} must exist).
 */
import { getFirebase, isFirebaseConfigured } from '../js/firebase.js';
import { seed } from '../js/seed-data.js';
import { CASE_SECTIONS } from '../js/case-sections.js';
import { initTheme } from '../js/theme.js';
import { FONT_OPTIONS, FONT_PAIRS } from '../js/fonts.js';
import { $, $$, esc, sanitizeHTML, slugify, debounce, toast, applyAccent, byOrder } from '../js/utils.js';

/* ==========================================================================
   Schemas
   ========================================================================== */
const F = (name, label, type = 'text', opts = {}) => ({ name, label, type, ...opts });
const ROW = (...fields) => ({ type: 'row', fields });
const SOCIAL_ICONS = ['behance', 'linkedin', 'dribbble', 'facebook', 'mail', 'link'];
const FLOW_ICONS = ['user', 'search', 'flow', 'layout', 'grid', 'code', 'box'];

const SCHEMAS = {
  projects: {
    label: 'Projects', singular: 'project', col: 'projects',
    title: (d) => d.title, sub: (d) => [d.category, d.year].filter(Boolean).join(', '), thumb: (d) => d.coverImage?.url,
    flags: [['published', 'Published', 'Unpublished'], ['featured', 'Featured', 'Unfeatured']],
    filters: [['all', 'All'], ['published', 'Published'], ['draft', 'Drafts'], ['featured', 'Featured']],
    defaults: { published: false, featured: false, tags: [], tools: [], gallery: [], caseStudy: {}, hue: 228 },
    groups: [
      ['Basics', [F('title', 'Title', 'text', { required: true }), F('slug', 'URL slug', 'slug', { help: 'Used in the case-study link, for example case-study.html?p=wallet-finance-app' }), ROW(F('category', 'Category'), F('industry', 'Industry')), F('tags', 'Filter tags', 'tags', { help: 'Visitors filter Selected work by these. Press Enter after each tag.' }), F('shortDescription', 'Short description', 'textarea', { max: 300 })]],
      ['Details', [ROW(F('role', 'Your role'), F('year', 'Year')), F('tools', 'Tools', 'tags'), F('behanceUrl', 'Behance URL', 'url')]],
      ['Story summary', [F('problem', 'Problem', 'textarea'), F('solution', 'Solution', 'textarea'), F('outcome', 'Outcome', 'textarea', { help: 'Only real, verifiable outcomes. Leave empty if unknown; the site hides empty fields.' })]],
      ['Media', [F('coverImage', 'Cover image', 'image'), F('gallery', 'Gallery', 'gallery', { cover: 'coverImage' }), F('hue', 'Generated cover hue', 'number', { min: 0, max: 360, help: 'Colour (0–360) of the generated cover shown when there is no cover image.' })]],
      ['Case study', [F('caseStudy', 'Case-study sections', 'casestudy', { help: 'Sections without content are hidden on the site.' })]],
      ['Visibility', [ROW(F('published', 'Published on the site', 'toggle'), F('featured', 'Featured', 'toggle'))]]
    ]
  },
  experience: {
    label: 'Experience', singular: 'role', col: 'experience',
    title: (d) => `${d.role || 'Untitled role'}`, sub: (d) => [d.company, d.period].filter(Boolean).join(', '),
    defaults: { responsibilities: [] },
    groups: [[null, [
      ROW(F('company', 'Company', 'text', { required: true }), F('role', 'Role', 'text', { required: true })),
      F('period', 'Period as shown', 'text', { help: 'For example "Oct 2024 – Dec 2024"' }),
      ROW(F('start', 'Start month', 'month', { help: 'Places the role on the timeline' }), F('end', 'End month', 'month', { help: 'Leave empty for a single month or current role' })),
      F('summary', 'One-line summary', 'textarea'),
      F('responsibilities', 'Responsibilities', 'list', { help: 'One per line' })
    ]]]
  },
  achievements: {
    label: 'Achievements', singular: 'milestone', col: 'achievements',
    title: (d) => d.title, sub: (d) => [d.org, d.year].filter(Boolean).join(', '),
    groups: [[null, [
      F('title', 'Title', 'text', { required: true }),
      ROW(F('org', 'Organisation or role'), F('year', 'Year')),
      ROW(F('type', 'Type', 'text', { help: 'For example Program, Hackathon, Leadership' }), F('url', 'Link', 'text', { help: 'Optional. A URL or #moment' })),
      F('description', 'Description', 'textarea'),
      F('highlight', 'Highlight with accent badge', 'toggle')
    ]]]
  },
  skills: {
    label: 'Skills', singular: 'skill category', col: 'skills',
    title: (d) => d.category, sub: (d) => (d.items || []).join(', '),
    defaults: { items: [] },
    groups: [[null, [F('category', 'Category', 'text', { required: true }), F('description', 'Description', 'textarea'), F('items', 'Skills', 'tags', { help: 'Press Enter after each skill' })]]]
  },
  social: {
    label: 'Social links', singular: 'link', col: 'socialLinks',
    title: (d) => d.label, sub: (d) => d.url,
    groups: [[null, [ROW(F('label', 'Label', 'text', { required: true }), F('icon', 'Icon', 'select', { options: SOCIAL_ICONS })), F('url', 'URL', 'url', { required: true })]]]
  },
  process: {
    label: 'Process', singular: 'stage', col: 'processSteps',
    title: (d) => d.title, sub: (d) => d.summary,
    groups: [[null, [F('title', 'Stage name', 'text', { required: true }), F('summary', 'Summary', 'textarea'),
      F('activities', 'Activities', 'list', { help: 'One per line' }), F('deliverables', 'Deliverables', 'list', { help: 'One per line' }),
      F('methods', 'Methods', 'list', { help: 'One per line' }), F('mindset', 'Mindset', 'textarea')]]]
  },
  techflow: {
    label: 'Design & tech flow', singular: 'stage', col: 'techFlow',
    title: (d) => d.label, sub: (d) => d.what,
    groups: [[null, [ROW(F('label', 'Label', 'text', { required: true }), F('icon', 'Icon', 'select', { options: FLOW_ICONS })),
      F('designer', 'A stage I design directly', 'toggle'), F('what', 'What happens here', 'textarea'), F('cse', 'Where computer science helps', 'textarea')]]]
  }
};

const SINGLES = {
  hero: {
    label: 'Hero', path: ['heroContent', 'main'], base: seed.hero,
    intro: 'The first screen visitors see.',
    groups: [
      ['Copy', [F('eyebrow', 'Intro line'), F('headline', 'Headline', 'textarea', { max: 120 }), F('roles', 'Rotating roles', 'list', { help: 'One per line. They cycle under your name.' })]],
      ['Buttons', [ROW(F('ctaPrimaryLabel', 'Primary button label'), F('ctaPrimaryHref', 'Primary button link')), F('ctaSecondaryLabel', 'Secondary button label')]],
      ['Canvas', [F('noteText', 'Research sticky note', 'text', { max: 60 }), F('profileImage', 'Profile image', 'image', { help: 'Shown in the About section, framed as a selected layer.' })]]
    ]
  },
  featured: {
    label: 'Featured moment', path: ['featured', 'huawei'], base: seed.featured,
    intro: 'The Huawei ICT interview feature. It has its own cinematic section on the site.',
    groups: [
      ['Visibility', [F('published', 'Show this section', 'toggle')]],
      ['Copy', [F('label', 'Small label'), F('mega', 'Large title', 'text', { max: 24 }), F('title', 'Headline'), F('description', 'Description', 'richtext')]],
      ['Video', [F('videoUrl', 'Video file', 'text', { help: 'Path to the MP4 in the repo, e.g. ./assets/video/huawei-interview.mp4. Plays in the site’s own player. Leave empty to use the Facebook embed.' }), F('reelUrl', 'Facebook Reel URL', 'url', { required: true }), F('embed', 'Play the video inside the website (Facebook embed)', 'toggle', { help: 'Turn off to show a designed poster that opens Facebook instead.' }), F('posterTitle', 'Poster title'), F('thumbnail', 'Thumbnail', 'image', { help: 'A 9:16 still from the reel works best.' })]]
    ]
  },
  settings: {
    label: 'Site settings', path: ['siteSettings', 'main'], base: seed.settings,
    intro: 'Identity, SEO and theme.',
    groups: [
      ['Identity', [ROW(F('name', 'Name'), F('email', 'Contact email', 'text')), F('role', 'Role line'), ROW(F('location', 'Location'), F('resumeUrl', 'Résumé URL', 'url'))]],
      ['SEO', [F('seoTitle', 'SEO title', 'text', { max: 70 }), F('seoDescription', 'SEO description', 'textarea', { max: 170 }), F('favicon', 'Favicon', 'image', { help: 'Square PNG or SVG, at least 64×64.' })]],
      ['Page copy', [F('aboutStatement', 'About statement', 'textarea'), F('contactHeadline', 'Contact headline'), F('contactLede', 'Contact intro', 'textarea'), F('footerText', 'Footer statement')]],
      ['Typography', [F('fontPair', 'Font pair', 'select', { options: FONT_OPTIONS, preview: previewFont, help: 'Applies to the whole site after you save. Preview without saving: add ?font=editorial (or any key) to the site URL.' })]],
      ['Theme', [ROW(F('accentColor', 'Accent colour', 'color', { help: 'The site automatically deepens or lightens it per theme so text stays readable (4.5:1).' }), F('showGrain', 'Film grain texture', 'toggle')), F('showLoader', 'Intro loader on first visit', 'toggle')]]
    ]
  }
};

const NAV = [
  [null, [['overview', 'Overview', 'home']]],
  ['Portfolio', [['projects', 'Projects', 'grid'], ['experience', 'Experience', 'case'], ['achievements', 'Achievements', 'star'], ['skills', 'Skills', 'layers']]],
  ['Page', [['hero', 'Hero', 'spark'], ['featured', 'Featured moment', 'play'], ['process', 'Process', 'steps'], ['techflow', 'Design & tech', 'flow'], ['social', 'Social links', 'link']]],
  ['Inbox', [['messages', 'Messages', 'mail']]],
  ['Site', [['settings', 'Settings', 'gear']]]
];
const NAV_ICONS = {
  home: '<path d="M3 9l7-6 7 6v8h-4v-5H7v5H3z"/>', grid: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/>',
  case: '<rect x="2.5" y="6" width="15" height="10" rx="1.5"/><path d="M7 6V4h6v2"/>', star: '<path d="M10 2.5l2.3 4.7 5.2.7-3.8 3.6.9 5.1L10 14.2l-4.6 2.4.9-5.1-3.8-3.6 5.2-.7z"/>',
  layers: '<path d="M10 2.5l7.5 4-7.5 4-7.5-4z"/><path d="M2.5 10l7.5 4 7.5-4M2.5 13.5l7.5 4 7.5-4"/>', spark: '<path d="M10 2v5M10 13v5M2 10h5M13 10h5M4.5 4.5l3 3M12.5 12.5l3 3M15.5 4.5l-3 3M7.5 12.5l-3 3"/>',
  play: '<rect x="2.5" y="3.5" width="15" height="13" rx="2"/><path d="M8.5 7.5v5l4-2.5z"/>', steps: '<circle cx="4" cy="10" r="2"/><circle cx="10" cy="10" r="2"/><circle cx="16" cy="10" r="2"/><path d="M6 10h2M12 10h2"/>',
  flow: '<rect x="2" y="3" width="6" height="5" rx="1"/><rect x="12" y="12" width="6" height="5" rx="1"/><path d="M5 8v3a2 2 0 0 0 2 2h5"/>', link: '<path d="M8.5 11.5l3-3M7 13.5l-1.5 1.5a2.5 2.5 0 0 1-3.5-3.5L5.5 8M13 6.5L14.5 5A2.5 2.5 0 0 1 18 8.5L14.5 12"/>',
  mail: '<rect x="2.5" y="4.5" width="15" height="11" rx="1.5"/><path d="M3 5.5l7 5 7-5"/>', gear: '<circle cx="10" cy="10" r="2.5"/><path d="M10 2v2.5M10 15.5V18M2 10h2.5M15.5 10H18M4.3 4.3l1.8 1.8M13.9 13.9l1.8 1.8M15.7 4.3l-1.8 1.8M6.1 13.9l-1.8 1.8"/>'
};

/* ==========================================================================
   State + helpers
   ========================================================================== */
const S = { fb: null, user: null, cache: {}, unread: 0 };
let uid = 0;
const nextId = (p = 'f') => `${p}-${++uid}`;
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const fb = () => getFirebase({ auth: true, storage: false });

const AUTH_ERRORS = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes, or reset your password.',
  'auth/network-request-failed': 'No connection. Check your network and try again.',
  'auth/user-disabled': 'This account has been disabled in Firebase.'
};
const firestoreError = (err) => {
  const code = err?.code || '';
  if (code.includes('permission-denied')) return 'Permission denied. Check that your UID is in the admins collection and the security rules are deployed.';
  if (code.includes('unavailable') || !navigator.onLine) return 'Firebase is unreachable. Check your connection and try again.';
  return err?.message || 'Something went wrong.';
};

/* ---------- Confirm dialog ---------- */
function confirmDialog({ title, body = '', ok = 'Confirm', danger = false }) {
  const d = $('#confirm'), okBtn = $('#confirmOk'), cancel = $('#confirmCancel');
  $('#confirmTitle').textContent = title;
  $('#confirmBody').textContent = body;
  okBtn.textContent = ok;
  okBtn.className = `a-btn ${danger ? 'a-btn--danger' : 'a-btn--primary'}`;
  return new Promise((resolve) => {
    const done = (v) => { okBtn.onclick = cancel.onclick = d.oncancel = null; d.close(); resolve(v); };
    okBtn.onclick = () => done(true);
    cancel.onclick = () => done(false);
    d.oncancel = (e) => { e.preventDefault(); done(false); };
    d.showModal();
    cancel.focus();
  });
}

/* ==========================================================================
   Storage: upload with client-side optimisation, deferred deletes
   ========================================================================== */
async function optimise(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || !('createImageBitmap' in window)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const max = 2400;
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * scale), height: Math.round(bmp.height * scale) });
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/webp', 0.86));
    return blob && blob.size < file.size ? blob : file;
  } catch { return file; }
}

async function uploadImage(file, ctx, onProgress) {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} isn't an image. Upload PNG, JPG, WebP, GIF or SVG.`);
  if (file.size > 15 * 1024 * 1024) throw new Error(`${file.name} is larger than 15 MB. Export a smaller version and try again.`);
  const blob = await optimise(file);
  const { storage, stMod } = await getFirebase({ storage: true });
  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
  const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'img').toLowerCase();
  const path = `uploads/${ctx.col}/${ctx.id}/${Date.now()}-${base}.${ext}`;
  const ref = stMod.ref(storage, path);
  const task = stMod.uploadBytesResumable(ref, blob, { contentType: blob.type || file.type, cacheControl: 'public,max-age=31536000' });
  await new Promise((res, rej) => task.on('state_changed', (s) => onProgress?.(s.bytesTransferred / s.totalBytes), rej, res));
  const url = await stMod.getDownloadURL(ref);
  ctx.uploaded.push(path);
  return { url, path, alt: '' };
}

async function deleteFiles(paths = []) {
  if (!paths.length) return;
  const { storage, stMod } = await getFirebase({ storage: true });
  await Promise.all(paths.filter(Boolean).map((p) => stMod.deleteObject(stMod.ref(storage, p)).catch((e) => console.warn('[storage] delete failed', p, e.code))));
}

function collectImagePaths(doc) {
  const out = [];
  const walk = (v) => {
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v)) return v.forEach(walk);
    if (typeof v.path === 'string' && typeof v.url === 'string') out.push(v.path);
    Object.values(v).forEach(walk);
  };
  walk(doc);
  return out;
}

/** Live sample of a font pair inside the admin */
function previewFont(key, box) {
  const p = FONT_PAIRS[key] || FONT_PAIRS.geist;
  const id = `fp-${key}`;
  if (!document.getElementById(id)) {
    document.head.append(Object.assign(document.createElement('link'), { id, rel: 'stylesheet', href: `https://fonts.googleapis.com/css2?${p.url}&display=swap` }));
  }
  box.innerHTML = `<p style="font-family:${esc(p.display)};font-weight:${p.weight};letter-spacing:${p.tracking};font-size:30px;line-height:1.1">Designing digital experiences</p>
    <p style="font-family:${esc(p.body)};font-size:15px;color:var(--c-ink-2);margin-top:8px">I bring research, visual design and interaction design together to build products that are intuitive and accessible.</p>`;
}

/* ==========================================================================
   Field widgets: each returns { name, el, get(), set?() }
   ========================================================================== */
function wrap(f, control, id) {
  const w = el('div', 'f');
  w.innerHTML = `<label class="f__label" for="${id}"><span>${esc(f.label)}${f.required ? ' <span aria-hidden="true">*</span>' : ''}</span>${f.max ? `<small data-count>0 / ${f.max}</small>` : ''}</label>`;
  w.append(control);
  if (f.help) w.append(el('p', 'f__help', esc(f.help)));
  w.append(el('p', 'f__error'));
  w.lastChild.id = `${id}-err`;
  w.lastChild.hidden = true;
  return w;
}

function inputWidget(f, value) {
  const id = nextId();
  const types = { text: 'text', url: 'url', number: 'number', month: 'month', color: 'color', slug: 'text' };
  const input = f.type === 'textarea' ? el('textarea', 'f__input') : el('input', 'f__input');
  input.id = id;
  if (input.tagName === 'INPUT') input.type = types[f.type] || 'text';
  if (f.max) input.maxLength = f.max;
  if (f.min != null) input.min = f.min;
  if (f.required) input.required = true;
  if (f.type === 'url') input.placeholder = 'https://';
  input.value = value ?? (f.type === 'color' ? '#7b93ff' : '');
  const w = wrap(f, input, id);
  const counter = $('[data-count]', w);
  const upd = () => { if (counter) counter.textContent = `${input.value.length} / ${f.max}`; };
  input.addEventListener('input', upd); upd();
  if (f.type === 'color') input.addEventListener('input', () => applyAccent(input.value));
  return {
    name: f.name, el: w, input,
    get: () => f.type === 'number' ? (input.value === '' ? null : Number(input.value)) : input.value.trim(),
    set: (v) => { input.value = v ?? ''; upd(); }
  };
}

function selectWidget(f, value) {
  const id = nextId();
  const s = el('select', 'f__input');
  s.id = id;
  const opts = f.options.map((o) => (Array.isArray(o) ? o : [o, o]));
  s.innerHTML = opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
  s.value = value || opts[0][0];
  const w = wrap(f, s, id);
  if (f.preview) {
    const prev = el('div', 'font-preview');
    const paint = () => f.preview(s.value, prev);
    s.addEventListener('change', paint); paint();
    w.insertBefore(prev, $('.f__error', w));
  }
  return { name: f.name, el: w, get: () => s.value };
}

function toggleWidget(f, value) {
  const b = el('button', 'switch', `<span class="switch__track" aria-hidden="true"></span><span>${esc(f.label)}</span>`);
  b.type = 'button';
  b.setAttribute('role', 'switch');
  b.setAttribute('aria-checked', String(!!value));
  b.addEventListener('click', () => b.setAttribute('aria-checked', String(b.getAttribute('aria-checked') !== 'true')));
  const w = el('div', 'f'); w.append(b);
  if (f.help) w.append(el('p', 'f__help', esc(f.help)));
  return { name: f.name, el: w, get: () => b.getAttribute('aria-checked') === 'true' };
}

function listWidget(f, value) {
  const wd = inputWidget({ ...f, type: 'textarea' }, (value || []).join('\n'));
  return { name: f.name, el: wd.el, get: () => wd.input.value.split('\n').map((s) => s.trim()).filter(Boolean) };
}

function tagsWidget(f, value) {
  const id = nextId();
  let tags = [...(value || [])];
  const box = el('div', 'tags');
  const input = el('input'); input.id = id; input.placeholder = 'Type and press Enter';
  const render = () => {
    $$('.tag-chip', box).forEach((c) => c.remove());
    tags.forEach((t, i) => {
      const c = el('span', 'tag-chip', `${esc(t)}<button type="button" aria-label="Remove ${esc(t)}">×</button>`);
      $('button', c).addEventListener('click', () => { tags.splice(i, 1); render(); input.focus(); });
      box.insertBefore(c, input);
    });
  };
  const add = () => {
    const v = input.value.replace(/,/g, '').trim();
    if (v && !tags.includes(v)) tags.push(v);
    input.value = ''; render();
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
    if (e.key === 'Backspace' && !input.value && tags.length) { tags.pop(); render(); }
  });
  input.addEventListener('blur', add);
  box.addEventListener('click', (e) => { if (e.target === box) input.focus(); });
  box.append(input); render();
  return { name: f.name, el: wrap(f, box, id), get: () => [...tags] };
}

function richWidget(f, value) {
  const id = nextId();
  const box = el('div', 'rte');
  box.innerHTML = `<div class="rte__bar" role="toolbar" aria-label="Formatting">
      <button type="button" data-cmd="bold" aria-label="Bold"><b>B</b></button>
      <button type="button" data-cmd="italic" aria-label="Italic"><i>I</i></button>
      <button type="button" data-cmd="formatBlock" data-arg="h3" aria-label="Heading">H</button>
      <button type="button" data-cmd="formatBlock" data-arg="p" aria-label="Paragraph">¶</button>
      <button type="button" data-cmd="insertUnorderedList" aria-label="Bulleted list">• List</button>
      <button type="button" data-cmd="insertOrderedList" aria-label="Numbered list">1. List</button>
      <button type="button" data-cmd="formatBlock" data-arg="blockquote" aria-label="Quote">“ ”</button>
      <button type="button" data-cmd="createLink" aria-label="Add link">Link</button>
      <button type="button" data-cmd="removeFormat" aria-label="Clear formatting">Clear</button>
    </div>
    <div class="rte__area" id="${id}" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="Write here…"></div>`;
  const area = $('.rte__area', box);
  area.innerHTML = sanitizeHTML(value || '');
  $('.rte__bar', box).addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    area.focus();
    let arg = b.dataset.arg || null;
    if (b.dataset.cmd === 'createLink') { arg = prompt('Link URL (https://…)'); if (!arg) return; }
    document.execCommand(b.dataset.cmd, false, arg);
  });
  area.addEventListener('paste', (e) => { // keep pasted content clean
    e.preventDefault();
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
  });
  const w = wrap(f, box, id);
  $('label', w).addEventListener('click', () => area.focus());
  return { name: f.name, el: w, get: () => area.textContent.trim() ? sanitizeHTML(area.innerHTML) : '' };
}

function imageWidget(f, value, ctx) {
  const id = nextId();
  let img = value?.url ? { ...value } : null;
  const box = el('div', 'img-field');
  box.innerHTML = `<div class="img-prev"></div>
    <div class="img-actions">
      <div class="btns"><label class="a-btn a-btn--sm" for="${id}">Upload image</label><button type="button" class="a-btn a-btn--sm a-btn--danger" data-rm>Remove</button></div>
      <input type="file" id="${id}" accept="image/*" class="visually-hidden">
      <input class="f__input" type="text" placeholder="Alt text: describe the image for screen readers" aria-label="Alt text for ${esc(f.label)}">
    </div>`;
  const prev = $('.img-prev', box), alt = $('input[type="text"]', box), file = $('input[type="file"]', box), rm = $('[data-rm]', box);
  const render = () => {
    prev.innerHTML = img?.url ? `<img src="${esc(img.url)}" alt="">` : 'No image';
    alt.value = img?.alt || '';
    alt.disabled = !img; rm.hidden = !img;
  };
  file.addEventListener('change', async () => {
    const fl = file.files[0]; if (!fl) return;
    prev.innerHTML = '<span>Uploading…</span><i class="img-prev__bar"></i>';
    try {
      const old = img;
      img = await uploadImage(fl, ctx, (p) => $('.img-prev__bar', prev)?.style.setProperty('--p', p));
      if (old?.path) ctx.removed.push(old.path);
      toast('Image uploaded');
    } catch (err) { toast(err.message || firestoreError(err), 4000); }
    file.value = ''; render();
  });
  rm.addEventListener('click', () => { if (img?.path) ctx.removed.push(img.path); img = null; render(); });
  alt.addEventListener('input', () => { if (img) img.alt = alt.value; });
  render();
  return { name: f.name, el: wrap(f, box, id), get: () => img, set: (v) => { img = v ? { ...v } : null; render(); } };
}

function galleryWidget(f, value, ctx) {
  const id = nextId();
  let items = (value || []).map((x) => ({ ...x }));
  const box = el('div');
  box.innerHTML = `<div class="gal"></div>
    <label class="drop" for="${id}" style="margin-top:12px"><strong>Add images</strong><span>Drop files here or choose from your computer. Drag thumbnails to reorder.</span></label>
    <input type="file" id="${id}" accept="image/*" multiple class="visually-hidden">`;
  const grid = $('.gal', box), drop = $('.drop', box), file = $('input[type="file"]', box);
  let dragFrom = null;

  const render = () => {
    const cover = f.cover ? ctx.widgets[f.cover]?.get()?.url : null;
    grid.innerHTML = '';
    items.forEach((it, i) => {
      const card = el('div', `gal__item${cover && cover === it.url ? ' is-cover' : ''}`);
      card.draggable = true;
      card.innerHTML = `<div class="gal__thumb"><img src="${esc(it.url)}" alt=""></div>
        <input class="f__input" placeholder="Alt text" value="${esc(it.alt || '')}" aria-label="Alt text for image ${i + 1}">
        <input class="f__input" placeholder="Caption (optional)" value="${esc(it.caption || '')}" aria-label="Caption for image ${i + 1}">
        <div class="gal__tools">
          <span>
            <button type="button" class="icon-btn" data-mv="-1" aria-label="Move image ${i + 1} earlier">←</button>
            <button type="button" class="icon-btn" data-mv="1" aria-label="Move image ${i + 1} later">→</button>
          </span>
          ${f.cover ? (cover === it.url ? '<span class="gal__badge">Cover</span>' : '<button type="button" class="a-btn a-btn--sm a-btn--ghost" data-cover>Use as cover</button>') : ''}
          <button type="button" class="icon-btn icon-btn--danger" data-rm aria-label="Remove image ${i + 1}">✕</button>
        </div>`;
      const [altIn, capIn] = $$('input', card);
      altIn.addEventListener('input', () => { it.alt = altIn.value; });
      capIn.addEventListener('input', () => { it.caption = capIn.value; });
      $$('[data-mv]', card).forEach((b) => b.addEventListener('click', () => {
        const j = i + Number(b.dataset.mv); if (j < 0 || j >= items.length) return;
        [items[i], items[j]] = [items[j], items[i]]; render();
        $$(`[data-mv="${b.dataset.mv}"]`, grid)[j]?.focus();
      }));
      $('[data-rm]', card).addEventListener('click', () => { if (it.path) ctx.removed.push(it.path); items.splice(i, 1); render(); });
      $('[data-cover]', card)?.addEventListener('click', () => { ctx.widgets[f.cover]?.set({ url: it.url, path: null, alt: it.alt || '' }); render(); toast('Cover image set'); });
      card.addEventListener('dragstart', () => { dragFrom = i; card.style.opacity = '0.4'; });
      card.addEventListener('dragend', () => { card.style.opacity = ''; });
      card.addEventListener('dragover', (e) => { if (dragFrom != null) { e.preventDefault(); card.classList.add('is-dragover'); } });
      card.addEventListener('dragleave', () => card.classList.remove('is-dragover'));
      card.addEventListener('drop', (e) => {
        e.preventDefault(); card.classList.remove('is-dragover');
        if (dragFrom == null || dragFrom === i) return;
        const [m] = items.splice(dragFrom, 1); items.splice(i, 0, m); dragFrom = null; render();
      });
      grid.append(card);
    });
  };
  const addFiles = async (files) => {
    for (const fl of files) {
      const status = el('div', 'gal__item', `<div class="gal__thumb" style="display:grid;place-items:center;font-size:12px;color:var(--c-ink-2)">Uploading ${esc(fl.name)}…</div>`);
      grid.append(status);
      try { items.push(await uploadImage(fl, ctx)); }
      catch (err) { toast(err.message || firestoreError(err), 4000); }
      status.remove(); render();
    }
  };
  file.addEventListener('change', () => { addFiles([...file.files]); file.value = ''; });
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { if (e.dataTransfer?.types.includes('Files')) { e.preventDefault(); drop.classList.add('is-over'); } }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('is-over')));
  drop.addEventListener('drop', (e) => { e.preventDefault(); addFiles([...e.dataTransfer.files]); });
  render();
  const w = el('div', 'f');
  w.innerHTML = `<p class="f__label"><span>${esc(f.label)}</span><small>${items.length ? `${items.length} images` : ''}</small></p>`;
  w.append(box);
  return { name: f.name, el: w, get: () => items.map(({ url, path, alt, caption }) => ({ url, path: path || null, alt: alt || '', caption: caption || '' })), rerender: render };
}

function caseStudyWidget(f, value, ctx) {
  const data = value || {};
  const wrapEl = el('div', 'f');
  wrapEl.innerHTML = `<p class="f__label"><span>${esc(f.label)}</span></p>${f.help ? `<p class="f__help">${esc(f.help)}</p>` : ''}`;
  const list = el('div', 'cs-ed');
  const parts = CASE_SECTIONS.map(([key, label]) => {
    const s = data[key] || {};
    const d = el('details');
    const filled = !!(s.body || s.images?.length || s.link?.url);
    d.innerHTML = `<summary><span>${esc(label)}</span><span class="dot${filled ? ' is-on' : ''}" aria-label="${filled ? 'Has content' : 'Empty'}"></span></summary>`;
    const body = el('div', 'cs-ed__body');
    const rte = richWidget({ name: 'body', label: 'Text' }, s.body);
    const gal = galleryWidget({ name: 'images', label: 'Images' }, s.images, ctx);
    const linkRow = el('div', 'f-row');
    const linkLabel = inputWidget({ name: 'll', label: 'Link label', type: 'text' }, s.link?.label);
    const linkUrl = inputWidget({ name: 'lu', label: 'Link URL (e.g. Figma prototype)', type: 'url' }, s.link?.url);
    linkRow.append(linkLabel.el, linkUrl.el);
    body.append(rte.el, gal.el, linkRow);
    d.append(body);
    list.append(d);
    return { key, get: () => ({ body: rte.get(), images: gal.get(), link: { label: linkLabel.get(), url: linkUrl.get() } }) };
  });
  wrapEl.append(list);
  return {
    name: f.name, el: wrapEl,
    get: () => {
      const out = {};
      parts.forEach((p) => {
        const v = p.get();
        const link = v.link.url ? v.link : null;
        if (v.body || v.images.length || link) out[p.key] = { body: v.body, images: v.images, ...(link ? { link } : {}) };
      });
      return out;
    }
  };
}

function widget(f, value, ctx) {
  switch (f.type) {
    case 'toggle': return toggleWidget(f, value);
    case 'select': return selectWidget(f, value);
    case 'list': return listWidget(f, value);
    case 'tags': return tagsWidget(f, value);
    case 'richtext': return richWidget(f, value);
    case 'image': return imageWidget(f, value, ctx);
    case 'gallery': return galleryWidget(f, value, ctx);
    case 'casestudy': return caseStudyWidget(f, value, ctx);
    default: return inputWidget(f, value);
  }
}

function buildForm(groups, data, ctx) {
  const root = el('div');
  const ws = [];
  ctx.widgets = {};
  const add = (f, parent) => { const w = widget(f, data[f.name], ctx); w.f = f; ws.push(w); ctx.widgets[f.name] = w; parent.append(w.el); };
  groups.forEach(([title, fields]) => {
    const g = el('section', 'f-group', title ? `<h3 class="f-group__title">${esc(title)}</h3>` : '');
    fields.forEach((f) => {
      if (f.type === 'row') { const r = el('div', 'f-row'); f.fields.forEach((ff) => add(ff, r)); g.append(r); }
      else add(f, g);
    });
    root.append(g);
  });
  // Slug follows the title until edited by hand
  const slug = ctx.widgets.slug, title = ctx.widgets.title;
  if (slug && title) {
    let touched = !!data.slug;
    slug.input.addEventListener('input', () => { touched = true; });
    title.input.addEventListener('input', () => { if (!touched) slug.set(slugify(title.get())); });
  }
  // Cover set from gallery should refresh the gallery badges
  if (ctx.widgets.coverImage && ctx.widgets.gallery) {
    const orig = ctx.widgets.coverImage.set;
    ctx.widgets.coverImage.set = (v) => { orig(v); ctx.widgets.gallery.rerender(); };
  }
  const get = () => Object.fromEntries(ws.map((w) => [w.name, w.get()]));
  const validate = () => {
    let first = null;
    ws.forEach((w) => {
      if (!w.f.required) return;
      const v = w.get();
      const bad = v == null || (typeof v === 'string' && !v) || (Array.isArray(v) && !v.length);
      const err = $('.f__error', w.el);
      w.el.classList.toggle('is-invalid', bad);
      if (err) { err.hidden = !bad; err.textContent = bad ? `${w.f.label} is required.` : ''; }
      if (bad && !first) first = w;
      if (w.f.type === 'url' && v && !/^https?:\/\//i.test(v)) {
        w.el.classList.add('is-invalid'); if (err) { err.hidden = false; err.textContent = 'Use a full URL starting with https://'; }
        first ??= w;
      }
    });
    first?.el.querySelector('input, textarea, [contenteditable]')?.focus();
    return !first;
  };
  return { el: root, get, validate };
}

/* ==========================================================================
   Firestore access
   ========================================================================== */
async function fetchCol(col) {
  const { db, fs } = await fb();
  const snap = await fs.getDocs(fs.collection(db, col));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byOrder);
  S.cache[col] = list;
  return list;
}
async function fetchOne([col, id]) {
  const { db, fs } = await fb();
  const snap = await fs.getDoc(fs.doc(db, col, id));
  return snap.exists() ? snap.data() : null;
}

/* ==========================================================================
   Drawer editor
   ========================================================================== */
function openEditor({ title, groups, data, ctx, onSave }) {
  const d = $('#drawer'), body = $('#drawerBody'), form = $('#drawerForm'), status = $('#drawerStatus'), save = $('#drawerSave');
  $('#drawerTitle').textContent = title;
  status.textContent = ''; status.className = 'drawer__status';
  body.innerHTML = '';
  save.hidden = !onSave;
  const built = groups ? buildForm(groups, data, ctx) : null;
  if (built) body.append(built.el); else if (data?.html) body.innerHTML = data.html;
  const snapshot = built ? JSON.stringify(built.get()) : '';
  const isDirty = () => built && JSON.stringify(built.get()) !== snapshot;

  const close = async (saved = false) => {
    if (!saved && isDirty() && !(await confirmDialog({ title: 'Discard unsaved changes?', body: 'Your edits to this item will be lost.', ok: 'Discard', danger: true }))) return;
    if (!saved && ctx?.uploaded?.length) deleteFiles(ctx.uploaded); // clean up orphan uploads
    d.close();
  };
  $$('[data-close]', form).forEach((b) => { b.onclick = () => close(false); });
  d.oncancel = (e) => { e.preventDefault(); close(false); };
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!built || !built.validate()) { status.textContent = 'Fix the highlighted fields.'; status.className = 'drawer__status is-error'; return; }
    save.classList.add('is-busy'); status.textContent = 'Saving…'; status.className = 'drawer__status';
    try {
      await onSave(built.get());
      if (ctx?.removed?.length) deleteFiles(ctx.removed);
      ctx.uploaded = [];
      toast('Changes saved');
      close(true);
    } catch (err) {
      console.error(err);
      status.textContent = firestoreError(err); status.className = 'drawer__status is-error';
    } finally { save.classList.remove('is-busy'); }
  };
  d.showModal();
  body.scrollTop = 0;
  setTimeout(() => body.querySelector('input, textarea, [contenteditable], button')?.focus(), 50);
  return { close };
}

/* ==========================================================================
   Views
   ========================================================================== */
const view = () => $('#view');
const head = (title, intro = '', actions = '') => `<header class="v-head"><div><h1>${esc(title)}</h1>${intro ? `<p>${esc(intro)}</p>` : ''}</div><div class="v-tools" style="margin:0">${actions}</div></header>`;
const skeleton = (n = 4) => Array.from({ length: n }, () => '<div class="skel"></div>').join('');
const errorBox = (err, retry) => {
  const b = el('div', 'panel', `<h2>Couldn't load this view</h2><p class="muted">${esc(firestoreError(err))}</p><p style="margin-top:12px"><button class="a-btn a-btn--sm" type="button">Try again</button></p>`);
  $('button', b).addEventListener('click', retry);
  return b;
};

/* ---------- Overview ---------- */
async function viewOverview() {
  view().innerHTML = head('Overview', 'Everything visitors see on the portfolio, in one place.') + skeleton(3);
  try {
    const [projects, messages, experience, achievements] = await Promise.all([fetchCol('projects'), fetchCol('contactMessages'), fetchCol('experience'), fetchCol('achievements')]);
    const unread = messages.filter((m) => !m.read).length;
    S.unread = unread; renderNav();
    const pub = projects.filter((p) => p.published).length;
    view().innerHTML = head('Overview', 'Everything visitors see on the portfolio, in one place.', '<a class="a-btn" href="../index.html" target="_blank" rel="noopener">View site</a>') + `
      ${!projects.length && !experience.length ? `<div class="banner"><p><strong>Firebase is connected but has no content yet.</strong> Import the default content to start from the current portfolio (projects, experience, achievements, skills, links and page copy). You can edit everything afterwards.</p><button class="a-btn a-btn--primary" type="button" id="importSeed">Import default content</button></div>` : ''}
      <div class="stats">
        <a class="stat" href="#/projects"><span class="stat__label">Published projects</span><span class="stat__value">${pub}</span><span class="stat__sub">${projects.length - pub} draft${projects.length - pub === 1 ? '' : 's'}</span></a>
        <a class="stat" href="#/messages"><span class="stat__label">Unread messages</span><span class="stat__value">${unread}</span><span class="stat__sub">${messages.length} total</span></a>
        <a class="stat" href="#/experience"><span class="stat__label">Experience entries</span><span class="stat__value">${experience.length}</span><span class="stat__sub">Shown on the timeline</span></a>
        <a class="stat" href="#/achievements"><span class="stat__label">Milestones</span><span class="stat__value">${achievements.length}</span><span class="stat__sub">In the archive</span></a>
      </div>
      <div class="panel"><h2>Quick actions</h2><div class="v-tools" style="margin:0">
        <a class="a-btn" href="#/projects?new=1">Add a project</a><a class="a-btn" href="#/featured">Edit featured moment</a><a class="a-btn" href="#/hero">Edit hero</a><a class="a-btn" href="#/settings">Site settings</a>
      </div></div>
      <div class="panel"><h2>Content tools</h2><p class="muted" style="font-size:14px;max-width:60ch">Import default content writes the original portfolio content into Firebase. Items with the same ID are overwritten; anything you added yourself is kept.</p><p style="margin-top:12px"><button class="a-btn a-btn--sm" type="button" id="importSeed2">Import default content</button></p></div>`;
    [$('#importSeed'), $('#importSeed2')].forEach((b) => b?.addEventListener('click', importSeed));
  } catch (err) { view().innerHTML = head('Overview'); view().append(errorBox(err, viewOverview)); }
}

async function importSeed() {
  if (!(await confirmDialog({ title: 'Import default content?', body: 'This writes the original portfolio content to Firebase. Items with matching IDs will be overwritten.', ok: 'Import content' }))) return;
  try {
    const { db, fs } = await fb();
    const batch = fs.writeBatch(db);
    const ts = fs.serverTimestamp();
    batch.set(fs.doc(db, 'siteSettings', 'main'), { ...seed.settings, updatedAt: ts });
    batch.set(fs.doc(db, 'heroContent', 'main'), { ...seed.hero, updatedAt: ts });
    batch.set(fs.doc(db, 'featured', 'huawei'), { ...seed.featured, updatedAt: ts });
    const cols = { projects: seed.projects, experience: seed.experience, achievements: seed.achievements, skills: seed.skills, socialLinks: seed.social, processSteps: seed.process, techFlow: seed.techflow };
    Object.entries(cols).forEach(([col, items]) => items.forEach(({ id, ...rest }) => batch.set(fs.doc(db, col, id), { ...rest, createdAt: ts, updatedAt: ts })));
    await batch.commit();
    toast('Default content imported');
    viewOverview();
  } catch (err) { toast(firestoreError(err), 5000); }
}

/* ---------- Collection list ---------- */
async function viewCollection(key, params) {
  const sc = SCHEMAS[key];
  let filter = 'all', query = '';
  view().innerHTML = head(sc.label, '', `<button class="a-btn a-btn--primary" type="button" id="addItem">Add ${esc(sc.singular)}</button>`) +
    `<div class="v-tools">
      <div class="search"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6"/><path d="M14 14l4 4"/></svg><input class="f__input" type="search" placeholder="Search ${esc(sc.label.toLowerCase())}" aria-label="Search ${esc(sc.label.toLowerCase())}" id="q"></div>
      ${sc.filters ? `<div class="seg" role="group" aria-label="Filter">${sc.filters.map(([v, l], i) => `<button type="button" data-f="${v}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div>` : ''}
    </div><div class="rows" id="rows">${skeleton(4)}</div><p class="f__help" style="margin-top:10px" id="orderHint">Drag the handle, or focus it and use the arrow keys, to change the order shown on the site.</p>`;

  let items = [];
  const rows = $('#rows');
  const visible = () => items.filter((d) => {
    if (filter === 'published' && !d.published) return false;
    if (filter === 'draft' && d.published) return false;
    if (filter === 'featured' && !d.featured) return false;
    if (!query) return true;
    return JSON.stringify([sc.title(d), sc.sub(d)]).toLowerCase().includes(query);
  });

  const saveOrder = debounce(async () => {
    try {
      const { db, fs } = await fb();
      const batch = fs.writeBatch(db);
      let changed = 0;
      items.forEach((d, i) => { if (d.order !== i) { d.order = i; batch.update(fs.doc(db, sc.col, d.id), { order: i }); changed++; } });
      if (changed) { await batch.commit(); toast('Order saved'); }
    } catch (err) { toast(firestoreError(err), 4000); }
  }, 400);

  const move = (from, to) => {
    if (to < 0 || to >= items.length || from === to) return;
    const [m] = items.splice(from, 1); items.splice(to, 0, m);
    render(); saveOrder();
  };

  function render() {
    const list = visible();
    const reorderable = !query && filter === 'all';
    $('#orderHint').hidden = !reorderable || items.length < 2;
    if (!items.length) {
      rows.innerHTML = `<div class="empty-state"><h2>No ${esc(sc.label.toLowerCase())} yet</h2><p>Add the first ${esc(sc.singular)} and it will appear on the site.</p><button class="a-btn a-btn--primary" type="button" data-add>Add ${esc(sc.singular)}</button></div>`;
      $('[data-add]', rows).addEventListener('click', () => edit(null));
      return;
    }
    if (!list.length) { rows.innerHTML = `<div class="empty-state"><h2>Nothing matches</h2><p>Try a different search or filter.</p></div>`; return; }
    rows.innerHTML = '';
    list.forEach((d) => {
      const i = items.indexOf(d);
      const r = el('div', 'row-item');
      r.draggable = reorderable;
      const thumb = sc.thumb?.(d);
      r.innerHTML = `
        <button class="handle" type="button" aria-label="Reorder ${esc(sc.title(d) || 'item')}, position ${i + 1} of ${items.length}" ${reorderable ? '' : 'disabled style="opacity:.3"'}><svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="4" cy="3" r="1.3"/><circle cx="10" cy="3" r="1.3"/><circle cx="4" cy="7" r="1.3"/><circle cx="10" cy="7" r="1.3"/><circle cx="4" cy="11" r="1.3"/><circle cx="10" cy="11" r="1.3"/></svg></button>
        <div class="row-item__thumb">${thumb ? `<img src="${esc(thumb)}" alt="" loading="lazy">` : ''}</div>
        <div class="row-item__main"><p class="row-item__title">${esc(sc.title(d) || 'Untitled')}</p><p class="row-item__sub">${esc(sc.sub(d) || '')}</p></div>
        <div class="row-item__flags">${(sc.flags || []).map(([k, on]) => `<button class="switch" type="button" role="switch" aria-checked="${!!d[k]}" data-flag="${k}"><span class="switch__track" aria-hidden="true"></span><span>${on}</span></button>`).join('')}</div>
        <div class="row-item__actions">
          <button class="icon-btn" type="button" data-edit aria-label="Edit ${esc(sc.title(d) || 'item')}"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M3 17h3l9-9-3-3-9 9zM11 6l3 3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>
          <button class="icon-btn icon-btn--danger" type="button" data-del aria-label="Delete ${esc(sc.title(d) || 'item')}"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>
        </div>`;
      $('[data-edit]', r).addEventListener('click', () => edit(d));
      $('.row-item__main', r).addEventListener('dblclick', () => edit(d));
      $('[data-del]', r).addEventListener('click', () => remove(d));
      $$('[data-flag]', r).forEach((b) => b.addEventListener('click', () => toggleFlag(d, b)));
      const h = $('.handle', r);
      h.addEventListener('keydown', (e) => {
        if (!reorderable) return;
        if (e.key === 'ArrowUp') { e.preventDefault(); move(i, i - 1); $$('.handle', rows)[Math.max(0, i - 1)]?.focus(); }
        if (e.key === 'ArrowDown') { e.preventDefault(); move(i, i + 1); $$('.handle', rows)[Math.min(items.length - 1, i + 1)]?.focus(); }
      });
      r.addEventListener('dragstart', (e) => { r.classList.add('is-dragging'); e.dataTransfer.setData('text/plain', String(i)); e.dataTransfer.effectAllowed = 'move'; });
      r.addEventListener('dragend', () => r.classList.remove('is-dragging'));
      r.addEventListener('dragover', (e) => { e.preventDefault(); r.classList.add('is-over'); });
      r.addEventListener('dragleave', () => r.classList.remove('is-over'));
      r.addEventListener('drop', (e) => { e.preventDefault(); r.classList.remove('is-over'); move(Number(e.dataTransfer.getData('text/plain')), i); });
      rows.append(r);
    });
  }

  async function toggleFlag(d, btn) {
    const k = btn.dataset.flag;
    const [, on, off] = sc.flags.find(([x]) => x === k);
    const next = !d[k];
    btn.setAttribute('aria-checked', String(next));
    try {
      const { db, fs } = await fb();
      await fs.updateDoc(fs.doc(db, sc.col, d.id), { [k]: next, updatedAt: fs.serverTimestamp() });
      d[k] = next;
      toast(next ? on : off);
      if (filter !== 'all') render();
    } catch (err) { btn.setAttribute('aria-checked', String(!next)); toast(firestoreError(err), 4000); }
  }

  async function remove(d) {
    if (!(await confirmDialog({ title: `Delete “${sc.title(d) || 'this item'}”?`, body: 'It will be removed from the site, along with any images it uses. This cannot be undone.', ok: 'Delete', danger: true }))) return;
    try {
      const { db, fs } = await fb();
      await fs.deleteDoc(fs.doc(db, sc.col, d.id));
      deleteFiles(collectImagePaths(d));
      items = items.filter((x) => x !== d);
      render(); toast('Deleted');
    } catch (err) { toast(firestoreError(err), 4000); }
  }

  async function edit(d) {
    const { db, fs } = await fb();
    const isNew = !d;
    const id = d?.id || fs.doc(fs.collection(db, sc.col)).id;
    const ctx = { col: sc.col, id, uploaded: [], removed: [] };
    const data = isNew ? { ...(sc.defaults || {}) } : structuredClone(d);
    openEditor({
      title: isNew ? `New ${sc.singular}` : `Edit ${sc.singular}`,
      groups: sc.groups, data, ctx,
      onSave: async (values) => {
        if (key === 'projects') {
          values.slug = slugify(values.slug || values.title);
          const clash = items.find((x) => x.id !== id && x.slug === values.slug);
          if (clash) throw new Error(`Another project already uses the slug “${values.slug}”. Choose a different one.`);
        }
        const { id: _omit, ...existing } = d || {};
        const payload = { ...existing, ...values, updatedAt: fs.serverTimestamp() };
        if (isNew) { payload.createdAt = fs.serverTimestamp(); payload.order = items.length; }
        await fs.setDoc(fs.doc(db, sc.col, id), payload);
        const saved = { id, ...payload };
        if (isNew) items.push(saved); else items[items.indexOf(d)] = saved;
        render();
      }
    });
  }

  $('#addItem').addEventListener('click', () => edit(null));
  $('#q').addEventListener('input', debounce((e) => { query = e.target.value.trim().toLowerCase(); render(); }, 120));
  $$('.seg button').forEach((b) => b.addEventListener('click', () => {
    filter = b.dataset.f; $$('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); render();
  }));

  try { items = await fetchCol(sc.col); render(); if (params.get('new')) edit(null); }
  catch (err) { rows.replaceWith(errorBox(err, () => viewCollection(key, params))); }
}

/* ---------- Singleton editors (inline form, not drawer) ---------- */
async function viewSingle(key) {
  const sc = SINGLES[key];
  view().innerHTML = head(sc.label, sc.intro) + skeleton(5);
  try {
    const stored = await fetchOne(sc.path);
    const data = { ...sc.base, ...(stored || {}) };
    const ctx = { col: sc.path[0], id: sc.path[1], uploaded: [], removed: [] };
    const built = buildForm(sc.groups, data, ctx);
    const form = el('form', 'single-form');
    form.noValidate = true;
    form.append(built.el);
    const actions = el('div', 'actions', `<span class="drawer__status" role="status" aria-live="polite"></span><button class="a-btn a-btn--primary" type="submit"><span>Save changes</span><i class="a-spin" aria-hidden="true"></i></button>`);
    form.append(actions);
    view().innerHTML = head(sc.label, sc.intro, stored ? '' : '<span class="badge">Using default content</span>');
    view().append(form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!built.validate()) return;
      const btn = $('button[type="submit"]', form), status = $('.drawer__status', form);
      btn.classList.add('is-busy'); status.textContent = 'Saving…'; status.className = 'drawer__status';
      try {
        const { db, fs } = await fb();
        await fs.setDoc(fs.doc(db, ...sc.path), { ...(stored || {}), ...built.get(), updatedAt: fs.serverTimestamp() });
        if (ctx.removed.length) deleteFiles(ctx.removed);
        ctx.uploaded = []; ctx.removed = [];
        status.textContent = 'Saved'; toast('Changes saved');
      } catch (err) { status.textContent = firestoreError(err); status.className = 'drawer__status is-error'; }
      finally { btn.classList.remove('is-busy'); }
    });
  } catch (err) { view().innerHTML = head(sc.label); view().append(errorBox(err, () => viewSingle(key))); }
}

/* ---------- Messages ---------- */
async function viewMessages() {
  let filter = 'all', query = '';
  view().innerHTML = head('Messages', 'Sent from the contact form on the site.') + `
    <div class="v-tools">
      <div class="search"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6"/><path d="M14 14l4 4"/></svg><input class="f__input" type="search" placeholder="Search messages" aria-label="Search messages" id="q"></div>
      <div class="seg" role="group" aria-label="Filter"><button type="button" data-f="all" aria-pressed="true">All</button><button type="button" data-f="unread" aria-pressed="false">Unread</button><button type="button" data-f="read" aria-pressed="false">Read</button></div>
    </div><div class="rows" id="rows">${skeleton(4)}</div>`;
  const rows = $('#rows');
  let items = [];
  const fmt = (ts) => { const d = ts?.toDate?.(); return d ? d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''; };
  const updateBadge = () => { S.unread = items.filter((m) => !m.read).length; renderNav(); };

  const setRead = async (m, read) => {
    const { db, fs } = await fb();
    await fs.updateDoc(fs.doc(db, 'contactMessages', m.id), { read });
    m.read = read; updateBadge(); render();
  };

  function render() {
    const list = items.filter((m) => (filter === 'all' || (filter === 'unread' ? !m.read : m.read)) &&
      (!query || `${m.name} ${m.email} ${m.message} ${m.projectType}`.toLowerCase().includes(query)));
    if (!items.length) { rows.innerHTML = '<div class="empty-state"><h2>No messages yet</h2><p>When someone uses the contact form, their message shows up here.</p></div>'; return; }
    if (!list.length) { rows.innerHTML = '<div class="empty-state"><h2>Nothing matches</h2><p>Try a different search or filter.</p></div>'; return; }
    rows.innerHTML = '';
    list.forEach((m) => {
      const r = el('div', `row-item${m.read ? '' : ' is-unread'}`);
      r.style.gridTemplateColumns = 'minmax(0,1fr) auto auto';
      r.innerHTML = `<div class="row-item__main"><p class="row-item__title">${esc(m.name)} <span class="muted" style="font-weight:400">${esc(m.email)}</span></p><p class="row-item__sub">${esc(m.projectType ? `${m.projectType}: ` : '')}${esc(m.message)}</p></div>
        <span class="muted" style="font-size:13px;white-space:nowrap">${esc(fmt(m.createdAt))}</span>
        <div class="row-item__actions"><button class="a-btn a-btn--sm" type="button" data-open>Open</button></div>`;
      $('[data-open]', r).addEventListener('click', () => open(m));
      rows.append(r);
    });
  }

  async function open(m) {
    if (!m.read) setRead(m, true).catch((e) => toast(firestoreError(e)));
    const reply = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(`Re: ${m.projectType || 'your message'}`)}`;
    const editor = openEditor({
      title: m.name,
      data: { html: `<dl class="msg-meta"><dt>From</dt><dd>${esc(m.name)}</dd><dt>Email</dt><dd><a href="mailto:${esc(m.email)}">${esc(m.email)}</a></dd><dt>About</dt><dd>${esc(m.projectType || '—')}</dd><dt>Received</dt><dd>${esc(fmt(m.createdAt))}</dd></dl>
        <div class="msg-body">${esc(m.message)}</div>
        <div class="v-tools" style="margin-top:16px"><a class="a-btn a-btn--primary" href="${reply}">Reply by email</a><button class="a-btn" type="button" data-unread>Mark as unread</button><button class="a-btn a-btn--danger" type="button" data-del>Delete</button></div>` }
    });
    $('[data-unread]').addEventListener('click', async () => { await setRead(m, false); toast('Marked as unread'); editor.close(true); });
    $('[data-del]').addEventListener('click', async () => {
      if (!(await confirmDialog({ title: 'Delete this message?', body: 'This cannot be undone.', ok: 'Delete', danger: true }))) return;
      try {
        const { db, fs } = await fb();
        await fs.deleteDoc(fs.doc(db, 'contactMessages', m.id));
        items = items.filter((x) => x !== m); updateBadge(); render(); toast('Message deleted'); editor.close(true);
      } catch (err) { toast(firestoreError(err), 4000); }
    });
  }

  $('#q').addEventListener('input', debounce((e) => { query = e.target.value.trim().toLowerCase(); render(); }, 120));
  $$('.seg button').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; $$('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); render(); }));
  try {
    const { db, fs } = await fb();
    const snap = await fs.getDocs(fs.query(fs.collection(db, 'contactMessages'), fs.orderBy('createdAt', 'desc')));
    items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    updateBadge(); render();
  } catch (err) { rows.replaceWith(errorBox(err, viewMessages)); }
}

/* ==========================================================================
   Navigation + routing (hash-based so it works on GitHub Pages)
   ========================================================================== */
function renderNav() {
  const current = (location.hash.replace(/^#\/?/, '').split('?')[0]) || 'overview';
  $('#sideNav').innerHTML = NAV.map(([group, items]) =>
    (group ? `<p class="group">${esc(group)}</p>` : '') + items.map(([id, label, icon]) =>
      `<a class="side__item" href="#/${id}" ${current === id ? 'aria-current="page"' : ''}><svg viewBox="0 0 20 20" aria-hidden="true">${NAV_ICONS[icon]}</svg><span>${esc(label)}</span>${id === 'messages' && S.unread ? `<span class="pill" aria-label="${S.unread} unread">${S.unread}</span>` : ''}</a>`).join('')).join('');
}

function route() {
  const [path, qs] = location.hash.replace(/^#\/?/, '').split('?');
  const key = path || 'overview';
  const params = new URLSearchParams(qs || '');
  renderNav();
  if ($('#drawer').open) $('#drawer').close();
  if (key === 'overview') viewOverview();
  else if (key === 'messages') viewMessages();
  else if (SCHEMAS[key]) viewCollection(key, params);
  else if (SINGLES[key]) viewSingle(key);
  else { location.hash = '#/overview'; return; }
  view().focus({ preventScroll: true });
  scrollTo(0, 0);
}

/* ==========================================================================
   Auth gate
   ========================================================================== */
const gate = (html) => { $('#shell').hidden = true; $('#gate').hidden = false; $('#gateBody').innerHTML = html; };

function gateSetup() {
  gate(`<h1>Connect Firebase to start editing</h1>
    <p class="muted">The site is running on its default content. To manage it from here:</p>
    <ol><li>Create a Firebase project and a Web app.</li><li>Paste its config into <code>js/config.js</code>.</li><li>Enable Email/Password sign-in, Firestore and Storage.</li><li>Deploy <code>firestore.rules</code> and <code>storage.rules</code>.</li><li>Reload this page and sign in.</li></ol>
    <p class="muted" style="margin-top:12px">The README has the full walkthrough.</p>`);
}

function gateLogin(fbx) {
  gate(`<h1>Sign in to Studio</h1><p class="muted">Manage projects, experience and everything else on the portfolio.</p>
    <form id="login" novalidate>
      <div class="f"><label class="f__label" for="lemail">Email</label><input class="f__input" id="lemail" type="email" autocomplete="username" required></div>
      <div class="f"><label class="f__label" for="lpass"><span>Password</span><button type="button" class="link-btn" id="showPass" aria-pressed="false" style="padding:0">Show</button></label><input class="f__input" id="lpass" type="password" autocomplete="current-password" required></div>
      <p class="f__error" id="lerr" role="alert" hidden></p>
      <button class="a-btn a-btn--primary" type="submit" style="min-height:46px"><span>Sign in</span><i class="a-spin" aria-hidden="true"></i></button>
      <div class="row"><button type="button" class="link-btn" id="forgot">Forgot password?</button><a class="link-btn" href="../index.html">Back to site</a></div>
    </form>`);
  const form = $('#login'), err = $('#lerr'), btn = $('button[type="submit"]', form);
  const showErr = (m) => { err.textContent = m; err.hidden = !m; };
  $('#showPass').addEventListener('click', (e) => {
    const p = $('#lpass'); const on = p.type === 'password';
    p.type = on ? 'text' : 'password'; e.target.textContent = on ? 'Hide' : 'Show'; e.target.setAttribute('aria-pressed', String(on));
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); showErr('');
    const email = $('#lemail').value.trim(), pass = $('#lpass').value;
    if (!email || !pass) return showErr('Enter your email and password.');
    btn.classList.add('is-busy');
    try { await fbx.authMod.signInWithEmailAndPassword(fbx.auth, email, pass); }
    catch (ex) { showErr(AUTH_ERRORS[ex.code] || 'Sign-in failed. Try again.'); }
    finally { btn.classList.remove('is-busy'); }
  });
  $('#forgot').addEventListener('click', async () => {
    const email = $('#lemail').value.trim();
    if (!email) { showErr('Enter your email above, then select "Forgot password?" again.'); $('#lemail').focus(); return; }
    try { await fbx.authMod.sendPasswordResetEmail(fbx.auth, email); showErr(''); toast('Password reset email sent', 4000); }
    catch (ex) { showErr(AUTH_ERRORS[ex.code] || 'Could not send the reset email.'); }
  });
  $('#lemail').focus();
}

function gateDenied(user, fbx) {
  gate(`<h1>This account isn't an admin</h1>
    <p class="muted">You're signed in as ${esc(user.email)}, but this account doesn't have admin access. To grant it, create a document in the <code>admins</code> collection with this ID:</p>
    <p style="margin-top:12px"><code id="uidv">${esc(user.uid)}</code></p>
    <div class="row" style="margin-top:20px"><button class="a-btn a-btn--sm" type="button" id="copyUid">Copy user ID</button><button class="a-btn a-btn--sm" type="button" id="out">Sign out</button></div>`);
  $('#copyUid').addEventListener('click', async () => { await navigator.clipboard?.writeText(user.uid); toast('User ID copied'); });
  $('#out').addEventListener('click', () => fbx.authMod.signOut(fbx.auth));
}

async function isAdmin(user) {
  try { return !!(await fetchOne(['admins', user.uid])); } catch { return false; }
}

async function start() {
  if (!isFirebaseConfigured()) return gateSetup();
  let fbx;
  try { fbx = await fb(); } catch (err) { return gate(`<h1>Couldn't load Firebase</h1><p class="muted">${esc(err.message)}. Check your connection and reload.</p>`); }
  S.fb = fbx;
  fbx.authMod.onAuthStateChanged(fbx.auth, async (user) => {
    S.user = user;
    if (!user) return gateLogin(fbx);
    gate('<p class="muted">Checking access…</p>');
    if (!(await isAdmin(user))) return gateDenied(user, fbx);
    $('#gate').hidden = true; $('#shell').hidden = false;
    $('#userEmail').textContent = user.email;
    $('#signOut').onclick = async () => { await fbx.authMod.signOut(fbx.auth); toast('Signed out'); };
    try { const s = await fetchOne(['siteSettings', 'main']); if (s?.accentColor) applyAccent(s.accentColor); } catch { /* ignore */ }
    if (!location.hash) location.hash = '#/overview';
    route();
  });
  addEventListener('hashchange', () => { if (S.user) route(); });
}

initTheme();
start();
