# Phase 10 contracts: Admin engine + live ops

## Admin surfaces
- `adminActions/{id}`: immutable admin action audit feed.
- `liveOps/{id}`: global announcement/event feed.

## Client behavior
- Admin panel is visible only for users with `isAdmin: true` profile flag and server claim.
- Actions are mirrored in audit stream for moderation and rollback analysis.

## Security
- Firestore rules enforce admin-only write on both `adminActions` and `liveOps`.
- Do not trust client role flags; backend custom claims remain source of truth.
