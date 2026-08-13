# ADR-0003: Serializable GameState + action-transition pattern for the starter demo

**Date:** 2026-08-13
**Status:** Accepted

## Context
`AGENTS.md` and `docs/ARCHITECTURE.md` both claim the production-track
pattern is "one serializable `GameState`; all simulation through pure
`(state, action, seededRng) -> newState`." The starter's own demo
(`src/state/core.ts`, `src/scenes/ParticleGalaxy.ts`) doesn't demonstrate
that — `AGENTS.md` says so outright: "the starter's particle sim is a
*minimal* example... the full serializable `GameState` + action-transition
architecture is demonstrated in the spawned game projects (e.g. Asteroids)."

Concretely, three things are missing:
1. **No `GameState` object.** The sim is a bare `Particle[]`, not a
   serializable container.
2. **No actions.** `stepParticle` only ever does one thing — integrate
   physics forward by `dt`. There's no discrete event, and no input at all
   in `ParticleGalaxy` to trigger one (the sandbox track's LittleJS demo has
   click-to-spawn; the production demo has nothing).
3. **The RNG isn't actually serializable.** `mulberry32(seed)` in
   `src/state/rng.ts` returns a closure over a private `let a` — there's no
   way to inspect or persist "where the sequence currently is." Harmless
   today because nothing needs to resume mid-sequence, but it directly
   contradicts a `GameState` that claims to be serializable.

Since `scripts/new-game.mjs` copies `src/` verbatim into every spawned game,
this gap isn't just cosmetic — every future game starts from a template that
undersells the very pattern its own inherited `AGENTS.md` preaches.

## Decision
Three incremental slices, each independently gated (`npm run check` green
after each), each its own commit:

### Slice 1 — pure, serializable RNG
Rewrite `src/state/rng.ts`: stateful closure → plain numeric state +
`next(state: RngState) -> [value: number, nextState: RngState]`. Update the
one caller (`seedParticles` in `core.ts`) accordingly. No behavioral change
to the existing demo; this is a prerequisite, not a feature.

### Slice 2 — `GameState` + serialization, together
Wrap the particle array in a real `GameState`
(`{ version, seed, rngState, tick, particles }`); add `toJSON()`/`fromJSON()`.
Shipped together, not split, because "serializable `GameState`" is one
claim — a wrapper without a proven round-trip would be exactly the kind of
untested claim `docs/packs/qa-evidence-pack.md` calls a blocker. Test:
serialize mid-simulation, deserialize, keep stepping, assert bit-identical
to never having serialized at all.

### Slice 3 — one action, verification bundled in
Add a `SPAWN_BURST` action + `applyAction(state, action, rng) -> state`;
wire a click handler in `ParticleGalaxy` to dispatch it. This is the only
slice that exercises `(state, action, seededRng) -> newState` for real, and
it needs Slice 1's pure RNG to make sense (spawning needs randomness).
Extend `scripts/verify.mjs` to dispatch a synthetic click via CDP and assert
the particle/lit-pixel count changed — bundled into this slice rather than
deferred, since `AGENTS.md` already mandates extending verify for any new
feature.

No other scope: same visuals, same viewport, no new demo mechanics beyond
what's needed to prove the pattern (no score, no multiple action types, no
game-like flourishes).

## Rationale
- RNG-as-closure is the one piece that can't be deferred — everything else
  (serialization, actions that need randomness) depends on it being
  genuinely pure first, so it's Slice 1 and ships alone.
- `GameState` + serialization are bundled because an unproven serialization
  claim is worse than no claim — shipping the wrapper alone would leave the
  actual point (state survives a save/load round-trip) untested.
- Click-to-spawn mirrors what the sandbox track's LittleJS demo already
  does, keeping the two tracks in the same spirit, and it's the natural
  event that needs RNG (random velocity/hue per spawned particle) — an
  action that didn't need randomness wouldn't actually exercise the
  `seededRng` part of the contract.
- Bundling the `verify.mjs` extension into Slice 3 instead of deferring it
  doesn't add scope — it's already required by `AGENTS.md` for any new
  feature, so deferring it would just delay required work, not skip it.
