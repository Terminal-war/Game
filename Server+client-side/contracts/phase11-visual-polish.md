# Phase 11 contracts: visual polish + quality tiers

## Rendering
- Background WebGL respects quality tiers (`low`, `medium`, `high`) for DPR/intensity.
- Blockchain app includes additional shader scene (`BlockchainOrb`) for flagship visual identity.

## UX
- Settings panel exposes graphics quality selector.
- Quality updates propagate to WebGL components without full app reload.

## Stability
- Shader compile/link checks guard against runtime crashes.
- Root error boundary prevents blank-screen failures from uncaught UI exceptions.
