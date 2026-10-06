/**
 * Lazy Firebase loader.
 * The SDK (~100 kB) is only downloaded when it is actually needed,
 * so first paint never waits on it.
 */
import { firebaseConfig, isFirebaseConfigured } from './config.js';

const V = '10.12.2';
const CDN = `https://www.gstatic.com/firebasejs/${V}`;
let cache = null;

export async function getFirebase({ auth = false, storage = false } = {}) {
  if (!isFirebaseConfigured()) throw new Error('firebase-not-configured');
  if (!cache) {
    const [appMod, fsMod] = await Promise.all([
      import(`${CDN}/firebase-app.js`),
      import(`${CDN}/firebase-firestore.js`)
    ]);
    const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(firebaseConfig);
    cache = { app, fs: fsMod, db: fsMod.getFirestore(app) };
  }
  if (auth && !cache.authMod) {
    cache.authMod = await import(`${CDN}/firebase-auth.js`);
    cache.auth = cache.authMod.getAuth(cache.app);
  }
  if (storage && !cache.stMod) {
    cache.stMod = await import(`${CDN}/firebase-storage.js`);
    cache.storage = cache.stMod.getStorage(cache.app);
  }
  return cache;
}

export { isFirebaseConfigured };
