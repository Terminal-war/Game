# Server + client contracts

## Phase 3 delivered
- Firebase Auth flow is integrated in client runtime.
- Player profile bootstrap + real-time profile subscriptions are active.
- Role and ban flags are consumed by the app shell for gated access.

## Phase 4 delivered
- Firestore rules upgraded with stricter profile validation, role enforcement, and command run bounds.
- Backend authority contract documented in `contracts/phase3-4-backend.md`.
- Callable function entrypoint contract (`executeCommand`) wired from client service layer.

## Phase 5 delivered
- Terminal command engine v1 supports command parsing, multi-step prompt flows, cooldown tracking, and secure callable execution fallback.
- Command catalog data is consumed live, with unlock checks against lesson/inventory state.

## Phase 6 delivered
- Black Market lesson completion writes to `players/{uid}/lessonProgress/{commandId}` with trait metadata.
- Index app merges inventory + lesson unlock state and exposes trait command notation (`-TS`).
- Rules now validate lesson progress payload shape and trait constraints.

## Next
- Implement Cloud Functions runtime for `executeCommand`, wallet/xp transactions, idempotency nonce checks, and lesson-to-inventory grants.

## Phase 7 delivered
- Casino app round flow is integrated in client runtime with callable backend path and bounded local fallback simulation.
- Realtime casino badge subscription is wired to profile UI for Flux progression visibility.
- Firestore rules enforce bounded casino rounds/badge payloads and immutable writes.

## Phase 8 delivered
- Blockchain stock panel is live with real-time market feed + portfolio reads.
- Firestore rules include player portfolio read protections and backend-owned write posture.

## Phase 9 delivered
- PvP queue panel is live with join/leave queue actions and realtime queue list.
- Firestore rules enforce queue ticket ownership and bounded queue payload schema.
