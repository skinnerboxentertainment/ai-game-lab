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
All three slices done and gated locally (green: test 28/28, typecheck,
build, lint, verify 8/8 — including a real CDP-dispatched click proving
SPAWN_BURST end-to-end: `before=140 after=160`, exact `BURST_COUNT` match,
confirmed non-flaky across two runs). Not yet pushed — push + confirm CI,
then this ADR-0003 objective is closed.

## Blockers
- None.
