import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { AdminAction, LiveOpsMessage } from '../types/domain';

export function watchAdminActions(onData: (actions: AdminAction[]) => void) {
  return onSnapshot(
    query(collection(db, 'adminActions'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      onData(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<AdminAction, 'id'>) })));
    },
    () => onData([]),
  );
}

export function watchLiveOpsMessages(onData: (messages: LiveOpsMessage[]) => void) {
  return onSnapshot(
    query(collection(db, 'liveOps'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      onData(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<LiveOpsMessage, 'id'>) })));
    },
    () => onData([]),
  );
}

export async function pushGlobalAnnouncement(actorUid: string, text: string) {
  await addDoc(collection(db, 'liveOps'), {
    type: 'announcement',
    text,
    active: true,
    createdBy: actorUid,
    createdAt: serverTimestamp(),
  });

  await addDoc(collection(db, 'adminActions'), {
    actorUid,
    actionType: 'announcement',
    target: 'global',
    payloadSummary: text.slice(0, 120),
    createdAt: serverTimestamp(),
  });
}

export async function pushAdminAction(actorUid: string, actionType: string, target: string, payloadSummary: string) {
  await addDoc(collection(db, 'adminActions'), {
    actorUid,
    actionType,
    target,
    payloadSummary,
    createdAt: serverTimestamp(),
  });
}
