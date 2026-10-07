/**
 * Content data layer.
 * Strategy:
 *  - Firebase not configured  → default content (seed-data.js)
 *  - Firebase configured      → Firestore (6s timeout)
 *       on error/timeout      → last good copy from localStorage → defaults
 * Empty collections stay empty so the UI can show honest empty states.
 */
import { getFirebase, isFirebaseConfigured } from './firebase.js';
import { seed } from './seed-data.js';
import { withTimeout, byOrder } from './utils.js';

const CACHE_KEY = 'ar-content-v2';

export const COLLECTIONS = {
  settings: ['siteSettings', 'main'],
  hero: ['heroContent', 'main'],
  page: ['pageContent', 'main'],
  gallery: 'gallery',
  featured: ['featured', 'huawei'],
  projects: 'projects',
  experience: 'experience',
  achievements: 'achievements',
  skills: 'skills',
  social: 'socialLinks',
  process: 'processSteps',
  techflow: 'techFlow',
  messages: 'contactMessages'
};

async function fetchAll() {
  const { db, fs } = await getFirebase();
  const one = async ([col, id]) => {
    const snap = await fs.getDoc(fs.doc(db, col, id));
    return snap.exists() ? snap.data() : null;
  };
  const many = async (col, publishedOnly = false) => {
    const ref = fs.collection(db, col);
    const q = publishedOnly ? fs.query(ref, fs.where('published', '==', true)) : ref;
    const snap = await fs.getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .filter((d) => d.published !== false)
      .sort(byOrder);
  };

  // v2 content is optional: if its rules aren't deployed yet, the rest still loads
  const soft = (p, fallback) => p.catch((err) => { console.warn('[content] optional read failed:', err.code || err.message); return fallback; });

  const [settings, hero, featured, projects, experience, achievements, skills, social, process, techflow, page, gallery] = await Promise.all([
    one(COLLECTIONS.settings), one(COLLECTIONS.hero), one(COLLECTIONS.featured),
    many(COLLECTIONS.projects, true), many(COLLECTIONS.experience), many(COLLECTIONS.achievements),
    many(COLLECTIONS.skills), many(COLLECTIONS.social), many(COLLECTIONS.process), many(COLLECTIONS.techflow),
    soft(one(COLLECTIONS.page), null), soft(many(COLLECTIONS.gallery, true), null)
  ]);

  return {
    // Singletons fall back field-by-field to defaults so identity never goes blank
    settings: { ...seed.settings, ...(settings || {}) },
    hero: { ...seed.hero, ...(hero || {}) },
    page: { ...seed.page, ...(page || {}) },
    featured: featured ? { ...seed.featured, ...featured } : seed.featured,
    projects, experience, achievements, skills, social,
    // Methodology content falls back to defaults if never customised
    process: process.length ? process : seed.process,
    techflow: techflow.length ? techflow : seed.techflow,
    // Gallery shows the default set until the first image is added in Studio
    gallery: gallery?.length ? gallery : seed.gallery
  };
}

/** Last good content, read synchronously (lets the loader show the right words instantly). */
export function peekCachedContent() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { return null; }
}

export async function loadContent() {
  if (!isFirebaseConfigured()) return { ...structuredClone(seed), source: 'default' };
  try {
    const data = await withTimeout(fetchAll(), 6000, 'firestore-timeout');
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) { /* quota/private mode */ }
    return { ...data, source: 'firebase' };
  } catch (err) {
    console.warn('[content] Firestore unavailable, using fallback:', err.message);
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached) return { ...structuredClone(seed), ...cached, page: { ...seed.page, ...(cached.page || {}) }, source: 'cache' };
    } catch (e) { /* ignore */ }
    return { ...structuredClone(seed), source: 'default' };
  }
}

/** Store a contact message. Throws 'firebase-not-configured' so caller can fall back to mailto. */
export async function submitContact({ name, email, projectType, message }) {
  const { db, fs } = await getFirebase();
  await withTimeout(fs.addDoc(fs.collection(db, COLLECTIONS.messages), {
    name: name.trim().slice(0, 120),
    email: email.trim().slice(0, 200),
    projectType: String(projectType || '').slice(0, 60),
    message: message.trim().slice(0, 5000),
    read: false,
    createdAt: fs.serverTimestamp()
  }), 10000, 'submit-timeout');
}
