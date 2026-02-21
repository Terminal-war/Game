import type { FirebaseApp } from 'firebase/app';
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { logBoot } from './runtime/diagnostics';

type FirebaseBootstrapStatus = {
  ok: boolean;
  message: string;
  analyticsEnabled: boolean;
};

type FirebaseConfigShape = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

const firebaseConfig: FirebaseConfigShape = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyDOrfbRuZHuGMa8MnVnqVKxheLHQwTVi2o',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'rootaccess-1b39e.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'rootaccess-1b39e',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'rootaccess-1b39e.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '1089338439121',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:1089338439121:web:1e26fc0a5e5abb02221cf0',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-WGQPLVYHJX',
};

function validateFirebaseConfig(config: FirebaseConfigShape) {
  const requiredFields: Array<keyof FirebaseConfigShape> = ['apiKey', 'authDomain', 'projectId', 'appId', 'messagingSenderId', 'storageBucket'];
  const missing = requiredFields.filter((key) => !config[key]);
  if (missing.length > 0) {
    const message = `Missing firebase config fields: ${missing.join(', ')}`;
    logBoot('firebase-config', message, 'error');
  }

  logBoot('firebase-config', 'Firebase config validated.', 'info', { projectId: config.projectId, authDomain: config.authDomain });
}

const firebaseAppInstance: FirebaseApp = initializeApp(firebaseConfig);
let bootstrap: FirebaseBootstrapStatus = {
  ok: true,
  message: 'Firebase initialized successfully.',
  analyticsEnabled: false,
};

try {
  validateFirebaseConfig(firebaseConfig);
  logBoot('firebase-init', 'Core Firebase app initialized.');
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown Firebase initialization error';
  bootstrap = {
    ok: false,
    message,
    analyticsEnabled: false,
  };
  logBoot('firebase-init', `Firebase config validation warning: ${message}`, 'warn');
}

export const firebaseApp = firebaseAppInstance;
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp);

void isSupported()
  .then((ok) => {
    if (!ok || !firebaseConfig.measurementId) {
      logBoot('firebase-analytics', 'Analytics not supported in this runtime.', 'warn');
      return;
    }

    getAnalytics(firebaseApp);
    bootstrap = {
      ...bootstrap,
      analyticsEnabled: true,
    };
    logBoot('firebase-analytics', 'Analytics initialized.');
  })
  .catch((error) => {
    logBoot('firebase-analytics', 'Analytics initialization failed.', 'warn', {
      message: error instanceof Error ? error.message : String(error),
    });
  });

export function getFirebaseBootstrapStatus() {
  return bootstrap;
}
