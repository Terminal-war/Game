import { type User } from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { PlayerProfile } from '../types/domain';

function buildDefaultProfile(user: User) {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Operator',
    photoURL: user.photoURL ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isAdmin: false,
    isBanned: false,
    banReason: null,
    level: 1,
    xp: 0,
    nops: 0,
    flux: 0,
    rankPoints: 0,
    featureFlags: {
      chatEnabled: false,
      pvpEnabled: true,
      casinoEnabled: true,
      marketEnabled: true,
    },
  };
}

export async function ensurePlayerProfile(user: User) {
  const playerRef = doc(db, 'players', user.uid);
  await setDoc(playerRef, buildDefaultProfile(user), { merge: true });
}

export function watchPlayerProfile(uid: string, onData: (profile: PlayerProfile | null) => void) {
  return onSnapshot(doc(db, 'players', uid), (snapshot) => {
    if (!snapshot.exists()) {
      onData(null);
      return;
    }

    onData(snapshot.data() as PlayerProfile);
  });
}
