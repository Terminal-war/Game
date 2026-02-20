# Core source folder

`Core/` contains the React + TypeScript runtime for RootAccess.

## Phase 2 shell
- `App.tsx`: desktop shell state, taskbar, draggable/minimizable windows
- `components/CyberBackground.tsx`: WebGL background canvas mount
- `webgl/cyberGrid.ts`: shader setup and animation loop
- `audio.ts`: Howler SFX hooks

## Phase 3 auth
- `components/BootSequence.tsx`: animated 1/0 startup screen
- `components/LoginScreen.tsx`: sign in / registration terminal UI
- `services/auth.ts`: auth session and player profile bootstrap helpers

## Phase 4 command runtime
- `services/commandService.ts`: terminal command execution client + callable fallback
- `types/game.ts`: shared profile and command result contracts
