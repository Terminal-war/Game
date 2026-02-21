# RootAccess Recovery + Production Plan (4 Phases)

This plan fixes the current GitHub Pages white-screen issue first, then rebuilds toward a production-ready cyberpunk web game architecture with Firebase security as the source of truth.

## Guiding Principles
- **Server-authoritative economy:** never trust client-side currency, command outcomes, cooldowns, traits, or admin status.
- **Playable at every phase:** each phase ends in a deployable, testable build.
- **Performance first:** target smooth UX on desktop/mobile with adaptive visual quality.
- **Incremental delivery:** we execute phases in order; you can request `Run phase 1 and 2` together.

---

## Phase 1 — Stabilization & White-Screen Elimination

### Goals
1. Fix startup failures causing blank page on GitHub Pages.
2. Guarantee app boot with graceful fallbacks if Firebase Analytics or optional modules fail.
3. Establish production-safe config loading and route/base-path handling for GitHub Pages.

### Workstreams
- **Runtime Boot Diagnostics**
  - Add startup guard rails and a visible error boundary/fallback UI.
  - Add structured logging for init steps: config load, Firebase init, auth listener, app mount.
- **Firebase Initialization Hardening**
  - Split core app init vs optional analytics init (analytics behind availability checks).
  - Validate env/config shape at runtime with explicit error messages.
  - Confirm Firestore/RTDB/Auth initialization order and async handling.
- **GitHub Pages Compatibility**
  - Fix asset base path/public path handling.
  - Ensure SPA refresh/deep-link strategy works (404 fallback routing).
- **Minimum UX Recovery**
  - Show loading screen + “safe mode” fallback instead of blank page.

### Deliverables
- App no longer white-screens; visible fallback if any subsystem fails.
- Startup telemetry/logging to quickly identify boot errors.
- Deploy checklist for GitHub Pages.

### Phase 1 Validation (5-step debug loop)
1. Syntax/type/lint checks.
2. Visual smoke test (boot/login renders on desktop + mobile viewport).
3. Next-step readiness check (config + init architecture supports feature work).
4. Production inspection (error boundaries, fallback states, no fatal crash paths).
5. If failed: patch, rerun from step 1.

---

## Phase 2 — Foundation Architecture (Core Systems + Security Backbone)

### Goals
1. Build scalable game architecture (apps-as-windows desktop shell).
2. Implement secure backend contract for commands/economy/admin flows.
3. Prepare live-update channels for PvP and market systems.

### Workstreams
- **Desktop Shell + App Window Framework**
  - Cyberpunk desktop UI, taskbar, draggable/minimize/maximize windows.
  - App registry + permissions (including admin-gated apps).
- **Identity & Player Bootstrap**
  - Firebase Auth login flow with profile bootstrap documents.
  - Role claims + `isAdmin` check mirrored in protected data model.
- **Domain Model & Services**
  - Strong TS types for player, command, cooldown, stock, casino badge, pvp match, admin action log.
  - Service layer split: auth, commands, economy, market, pvp, admin, social/chat.
- **Security Rules / Authoritative Actions**
  - Firestore rules enforcing:
    - command cooldown windows,
    - reward bounds,
    - admin-only writes/functions.
  - Move high-risk operations to server-side callable functions:
    - command execution resolution,
    - economy updates,
    - admin grants/bans/events.
- **Realtime Subscriptions**
  - Firestore/RTDB listeners for live stock movement, PvP state, alerts, and optional chat gate state.

### Deliverables
- Fully wired architecture skeleton for all planned apps.
- Security-first command/economy pipeline.
- Realtime data channels proven with test data.

### Phase 2 Validation (5-step debug loop)
1. Syntax/type/lint checks.
2. Visual checks for desktop shell/windowing behavior.
3. Next-step readiness (all core interfaces available for feature apps).
4. Production inspection (security rule simulation + unauthorized access tests).
5. If failed: patch, rerun from step 1.

---

## Phase 3 — Feature Vertical Slices (Gameplay Apps)

### Goals
Deliver gameplay-complete versions of the main apps with progression loops and live data.

### App Slices
- **Terminal App (Core Loop)**
  - `phish` starter command, cooldowns, success/fail outcomes, earnings range.
  - Multi-step advanced command prompts framework.
  - XP + level progression integration.
- **Black Market + Index**
  - Command lessons/unlocks, software requirements, owned vs locked command index.
  - Trait system (`Spring`, ultra-rare) + trait command variants (`-TS`).
