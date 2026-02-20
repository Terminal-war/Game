# RootAccess

Phase 1 + Phase 2 foundation for a cyberpunk desktop-style web game.

## Implemented in this drop
- React + TypeScript + Vite project foundation.
- Firebase bootstrap module via environment variables.
- GitHub Pages-ready build config and CI workflow.
- Neon desktop shell UI with draggable/minimizable app windows.
- Taskbar launcher model inspired by desktop OS workflows.
- WebGL animated background layer using `gl.createShader()`.
- Initial SFX wiring via Howler using local `Sfx/Sounds` assets.
- Responsive behavior for tablet/mobile viewport constraints.

## Local development
```bash
npm install
npm run dev
```

## Build checks
```bash
npm run lint
npm run typecheck
npm run build
```

## Firebase env configuration
Create `.env.local` from `.env.example` and fill in project keys.

## Folder contracts
- `Build/`: build notes and process docs.
- `Core/`: TypeScript/React source and game shell code.
- `Gui/`: GUI docs + PNG assets.
- `Sfx/`: audio docs + WAV packs.
- `Server+client-side/`: firebase rules/runtime config and backend contracts.
