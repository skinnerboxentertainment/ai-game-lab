# Active Session

## Current Beat
Prove

## Current Objective
ADR-0003: upgrade the starter demo to actually demonstrate the serializable
`GameState` + `(state, action, seededRng) -> newState` pattern the docs
already claim. Three incremental slices, each independently gated.

## Active Packs
- state-authority: state/RNG/serialization is the entire point of this
  changeset

## Open Decisions
- (none blocking)

## Next Action
Slices 1-2 done and gated (green: test 26/26, typecheck, build, lint, verify
7/7). Slice 2 is core-layer only — `ParticleGalaxy`/`ecs/world.ts` untouched,
live demo unaffected. Next: Slice 3 — one `SPAWN_BURST` action +
`applyAction(state, action, rng) -> state`, wire a click handler in
`ParticleGalaxy` to dispatch it (this is where the scene actually starts
holding a `GameState` instead of driving bitECS straight from
`seedParticles`), and extend `scripts/verify.mjs` to dispatch a synthetic
click and confirm rendered output changed.

## Blockers
- None.
