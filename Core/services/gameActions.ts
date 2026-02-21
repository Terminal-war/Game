import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import type { CommandExecutionRequest } from '../types/domain';

const executeCommandFn = httpsCallable<
  CommandExecutionRequest,
  { ok: boolean; reward?: number; xp?: number; cooldownSec?: number; trace?: string[] }
>(functions, 'executeCommand');

export async function executeCommand(request: CommandExecutionRequest) {
  const result = await executeCommandFn(request);
  return result.data;
}
