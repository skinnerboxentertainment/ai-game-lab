# Active Session

## Current Beat
Prove

## Current Objective
ADR-0002 built: self-contained `scripts/verify.mjs`, CI workflow (lab +
spawned games), `engines.node`, updated docs.

## Active Packs
- qa-evidence: verification gate is the whole point of this changeset

## Open Decisions
- ADR-0002 status stays "Proposed", not "Accepted" — the self-contained
  harness is proven locally (two clean back-to-back `npm run verify` runs,
  no manual setup), but the GitHub Actions execution itself is still
  unverified: nothing has been pushed, so the workflow has never actually
  run. Flip to "Accepted" once it goes green on GitHub.

## Next Action
Checkpoint this changeset (git add/commit — awaiting explicit go-ahead), then
push so CI actually runs once for real. After that, flip ADR-0002 to
Accepted and update `docs/handoff.md`.

## Blockers
- None.
