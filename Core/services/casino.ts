import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import type { CasinoPlayRequest, CasinoRoundResult } from '../types/domain';

const playCasinoRoundFn = httpsCallable<CasinoPlayRequest, CasinoRoundResult>(functions, 'playCasinoRound');

export async function playCasinoRound(request: CasinoPlayRequest) {
  const result = await playCasinoRoundFn(request);
  return result.data;
}
