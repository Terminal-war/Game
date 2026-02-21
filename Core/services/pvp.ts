import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import type { PvpQueueTicket } from '../types/domain';

export function watchPvpQueue(onData: (tickets: PvpQueueTicket[]) => void) {
  return onSnapshot(
    collection(db, 'pvpQueue'),
    (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<PvpQueueTicket, 'id'>) }))),
    () => onData([]),
  );
}

export async function joinPvpQueue(uid: string, displayName: string) {
  await setDoc(doc(db, 'pvpQueue', uid), {
    uid,
    displayName,
    status: 'queued',
    queuedAt: serverTimestamp(),
    score: 0,
    shardRatio: 0,
  }, { merge: true });
}

export async function leavePvpQueue(uid: string) {
  await deleteDoc(doc(db, 'pvpQueue', uid));
}
