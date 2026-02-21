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

## Master build plan
See `Build/MASTER_PLAN.md` for the phased implementation roadmap and per-phase debug gates.

## Phase status
- ✅ Phase 1 delivered: foundation/tooling contracts, environment template, typed app registry.
- ✅ Phase 2 delivered: cutscene -> login transition, neon desktop shell, draggable/min/max windows, taskbar app launcher.
- ✅ Phase 3 delivered: Firebase auth wiring, real-time profile bootstrap, role/ban-aware desktop gating.
- ✅ Phase 4 delivered: stricter Firestore rules, backend authority contracts, callable action service scaffolding.
- ✅ Phase 5 delivered: terminal command engine v1 with parser, prompt flows, cooldowns, and secure callable fallback.
- ✅ Phase 6 delivered: black market lessons, rare trait unlock flow, realtime lesson/inventory subscriptions, and index unlock views.
- ✅ Phase 7 delivered: casino rounds with Flux/badge scaffolding, callable game action path, and rule-bounded casino records.
- ✅ Phase 8 delivered: blockchain market live panel with company trends and portfolio wiring.
- ✅ Phase 9 delivered: PvP queue panel with live operator queue and ready-state scaffolding.
- ✅ Phase 10 delivered: admin engine panel with liveOps broadcast and action audit stream wiring.
- ✅ Phase 11 delivered: visual polish pass with quality tiers and blockchain WebGL showcase scene.


## Phase 1 + 2 hardening updates
- Boot diagnostics pipeline added (`Core/runtime/diagnostics.ts`) and surfaced in the runtime error boundary.
- Firebase init is now validated and analytics is optional/non-fatal.
- Asset paths are now base-aware for GitHub Pages subfolder deployments.
- App registry now respects profile feature flags (market/casino/pvp) plus admin lock.
- Added SPA `404.html` redirect recovery for GitHub Pages deep links.
- Vite build now supports `VITE_BASE_PATH` and splits Firebase into a dedicated chunk.


## Phase 3 + 4 execution updates
- Added realtime Operator Chat app with admin-controlled open/close gate and poll question publishing.
- Added live Ops banner on desktop for active announcements.
- Added skippable terminal onboarding command flow (`tutorial` / `skip tutorial`).
- Upgraded cyberpunk UI polish (window chrome, neon depth, taskbar styling, improved desktop/login visual hierarchy).
- Expanded Firestore rules to support secured chat messaging and admin-only chat gate controls.

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
