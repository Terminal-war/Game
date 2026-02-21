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
