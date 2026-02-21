import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { ChatGate, ChatMessage } from '../types/domain';

export function watchChatMessages(onData: (items: ChatMessage[]) => void) {
  return onSnapshot(
    query(collection(db, 'chatMessages'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      onData(snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<ChatMessage, 'id'>) })));
    },
    () => onData([]),
  );
}

export function watchChatGate(onData: (gate: ChatGate) => void) {
  return onSnapshot(
    doc(db, 'chatConfig', 'gate'),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData({ open: false, pollQuestion: null, updatedAt: Date.now(), updatedBy: 'system' });
        return;
      }
      onData(snapshot.data() as ChatGate);
    },
    () => onData({ open: false, pollQuestion: null, updatedAt: Date.now(), updatedBy: 'system' }),
  );
}

export async function sendChatMessage(uid: string, displayName: string, text: string) {
  await addDoc(collection(db, 'chatMessages'), {
    uid,
    displayName,
    text: text.slice(0, 220),
    createdAt: serverTimestamp(),
  });
}

export async function setChatGate(actorUid: string, open: boolean, pollQuestion: string | null) {
  await setDoc(
    doc(db, 'chatConfig', 'gate'),
    {
      open,
      pollQuestion,
      updatedAt: serverTimestamp(),
      updatedBy: actorUid,
    },
    { merge: true },
  );
}
