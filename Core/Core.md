# Core source folder

`Core/` contains the React + TypeScript runtime for RootAccess:
- `App.tsx`: boot/login/auth-aware desktop shell and window manager
- `appRegistry.ts`: typed app catalog and startup window layouts
- `components/CyberBackground.tsx`: WebGL background canvas mount
- `components/RootErrorBoundary.tsx`: runtime safety boundary to prevent white-screen crashes
- `webgl/cyberGrid.ts`: shader setup and animation loop
- `firebase.ts`: Firebase app + Auth + Firestore + Functions bootstrap
- `audio.ts`: Howler SFX hooks
- `services/auth.ts`: auth lifecycle helpers
- `services/profile.ts`: profile bootstrap + real-time profile listener
- `services/gameActions.ts`: callable backend action stubs
- `types/domain.ts`: shared domain model types

- `services/market.ts`: command catalog, lesson progress, and inventory subscriptions
- `services/casino.ts`: callable casino round actions
