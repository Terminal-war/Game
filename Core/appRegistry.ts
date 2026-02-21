import type { FeatureFlags } from './types/domain';

import icon01 from '../Gui/Images/Icon01.png';
import icon02 from '../Gui/Images/Icon02.png';
import icon03 from '../Gui/Images/Icon03.png';
import iconD04 from '../Gui/Images/IconD04.png';
import iconD06 from '../Gui/Images/IconD06.png';
import iconD08 from '../Gui/Images/IconD08.png';
import iconD10 from '../Gui/Images/IconD10.png';
import iconD12 from '../Gui/Images/IconD12.png';
import iconD14 from '../Gui/Images/IconD14.png';
import iconD15 from '../Gui/Images/IconD15.png';

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
  { id: 'terminal', title: 'Terminal', icon: icon01, starterLayout: { x: 60, y: 72, w: 560, h: 360 } },
  { id: 'black-market', title: 'Black Market', icon: icon03, starterLayout: { x: 140, y: 112, w: 460, h: 320 }, requiresFlag: 'marketEnabled' },
  { id: 'blockchain', title: 'Block Chain', icon: iconD10, starterLayout: { x: 190, y: 90, w: 500, h: 340 }, requiresFlag: 'marketEnabled' },
  { id: 'casino', title: 'Casino', icon: iconD14, starterLayout: { x: 240, y: 128, w: 470, h: 320 }, requiresFlag: 'casinoEnabled' },
  { id: 'profile', title: 'Profile', icon: icon02, starterLayout: { x: 100, y: 150, w: 430, h: 280 } },
  { id: 'pvp', title: 'PvP Battle', icon: iconD12, starterLayout: { x: 220, y: 90, w: 520, h: 330 }, requiresFlag: 'pvpEnabled' },
  { id: 'settings', title: 'Settings', icon: iconD08, starterLayout: { x: 280, y: 120, w: 420, h: 290 } },
  { id: 'index', title: 'Index', icon: iconD04, starterLayout: { x: 160, y: 140, w: 440, h: 300 } },
  { id: 'chat', title: 'Chat', icon: iconD06, starterLayout: { x: 300, y: 140, w: 440, h: 320 }, requiresFlag: 'chatEnabled' },
  { id: 'admin', title: 'Admin Engine', icon: iconD15, starterLayout: { x: 120, y: 80, w: 620, h: 360 }, lockedToAdmin: true },
];

export function isAppAllowed(app: RootAppDef, isAdmin: boolean, featureFlags?: FeatureFlags | null) {
  if (app.lockedToAdmin && !isAdmin) return false;
  if (app.requiresFlag && featureFlags && !featureFlags[app.requiresFlag]) return false;
  return true;
}
