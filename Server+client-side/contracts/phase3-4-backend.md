# Phase 3 + 4 backend authority contracts

## Auth and profile lifecycle
1. User authenticates with Firebase Auth (email/password for now).
2. Client calls `ensurePlayerProfile` once after auth state is available.
3. Client subscribes to `players/{uid}` via snapshot for live role + state updates.
4. If `isBanned == true`, gameplay windows are blocked.

## Role model
- Source of truth for elevated access is **custom auth claim** `isAdmin: true`.
- Mirror flag in profile (`players/{uid}.isAdmin`) is read-only for clients.
- Admin windows and writes are always guarded client-side + rules-side.

## Firestore document contracts
### players/{uid}
- Public client-editable fields: `displayName`, `photoURL`, `updatedAt`.
- Economy and authority fields are server-owned: `nops`, `flux`, `xp`, `rankPoints`, `isAdmin`, `isBanned`.

### players/{uid}/commandRuns/{runId}
- Client may submit only bounded payload for starter command (`phish`).
- Rules enforce reward bounds (1..5) and coarse cooldown gate via `commandState/phish.nextAllowedAt`.

### players/{uid}/commandState/{commandId}
- Server-owned command cooldown state.
- Updated by Cloud Functions/Admin SDK only.

### commandCatalog/{commandId}
- Read for all signed users.
- Write admin-only.

### adminActions/{actionId}
- Immutable operational audit stream (admin-only write/read).

## Callable function contracts (phase 4)
- `executeCommand({ commandId, nonce })`
  - Validates ownership, cooldown, reward range, and anti-replay nonce.
  - Writes command result + updates wallet atomically.
- `adminGrantCommand({ targetUid, commandId, trait })`
  - Requires admin claim.
  - Appends to inventory and logs action.
- `adminModerateUser({ targetUid, action, durationMs? })`
  - Requires admin claim.
  - Supports flag / temp-ban / perm-ban.

## Security hardening checklist
- Never trust frontend reward values.
- Use server timestamps for combatting forged timing.
- Keep anti-replay nonce window in backend store.
- Log all admin actions with actor uid + time + payload hash.
- Add emulator tests for rules before shipping.
