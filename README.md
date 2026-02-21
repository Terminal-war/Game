# RootAccess

Phase 1-8 foundation for a cyberpunk desktop-style web game.

## Implemented in this drop
- React + TypeScript + Vite project foundation.
- Firebase bootstrap module via environment variables.
- GitHub Pages-ready build config and CI workflow.
- Neon desktop shell UI with draggable/minimizable app windows.
- WebGL animated background layer using `gl.createShader()`.
- SFX wiring via Howler using local `Sfx/Sounds` assets.
- Phase 3 auth flow: boot sequence, login/register, profile bootstrap, role-aware shell entry.
- Phase 4 terminal flow: secure callable command runtime scaffold + cooldown/economy pipeline.
- Phase 5 Black Market + Index: buy lessons and track owned/locked/missed commands.
- Phase 6 Casino: betting loop, streak badges, and Flux rewards.
- Phase 7 Blockchain: live ticker simulation, share buy/sell controls, and portfolio value tracking.
- Phase 8 PvP: queue, ready-check, active match shard race, result payout flow.
- Runtime hardening: error boundary + guest fallback to avoid white-screen crashes on misconfigured deployments.

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
