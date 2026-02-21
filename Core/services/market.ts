import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { CommandCatalogItem, LessonProgress, PlayerInventoryItem } from '../types/domain';

const fallbackCatalog: CommandCatalogItem[] = [
  {
    id: 'phish',
    title: 'Phish',
    command: 'phish',
    lessonCost: 5,
    minReward: 1,
    maxReward: 5,
    xpReward: 10,
    cooldownSec: 10,
    requiredLevel: 1,
    lessonOnly: false,
  },
  {
    id: 'scan-port',
    title: 'Scan Port',
    command: 'scan-port',
    lessonCost: 80,
    minReward: 8,
    maxReward: 14,
    xpReward: 25,
    cooldownSec: 45,
    requiredLevel: 5,
    lessonOnly: true,
  },
  {
    id: 'load-gitconfig-pulse',
    title: 'Load Gitconfig PULSE',
    command: 'load-gitconfig pulse',
    lessonCost: 300,
    minReward: 40,
    maxReward: 65,
    xpReward: 80,
    cooldownSec: 180,
    requiredLevel: 14,
    lessonOnly: true,
  },
];

export function watchCommandCatalog(onData: (items: CommandCatalogItem[]) => void) {
  return onSnapshot(
    collection(db, 'commandCatalog'),
    (snapshot) => {
      if (snapshot.empty) {
        onData(fallbackCatalog);
        return;
      }

      const items = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<CommandCatalogItem, 'id'>) }));
      onData(items);
    },
    () => {
      onData(fallbackCatalog);
    },
  );
}

export function watchPlayerInventory(uid: string, onData: (items: PlayerInventoryItem[]) => void) {
  return onSnapshot(collection(db, 'players', uid, 'inventory'), (snapshot) => {
    const items = snapshot.docs.map((item) => item.data() as PlayerInventoryItem);
    onData(items);
  });
}

export function watchLessonProgress(uid: string, onData: (items: LessonProgress[]) => void) {
  return onSnapshot(collection(db, 'players', uid, 'lessonProgress'), (snapshot) => {
    const items = snapshot.docs.map((item) => item.data() as LessonProgress);
    onData(items);
  });
}

export async function completeLesson(uid: string, commandId: string) {
  const trait = Math.random() <= 0.00001 ? 'spring' : null;
  await setDoc(
    doc(db, 'players', uid, 'lessonProgress', commandId),
    {
      commandId,
      completed: true,
      completedAt: serverTimestamp(),
      trait,
    },
    { merge: true },
  );

  return trait;
}
