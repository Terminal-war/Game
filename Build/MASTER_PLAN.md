# RootAccess Production Plan (Phased)

This plan is the source of truth for implementing the full game in controlled, testable increments.

## Delivery model
- Work in **2 phases at a time**.
- Every phase must end with the same **5-step debug gate**:
  1. Syntax/type/lint validation.
  2. Visual bug review (responsive + interactions).
  3. Forward-compatibility check for the next phase.
  4. Production-readiness inspection (security, performance, maintainability).
  5. If any check fails: fix, re-test, and repeat from step 1.

## Architecture principles (applies to all phases)
- **Server-authoritative economy**: clients request actions, server validates + commits outcomes.
- **Never trust client input**: validate cooldowns, command ownership, reward ranges, admin claims in Firebase rules and Cloud Functions.
- **Real-time by design**: Firestore listeners / RTDB subscriptions for PvP, events, stock updates, queue state.
- **Scalable app shell**: desktop-like draggable windows with viewport-safe constraints and touch/mouse support.
- **Observable systems**: audit logs, anti-abuse metrics, analytics funnels, and error reporting.
- **Mobile-first resilience**: adaptive layouts, capped effects, and QoS settings for low-end devices.

## Phase roadmap

### Phase 1 — Foundation + Toolchain Hardening
- Confirm React + TS + Vite baseline and strict TypeScript settings.
- Configure Firebase environments (dev/stage/prod) with `.env` contracts.
- Add CI checks (lint, typecheck, build) and branch quality gates.
- Define folder/module boundaries for Core, UI apps, services, and shared schemas.
- Add baseline coding standards and naming conventions.

### Phase 2 — Cyber Desktop Shell + Intro Experience
- Build cyberpunk desktop shell, taskbar, window manager (drag/minimize/maximize/focus layering).
- Add boot cutscene with neon binary rain and seamless transition into login screen.
- Create app launch framework (terminal, market, blockchain, casino, profile, PvP, settings, index, admin placeholders).
- Implement responsive scaling strategy for desktop/tablet/mobile.
- Integrate initial SFX event bus with Howler (UI hover/click/open/close).

### Phase 3 — Auth, Profiles, and Access Control
- Implement Firebase Authentication flows (sign-up/sign-in/session restore/sign-out).
- Create player profile bootstrap on first login.
- Add role/claim model (`isAdmin`, moderation flags, ban state, feature flags).
- Build guarded routes/app visibility for admin-only and feature-locked modules.
- Add profile image upload pipeline with validation + storage rules.

### Phase 4 — Data Model + Backend Authority Layer
- Finalize Firestore/RTDB schema docs for players, commands, inventory, economy, stocks, PvP, admin logs, events.
- Implement Cloud Functions callable/HTTP endpoints for sensitive game actions.
- Enforce economy invariants server-side (reward range, cooldown windows, trait logic).
- Add idempotency keys and replay protection for purchase/command actions.
- Implement Firestore Security Rules that reject invalid writes from clients.

### Phase 5 — Terminal Core Loop (Command Engine v1)
- Build terminal app UX: command input, prompt tree, command history, inline feedback.
- Implement starter command (`phish`) with cooldown and server-authoritative result roll.
- Add XP, level progression hooks (toward 500-level system).
- Create command parser to support multi-step advanced command flows.
- Add fail/punish outcomes and anti-spam throttles.

### Phase 6 — Black Market + Command Learning + Index
- Build command shop with pricing, availability windows, and limited flags.
- Implement lesson flow to unlock command ownership after completion.
- Add rare trait roll system (`Spring`, 0.001%) and trait command notation (`-TS`).
- Build Index app sections: owned, trait-owned, locked, missed limiteds.
- Ensure removed shop items remain usable for prior owners.

### Phase 7 — Casino + Flux Economy
- Implement casino minigame framework with provable server-side outcomes.
- Add streak achievements/badges and Flux (`ƒ`) reward logic.
- Build casino store for luck modifiers with strict balancing constraints.
- Add anti-abuse protections (rate limiting, anomaly detection, expected value checks).
- Add bright neon “oasis” theme and audio-reactive UI accents.

### Phase 8 — Blockchain Market + Company Systems
- Build stock app for VALK, GLYPH, ZERO, PULSE, TITAN with lore/UI cards.
- Implement market cycle timings, trend simulation, and availability windows.
- Add share purchase caps and portfolio valuation tracking.
- Unlock block management apps after ownership and add defense upgrade workflows.
- Implement attack/defense simulation hooks for advanced command interactions.

### Phase 9 — PvP Matchmaking + Battle Resolution
- Build queue/lobby, ready-check handshake, cancellation/timeouts.
- Create split-screen battle view with live progress updates.
- Implement shard scoring and win condition logic.
- Add ranked points/MMR-like progression and reward transfer settlement.
- Add disconnect handling, reconnection windows, and fairness guardrails.

### Phase 10 — Admin Engine + Moderation + Live Ops
- Build admin console app with role-guarded controls.
- Implement tools: grant commands/traits, bans (temp/perm), shop management, global events/messages.
- Add live chat controls (open/close/polls), player flagging, and moderation history.
- Add audit logging for every admin action with immutable timestamps.
- Add operational safety: dry-run mode, confirmation dialogs, rollback paths.

### Phase 11 — 3D/WebGL Showcase + Polish
- Integrate advanced WebGL/Three.js scene in one flagship app (recommended: blockchain market hub).
- Add performance tiers (high/medium/low) and dynamic quality scaling.
- Finish thematic pass (neon cyber UI cohesion, transitions, microinteractions).
- Finalize accessibility pass (contrast, reduced motion, keyboard navigation basics).
- Run asset optimization (texture compression, audio preload strategy, code splitting).

### Phase 12 — Release, QA, and Operations
- Full regression across auth, economy, PvP, market, admin, chat, settings.
- Security review: rules fuzzing, function authorization checks, exploit simulation.
- Deploy to GitHub Pages with staged rollout checklist.
- Configure monitoring dashboards, alerts, and incident runbooks.
- Prepare post-launch roadmap (content drops, balancing cadence, seasonal events).

## Always-on functional systems (cross-phase)
- Anti-cheat heuristics and anomaly logging.
- Crash/error reporting and replayable bug reports.
- Save migrations for schema changes.
- Feature flags for safe rollout/rollback.
- Tutorial/onboarding that is useful but skippable.
- Deterministic simulation utilities for test environments.

## Test strategy to run every phase
- Static checks: lint, typecheck, schema validation.
- Unit tests: economy math, cooldown checks, reward bounds, trait probabilities.
- Integration tests: auth + command execution + persistence + listeners.
- Visual checks: responsive snapshots, window drag/min/max behavior, theme regressions.
- Performance checks: FPS, memory, bundle size, listener counts.
- Security checks: forbidden write attempts and admin privilege escalation tests.

## Notes for Firebase Test Lab compatibility
- Keep core gameplay logic deterministic and decoupled from UI rendering.
- Expose test hooks/mocks for command results, timers, and network conditions.
- Provide scripted flows for auth, terminal loops, purchases, and PvP queue actions.
- Ensure debug logging can be toggled by environment without leaking secrets.
