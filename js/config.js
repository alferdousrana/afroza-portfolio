/**
 * Firebase web config.
 * These values are PUBLIC identifiers, not secrets. Security comes from
 * Firestore/Storage rules + Authentication, never from hiding this object.
 * Never put Admin SDK service-account credentials in frontend code.
 *
 * Paste the config from: Firebase console → Project settings → Your apps → Web app.
 * Until you do, the site runs on the default content in seed-data.js.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyALmGoKu942To5aTIUvtB1jNA4q39KKP_g",
  authDomain: "afroza-portfolio.firebaseapp.com",
  projectId: "afroza-portfolio",
  storageBucket: "afroza-portfolio.firebasestorage.app",
  messagingSenderId: "98995344047",
  appId: "1:98995344047:web:d02d9286f23b3a2cf07a5a",
};

export const isFirebaseConfigured = () =>
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_') &&
  !!firebaseConfig.projectId && !firebaseConfig.projectId.startsWith('YOUR_');
