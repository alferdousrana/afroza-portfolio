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
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

export const isFirebaseConfigured = () =>
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_') &&
  !!firebaseConfig.projectId && !firebaseConfig.projectId.startsWith('YOUR_');
