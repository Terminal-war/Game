# Phase 7 contracts: Casino + Flux economy

## Game loop
- Player enters bet (`betNops`) and runs a casino round.
- Preferred path: callable backend `playCasinoRound` computes result and returns net payout + flux reward.
- Client fallback mode is UX-only for local development and must not be trusted for production balance.

## Data surfaces
- `players/{uid}/casinoRounds/{roundId}`
  - immutable round records with bounded `betNops`, `netNops`, and `fluxAwarded`.
- `players/{uid}/casinoBadges/{badgeId}`
  - immutable badge unlocks with streak requirements and flux grants.

## Balancing controls
- Flux is a secondary reward to avoid inflation of Ø economy.
- Badge unlocks should be server-evaluated from authoritative streak counters.
- Round write bounds are enforced in rules but final anti-cheat logic belongs in Cloud Functions.

## Security posture
- Never accept client-reported odds as source of truth.
- Validate nonce/idempotency server-side for each casino round request.
- Emit admin/audit events for unusual bet spikes or win streak anomalies.
