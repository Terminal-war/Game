export type PlayerProfile = {
  uid: string;
  handle: string;
  email: string;
  level: number;
  xp: number;
  nop: number;
  flux: number;
  isAdmin: boolean;
  createdAt: number;
  updatedAt: number;
};

export type CommandCatalogItem = {
  id: string;
  label: string;
  cooldownMs: number;
  minPayout: number;
  maxPayout: number;
  failFine: number;
  successChance: number;
};

export type CommandResult = {
  commandId: string;
  ok: boolean;
  deltaNop: number;
  nextReadyAt: number;
  reason: 'SUCCESS' | 'FAILED' | 'COOLDOWN';
  traceId: string;
};
