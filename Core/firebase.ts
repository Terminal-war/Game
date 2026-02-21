import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyDOrfbRuZHuGMa8MnVnqVKxheLHQwTVi2o',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'rootaccess-1b39e.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'rootaccess-1b39e',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'rootaccess-1b39e.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '1089338439121',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:1089338439121:web:1e26fc0a5e5abb02221cf0',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-WGQPLVYHJX',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp);

isSupported().then((ok) => {
  if (ok && firebaseConfig.measurementId) {
    getAnalytics(firebaseApp);
  }
});