- **Casino App**
  - Neon casino games, streak badges, Flux (`ƒ`) rewards, store hooks for luck charms.
- **Blockchain App**
  - 5-company market, trend display, buy/sell constraints, ownership + defense upgrade flows.
- **PvP App**
  - Queue, ready-check, live match state, shard scoring, payout/ranked points.
- **Profile + Settings**
  - Stats, leaderboard, updates feed, profile image, audio/visual settings and scaling.
- **Admin App (Guarded)**
  - Command/item management, bans (temp/perm), global alerts/events, logs, player flags.
  - Chat gate controls (open/close/poll moderation).

### Deliverables
- End-to-end playable core economy loop.
- All major apps functional at MVP gameplay depth.
- Admin controls operational with strict authorization.

### Phase 3 Validation (5-step debug loop)
1. Syntax/type/lint checks.
2. Visual QA across app windows/themes/states.
3. Next-step readiness (feature flags + migration-safe schemas).
4. Production inspection (anti-abuse checks, edge-case economy tests).
5. If failed: patch, rerun from step 1.

---

## Phase 4 — Polish, Optimization, Launch Readiness

### Goals
1. Convert MVP into production-grade release candidate.
2. Improve performance, reliability, anti-cheat controls, and content operations.

### Workstreams
- **Visual/SFX Polish**
  - Integrate cyber intro cutscene (binary rain) -> seamless login transition.
  - Finalize neon theming and app-specific vibes (terminal, casino, PvP, blockchain).
  - Use provided image/SFX assets consistently with fallback handling.
- **3D/WebGL Enhancement**
  - Add standout WebGL/Three.js element (e.g., blockchain orb/market hologram).
  - Adaptive quality tiers by device capability.
- **Performance Engineering**
  - Bundle optimization, code splitting, lazy app loading.
  - Frame-time and memory budgeting; throttled realtime updates.
- **Quality & Ops**
  - End-to-end regression suite, security tests, and load simulations.
  - Firebase Test Lab strategy for supported integration checks.
  - Release playbook: rollout, monitoring, incident response, hotfix workflow.

### Deliverables
- Production candidate build with measured performance targets.
- Launch checklist, runbooks, and admin operations SOPs.

### Phase 4 Validation (5-step debug loop)
1. Syntax/type/lint/build checks.
2. Visual + responsive + accessibility pass.
3. Next-step readiness (deployment rollback and observability verified).
4. Production inspection (security, perf, reliability sign-off).
5. If failed: patch, rerun from step 1.

---

## Complete System Coverage Map (Your Requested Features)
- Intro cutscene + login + desktop shell.
- Windowed apps with drag/min/max behavior.
- Terminal economy, command progression, cooldowns, complex command chains.
- Black market lessons/software unlocks + trait system.
- Blockchain market + company lore economy + defensive management.
- Casino, Flux currency, badges, and reward loops.
- Profile, leaderboard, rank/XP/level to 500.
- PvP queue/match/scoring/payout/ranked points.
- Settings app (audio/video/UI scaling/performance modes).
- Index inventory (owned/locked/missed/limited/admin items).
- Admin app with grants, bans, shop management, global messaging/events, logs, flags.
- Admin-controlled chat lifecycle + polling.
- Firestore security rules + server-authoritative writes.
- Realtime updates via Firestore/RTDB subscriptions.
- GitHub Pages deployment compatibility.

## Added Production-Critical Systems (Not to Skip)
- Anti-cheat event ledger and anomaly detection hooks.
- Idempotent economy transaction records.
- Versioned data schemas + migration scripts.
- Feature flags and kill switches for risky systems.
- Content scheduling (limited shop items, stock windows, events).
- Observability dashboard (errors, latency, economy anomalies).
- Backup/restore and incident response docs.

## Mapping to the 9-Step Pro Workflow
1. Plan & concept design -> this document.
2. Setup & prototyping -> phases 1–2 baseline.
3. Game development (production) -> phase 3.
4. Testing & debugging -> each phase 5-step loop.
5. Polishing & optimization -> phase 4.
6. Publishing -> phase 4 release workflow.
7. Game loop tuning -> phase 3/4 balancing.
8. Tools pipeline -> admin tooling + observability + scripts.
9. Learning curve/tutorials -> skippable onboarding lessons in terminal/market.

## Execution Recommendation
- **Run next:** Phase 1 + Phase 2 together.
- **Reason:** it fixes the current broken deployment first, then installs secure architecture so feature work does not require rewrites.
