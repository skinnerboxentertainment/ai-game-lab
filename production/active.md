# Active Session

## Current Beat
Frame

## Current Objective
First real game from spec: Asteroids. docs/SPEC-asteroids-demo.md written (goal, architecture
fit, numbers, anti-goals, acceptance tests). Awaiting orchestrator approval of
the changeset before Commit → Build → Prove.

## Active Packs
- qa-evidence: loaded at Frame to decide how the story gets tested before building
- state-authority: (load at Commit/Build) state/render separation + determinism
- pixijs-lab: (load at Commit/Build) PixiJS v8 API discipline

## Open Decisions
- ECS depth for game #1: follow established 3-layer (pure core + ECS + scene)
  vs. pure-core-only render. Spec recommends the 3-layer pattern. Owner: lead.

## Next Action
Orchestrator reviews docs/SPEC.md; approve or adjust, then Commit (decision
record) and start Build.

## Blockers
- None.
