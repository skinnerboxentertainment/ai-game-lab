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
Slice 1 done and gated (green: test 24/24, typecheck, build, lint, verify
7/7). Next: Slice 2 — wrap the particle array in a real `GameState`
(`{ version, seed, rngState, tick, particles }`), add `toJSON()`/
`fromJSON()`, and prove a mid-simulation serialize/deserialize round-trip
is bit-identical to uninterrupted simulation.

## Blockers
- None.
