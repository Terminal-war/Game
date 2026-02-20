import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { PlayerProfile } from '../types/game';

export async function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function register(email: string, password: string, handle: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await ensurePlayerProfile(cred.user, handle);
  return cred;
}

export function logout() {
  return signOut(auth);
}

export function observeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function ensurePlayerProfile(user: User, handle?: string): Promise<PlayerProfile> {
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
      nop: 0,
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
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as PlayerProfile;
}
