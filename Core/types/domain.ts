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
};
