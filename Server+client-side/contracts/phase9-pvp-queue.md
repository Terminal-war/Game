# Phase 9 contracts: PvP queue + lobby

## Queue model
- `pvpQueue/{uid}` documents represent single active ticket per player.
- Fields: `uid`, `displayName`, `status`, `queuedAt`, `score`, `shardRatio`.

## UI behavior
- Player can join/leave queue.
- Lobby shows all queued operators in real-time.

## Security
- Ticket id must match authenticated uid.
- Create/update/delete are owner-only with schema validation.
- Match resolution and reward transfer remain callable/backend authority.
