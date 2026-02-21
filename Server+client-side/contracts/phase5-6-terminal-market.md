# Phase 5 + 6 contracts: Terminal + Black Market

## Terminal engine v1
- Input parser supports:
  - `help`
  - `phish`
  - advanced sequence `load-gitconfig pulse` with prompt confirmations.
- Cooldowns are tracked client-side for UX and must be revalidated server-side in callable functions.
- Primary execution path is callable function `executeCommand`.
- If callable fails in local/dev, a constrained simulation fallback is used for UX continuity only.

## Black market lessons
- Lessons come from `commandCatalog` and are rendered with level/cost metadata.
- Completing a lesson writes to `players/{uid}/lessonProgress/{commandId}` with:
  - `completed: true`
  - `completedAt: serverTimestamp`
  - `trait: null | "spring"`
- Trait roll chance in client is set to 0.001% (`Math.random() <= 0.00001`).
- Backend should re-roll/validate trait on server in production grant flow.

## Index composition
- Unlocked commands = (`inventory` union completed `lessonProgress` union starter `phish`).
- Trait notation:
  - commands with Spring are shown as `command-TS`.

## Rules intent
- `lessonProgress` writes are owner-only and schema constrained.
- `inventory` remains backend-owned.
- Economy fields remain backend-owned.
