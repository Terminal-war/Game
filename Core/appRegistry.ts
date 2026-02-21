export type RootAppId =
  | 'terminal'
  | 'black-market'
  | 'blockchain'
  | 'casino'
  | 'profile'
  | 'pvp'
  | 'settings'
  | 'index'
  | 'admin';

export type RootAppDef = {
  id: RootAppId;
  title: string;
  icon: string;
  starterLayout: { x: number; y: number; w: number; h: number };
  lockedToAdmin?: boolean;
};

export const ROOT_APPS: RootAppDef[] = [
  { id: 'terminal', title: 'Terminal', icon: 'Gui/Images/Icon01.png', starterLayout: { x: 60, y: 72, w: 560, h: 360 } },
  { id: 'black-market', title: 'Black Market', icon: 'Gui/Images/Icon03.png', starterLayout: { x: 140, y: 112, w: 460, h: 320 } },
  { id: 'blockchain', title: 'Block Chain', icon: 'Gui/Images/IconD10.png', starterLayout: { x: 190, y: 90, w: 500, h: 340 } },
  { id: 'casino', title: 'Casino', icon: 'Gui/Images/IconD14.png', starterLayout: { x: 240, y: 128, w: 470, h: 320 } },
  { id: 'profile', title: 'Profile', icon: 'Gui/Images/Icon02.png', starterLayout: { x: 100, y: 150, w: 430, h: 280 } },
  { id: 'pvp', title: 'PvP Battle', icon: 'Gui/Images/IconD12.png', starterLayout: { x: 220, y: 90, w: 520, h: 330 } },
  { id: 'settings', title: 'Settings', icon: 'Gui/Images/IconD08.png', starterLayout: { x: 280, y: 120, w: 420, h: 290 } },
  { id: 'index', title: 'Index', icon: 'Gui/Images/IconD04.png', starterLayout: { x: 160, y: 140, w: 440, h: 300 } },
  { id: 'admin', title: 'Admin Engine', icon: 'Gui/Images/IconD15.png', starterLayout: { x: 120, y: 80, w: 620, h: 360 }, lockedToAdmin: true },
];
