import { assetPath } from './runtime/assetPath';
import type { FeatureFlags } from './types/domain';

export type RootAppId =
  | 'terminal'
  | 'black-market'
  | 'blockchain'
  | 'casino'
  | 'profile'
  | 'pvp'
  | 'settings'
  | 'index'
  | 'chat'
  | 'admin';

export type RootAppDef = {
  id: RootAppId;
  title: string;
  icon: string;
  starterLayout: { x: number; y: number; w: number; h: number };
  lockedToAdmin?: boolean;
  requiresFlag?: keyof FeatureFlags;
};

export const ROOT_APPS: RootAppDef[] = [
  { id: 'terminal', title: 'Terminal', icon: assetPath('Gui/Images/Icon01.png'), starterLayout: { x: 60, y: 72, w: 560, h: 360 } },
  { id: 'black-market', title: 'Black Market', icon: assetPath('Gui/Images/Icon03.png'), starterLayout: { x: 140, y: 112, w: 460, h: 320 }, requiresFlag: 'marketEnabled' },
  { id: 'blockchain', title: 'Block Chain', icon: assetPath('Gui/Images/IconD10.png'), starterLayout: { x: 190, y: 90, w: 500, h: 340 }, requiresFlag: 'marketEnabled' },
  { id: 'casino', title: 'Casino', icon: assetPath('Gui/Images/IconD14.png'), starterLayout: { x: 240, y: 128, w: 470, h: 320 }, requiresFlag: 'casinoEnabled' },
  { id: 'profile', title: 'Profile', icon: assetPath('Gui/Images/Icon02.png'), starterLayout: { x: 100, y: 150, w: 430, h: 280 } },
  { id: 'pvp', title: 'PvP Battle', icon: assetPath('Gui/Images/IconD12.png'), starterLayout: { x: 220, y: 90, w: 520, h: 330 }, requiresFlag: 'pvpEnabled' },
  { id: 'settings', title: 'Settings', icon: assetPath('Gui/Images/IconD08.png'), starterLayout: { x: 280, y: 120, w: 420, h: 290 } },
  { id: 'index', title: 'Index', icon: assetPath('Gui/Images/IconD04.png'), starterLayout: { x: 160, y: 140, w: 440, h: 300 } },
  { id: 'chat', title: 'Chat', icon: assetPath('Gui/Images/IconD06.png'), starterLayout: { x: 300, y: 140, w: 440, h: 320 }, requiresFlag: 'chatEnabled' },
  { id: 'admin', title: 'Admin Engine', icon: assetPath('Gui/Images/IconD15.png'), starterLayout: { x: 120, y: 80, w: 620, h: 360 }, lockedToAdmin: true },
];

export function isAppAllowed(app: RootAppDef, isAdmin: boolean, featureFlags?: FeatureFlags | null) {
  if (app.lockedToAdmin && !isAdmin) return false;
  if (app.requiresFlag && featureFlags && !featureFlags[app.requiresFlag]) return false;
  return true;
}
