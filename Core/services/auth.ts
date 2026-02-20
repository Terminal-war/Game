import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, firebaseReady } from './firebase';
import type { PlayerProfile } from '../types/game';

const guestProfile: PlayerProfile = {
  uid: 'guest-local',
  handle: 'GuestOperator',
  email: 'guest@local',
  level: 1,
  xp: 0,
  nop: 25,
  flux: 0,
  isAdmin: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export async function login(email: string, password: string) {
  if (!firebaseReady || !auth) return { user: null };
  return signInWithEmailAndPassword(auth, email, password);
}

export async function register(email: string, password: string, handle: string) {
  if (!firebaseReady || !auth) return { user: null };
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await ensurePlayerProfile(cred.user, handle);
  return cred;
}

export function logout() {
  if (!firebaseReady || !auth) return Promise.resolve();
  return signOut(auth);
}

export function observeAuth(callback: (user: User | null) => void) {
  if (!firebaseReady || !auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, callback);
}

export async function ensurePlayerProfile(user: User, handle?: string): Promise<PlayerProfile> {
  if (!firebaseReady || !db) return { ...guestProfile, handle: handle ?? guestProfile.handle };

  const ref = doc(db, 'users', user.uid);
  const now = Date.now();
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const profile: PlayerProfile = {
      uid: user.uid,
      handle: handle ?? user.email?.split('@')[0] ?? `runner-${user.uid.slice(0, 6)}`,
      email: user.email ?? '',
      level: 1,
      xp: 0,
      nop: 25,
      flux: 0,
      isAdmin: false,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(ref, {
      ...profile,
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp(),
    });

    return profile;
  }

  await updateDoc(ref, { updatedAt: now, updatedAtServer: serverTimestamp() });
  return snap.data() as PlayerProfile;
}

export async function loadProfile(uid: string): Promise<PlayerProfile | null> {
  if (!firebaseReady || !db) return guestProfile;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as PlayerProfile;
}

export function getGuestProfile() {
  return { ...guestProfile };
}
