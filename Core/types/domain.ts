export type FeatureFlags = {
  chatEnabled: boolean;
  pvpEnabled: boolean;
  casinoEnabled: boolean;
  marketEnabled: boolean;
};

export type PlayerProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: number;
  updatedAt: number;
  isAdmin: boolean;
  isBanned: boolean;
  banReason: string | null;
  level: number;
  xp: number;
  nops: number;
  flux: number;
  rankPoints: number;
  featureFlags: FeatureFlags;
};

export type CommandExecutionRequest = {
  commandId: string;
  nonce: string;
  args?: string[];
};

export type CommandCatalogItem = {
  id: string;
  title: string;
  command: string;
  lessonCost: number;
  minReward: number;
  maxReward: number;
  xpReward: number;
  cooldownSec: number;
  requiredLevel: number;
  lessonOnly: boolean;
};

export type PlayerInventoryItem = {
  commandId: string;
  obtainedAt: number;
  source: 'lesson' | 'admin' | 'limited';
  trait: null | 'spring';
  traitMultiplier?: number;
};

export type LessonProgress = {
  commandId: string;
  completed: boolean;
  completedAt: number;
  trait: null | 'spring';
};


export type CasinoPlayRequest = {
  betNops: number;
  game: 'slots' | 'high-low';
  nonce: string;
};

export type CasinoRoundResult = {
  won: boolean;
  payoutNops: number;
  netNops: number;
  fluxAwarded: number;
  streak: number;
  badgeUnlocked?: string;
  oddsLabel: string;
};

export type CasinoBadge = {
  badgeId: string;
  name: string;
  streakRequired: number;
  unlockedAt: number;
  fluxAwarded: number;
};


export type StockCompany = {
  id: string;
  name: string;
  ticker: string;
  price: number;
  trend: 'up' | 'down' | 'flat' | 'volatile';
  availableShares: number;
};

export type StockHolding = {
  stockId: string;
  shares: number;
  avgBuyPrice: number;
  updatedAt: number;
};

export type PvpQueueTicket = {
  id: string;
  uid: string;
  displayName: string;
  status: 'queued' | 'ready' | 'in-match';
  queuedAt: number;
  score: number;
  shardRatio: number;
};
