import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import type { CommandCatalogItem, CommandResult } from '../types/game';

const localCooldowns = new Map<string, number>();

export const COMMAND_CATALOG: CommandCatalogItem[] = [
  {
    id: 'phish',
    label: 'phish',
    cooldownMs: 12_000,
    minPayout: 1,
    maxPayout: 5,
    failFine: -2,
    successChance: 0.71,
    lessonCost: 0,
    requiredLevel: 1,
  },
  {
    id: 'scan-port',
    label: 'scan-port',
    cooldownMs: 18_000,
    minPayout: 6,
    maxPayout: 14,
    failFine: -4,
    successChance: 0.64,
    lessonCost: 60,
    requiredLevel: 2,
  },
  {
    id: 'load-gitconfig',
    label: 'load-gitconfig',
    cooldownMs: 30_000,
    minPayout: 16,
    maxPayout: 32,
    failFine: -8,
    successChance: 0.55,
    lessonCost: 180,
    requiredLevel: 4,
  },
];

export const STARTER_COMMAND = COMMAND_CATALOG[0];

type RunCommandPayload = {
  commandId: string;
};

type RunCommandResponse = {
  result: CommandResult;
};

export async function runCommand(commandId: string): Promise<CommandResult> {
  try {
    if (!functions) throw new Error('Functions unavailable');
    const callable = httpsCallable<RunCommandPayload, RunCommandResponse>(functions, 'runCommand');
    const response = await callable({ commandId });
    return response.data.result;
  } catch {
    return runCommandLocalFallback(commandId);
  }
}

function runCommandLocalFallback(commandId: string): CommandResult {
  const command = COMMAND_CATALOG.find((c) => c.id === commandId) ?? STARTER_COMMAND;
  const now = Date.now();
  const nextReadyAt = localCooldowns.get(command.id) ?? 0;

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

  const success = Math.random() < command.successChance;
  const payout = success
    ? Math.floor(Math.random() * (command.maxPayout - command.minPayout + 1)) + command.minPayout
    : command.failFine;

  localCooldowns.set(command.id, now + command.cooldownMs);

  return {
    commandId,
    ok: success,
    deltaNop: payout,
    nextReadyAt: now + command.cooldownMs,
    reason: success ? 'SUCCESS' : 'FAILED',
    traceId: `local-${now}`,
  };
}