- Smallest change per slice, per explicit direction, except where splitting
  further would leave a claim shipped without its proof.

## Consequences
- Enables: the lab's own demo finally proves what its docs claim; every
  game spawned after this lands starts from a starter that matches its own
  inherited `AGENTS.md`, not one `AGENTS.md` admits is a simplification.
- Constrains: touches `src/state/core.ts`, `src/state/rng.ts`,
  `src/ecs/world.ts`, `src/scenes/ParticleGalaxy.ts`,
  `tests/state.test.ts`, `tests/harness.test.ts`, and `scripts/verify.mjs`
  across three separate commits rather than one — more checkpoints, more
  gate runs, deliberately.
- The demo gains exactly one new interaction (click-to-spawn); nothing else
  about its look or feel changes.

## Rejected Alternatives
- **One large commit for all three slices:** rejected — explicit direction
  was smallest change, incrementally, with bundling only where splitting
  further would leave something shipped without proof.
- **Per-action derived sub-seeds instead of a genuinely serializable RNG**
  (e.g. hash of `seed + tick + actionIndex`, no persistent RNG state at
  all): sidesteps the problem rather than solving it. Rejected in favor of
  making the RNG state itself a real, serializable value, since that's what
  "serializable `GameState`" has to mean if the state-authority pack's own
  rule is taken at face value.
- **A more game-like demo** (score, multiple action types, win/lose state):
  rejected — the goal is proving the pattern, not building a second game
  inside the lab.
- **Defer the `scripts/verify.mjs` extension to a later pass:** rejected —
  it's already mandatory for new features per `AGENTS.md`; deferring is
  just delay, not a smaller total change.

## Validation
- Slice 1: existing determinism tests (`tests/state.test.ts`) pass
  unchanged; a new test proves the RNG's own state round-trips — resuming
  from a serialized mid-sequence state produces the same continuation as
  never having paused. **Met** (commit `2bb39eb`).
- Slice 2: a test serializes a `GameState` mid-simulation, deserializes it,
  continues stepping, and gets output bit-identical to uninterrupted
  simulation. **Met** (commit `393da62`).
- Slice 3: `applyAction` is pure (input state unchanged, matching this
  repo's existing purity-test convention); extended `npm run verify`
  dispatches a real click and confirms rendered output actually changed.
  **Met** (commit `cd95ad4`) — both locally and, per the note below, on a
  real GitHub Actions runner.
- `npm run check` green after each slice, not only at the end. **Met.**
- One implementation detail departs from the docs' literal phrasing:
  `applyAction(state, action)` takes 2 arguments, not the 3 implied by
  `(state, action, seededRng) -> newState`. `seededRng` isn't a separate
  parameter because it already lives inside `state.rngState` — that's what
  Slices 1-2 made possible, and a third argument would just restate
  something `state` already carries. Documented inline at the call site.

## Real CI confirmation + one review fix (2026-08-13)

Slices 1-2 were pushed and confirmed green in GitHub Actions individually.
Slice 3 (commit `cd95ad4`) was committed locally, then an independent
review (DeepSeek, given the full diff) confirmed everything held up but
flagged one real issue: `scripts/verify.mjs` hardcoded `20 == BURST_COUNT`
from `ParticleGalaxy.ts` with a "keep in sync" comment — a hidden
cross-file constant, exactly the kind of thing that quietly drifts. Fixed
in `33a0002`: `ParticleGalaxy` now exposes `burstCount` as a public
readonly field; `verify.mjs` reads it off `window.__demo.scene` at runtime
instead of duplicating the number.

Pushed. CI run `31713676952` on `33a0002` passed clean on `ubuntu-latest` —
confirmed by reading the actual step log, not just the run's conclusion:
`click dispatches SPAWN_BURST (exactly burstCount=20 more sprites) —
before=140 after=160`. The full chain (real CDP mouse event → Pixi's event
system → `applyAction` → new sprites) is proven on a real runner, not just
locally.

Status flips to **Accepted**: every validation criterion above is met with
real evidence, and the one review finding was fixed and re-verified rather
than left as a known issue.
