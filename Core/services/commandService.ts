import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { db, functions } from './firebase';
import type { CommandCatalogItem, CommandResult } from '../types/game';

export const STARTER_COMMAND: CommandCatalogItem = {
  id: 'phish',
  label: 'phish',
  cooldownMs: 12_000,
  minPayout: 1,
  maxPayout: 5,
  failFine: -2,
  successChance: 0.71,
};

type RunCommandPayload = {
  commandId: string;
};

type RunCommandResponse = {
  result: CommandResult;
};

export async function runCommand(commandId: string): Promise<CommandResult> {
  try {
    const callable = httpsCallable<RunCommandPayload, RunCommandResponse>(functions, 'runCommand');
    const response = await callable({ commandId });
    return response.data.result;
  } catch {
    return runCommandLocalFallback(commandId);
  }
}

async function runCommandLocalFallback(commandId: string): Promise<CommandResult> {
  const now = Date.now();
  const cacheRef = doc(db, 'localCommandCooldowns', commandId);
  const cache = await getDoc(cacheRef);
  const nextReadyAt = Number(cache.data()?.nextReadyAt ?? 0);

  if (now < nextReadyAt) {
    return {
      commandId,
      ok: false,
      deltaNop: 0,
      nextReadyAt,
      reason: 'COOLDOWN',
      traceId: `local-${now}`,
    };
  }

  const success = Math.random() < STARTER_COMMAND.successChance;
  const payout = success
    ? Math.floor(Math.random() * (STARTER_COMMAND.maxPayout - STARTER_COMMAND.minPayout + 1)) + STARTER_COMMAND.minPayout
    : STARTER_COMMAND.failFine;

  return {
    commandId,
    ok: success,
    deltaNop: payout,
    nextReadyAt: now + STARTER_COMMAND.cooldownMs,
    reason: success ? 'SUCCESS' : 'FAILED',
    traceId: `local-${now}`,
  };
}
