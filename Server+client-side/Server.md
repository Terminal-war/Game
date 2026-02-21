# Server + client contracts

## Phase 3 delivered
- Firebase Auth flow is integrated in client runtime.
- Player profile bootstrap + real-time profile subscriptions are active.
- Role and ban flags are consumed by the app shell for gated access.

## Phase 4 delivered
- Firestore rules upgraded with stricter profile validation, role enforcement, and command run bounds.
- Backend authority contract documented in `contracts/phase3-4-backend.md`.
- Callable function entrypoint contract (`executeCommand`) wired from client service layer.

## Next
- Implement Cloud Functions runtime for command execution/admin actions with transactions and nonce protection.
