import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();

const db = getFirestore();

const COMMANDS = {
  phish: { cooldownMs: 12000, minPayout: 1, maxPayout: 5, failFine: -2, successChance: 0.71 },
} as const;

export const runCommand = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  const uid = request.auth.uid;
  const commandId = String(request.data?.commandId ?? '');
  const command = COMMANDS[commandId as keyof typeof COMMANDS];

  if (!command) {
    throw new HttpsError('invalid-argument', 'Unknown command.');
  }

  const now = Date.now();
  const coolRef = db.collection('cooldowns').doc(`${uid}_${commandId}`);
  const userRef = db.collection('users').doc(uid);

  const result = await db.runTransaction(async (tx) => {
    const [coolSnap, userSnap] = await Promise.all([tx.get(coolRef), tx.get(userRef)]);

    if (!userSnap.exists) {
      throw new HttpsError('failed-precondition', 'User profile missing.');
    }

    const nextReadyAt = Number(coolSnap.get('nextReadyAt') ?? 0);
    if (now < nextReadyAt) {
      return {
        commandId,
        ok: false,
        deltaNop: 0,
        nextReadyAt,
        reason: 'COOLDOWN' as const,
        traceId: `cool-${uid}-${now}`,
      };
    }

    const success = Math.random() < command.successChance;
    const deltaNop = success
      ? Math.floor(Math.random() * (command.maxPayout - command.minPayout + 1)) + command.minPayout
      : command.failFine;

    tx.set(coolRef, { nextReadyAt: now + command.cooldownMs, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    const currentNop = Number(userSnap.get('nop') ?? 0);
    tx.update(userRef, {
      nop: Math.max(0, currentNop + deltaNop),
      xp: FieldValue.increment(success ? 4 : 1),
      updatedAt: now,
      updatedAtServer: FieldValue.serverTimestamp(),
    });

    return {
      commandId,
      ok: success,
      deltaNop,
      nextReadyAt: now + command.cooldownMs,
      reason: success ? ('SUCCESS' as const) : ('FAILED' as const),
      traceId: `trace-${uid}-${now}`,
    };
  });

  return { result };
});
