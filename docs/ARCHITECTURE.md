# ARCHITECTURE — template + starter record

A ≤1-page constitution. Fix it early; re-litigating costs more than deciding.

## Core loop

(Describe the game's core loop in one line.)

## State ownership

- **One serializable `GameState`** — `{ version, seed, rngState, player{…},
  run{…}, season{…} }`.
- All simulation through pure `(state, action, seededRng) -> newState` in
  `src/state/core.ts`. No module reads/writes state or calls the RNG outside the
  core.
- Fixed timestep (`TICK = 1/60`) — determinism independent of frame rate.
- Seeds: never reused across scopes.

## Authority boundaries

- Decide BEFORE building UI: who owns currency/progression/competitive state?
- Server-authoritative for anything irreversible. Treat every client write as
  hostile.

## Canonical logic & history

- One shared pure-logic package for client/server/replays/tests. Mirroring logic
  is debt ("not a real single source of truth").
- History = immutable snapshots; never references to live rows.

## Layering (this repo)

`src/state/` (pure core) → `src/ecs/` (entities drive the core) →
`src/scenes/` (render state) → `src/core/` (app + viewport). Sim logic never
lives in render code. Render layer order (fixed): background → effects → scene →
ui.

**Dependency rule:** dependencies point inward — core never imports scenes/UI;
UI consumes read-only projections/events, never mutates gameplay. Boundary
reversal is an escalation trigger, not a refactor. State and rendering are
separate planes: gameplay owns plain state, visuals sync from it, and the scene
graph can be destroyed and rebuilt without losing simulation.

**Detailed rules:** see the knowledge packs — `docs/packs/state-authority-pack.md`
(state/authority/lifecycle), `docs/packs/pixijs-lab-pack.md` (render/input/
assets/audio), `docs/packs/qa-evidence-pack.md` (verification + evidence gates).

## Naming & file rules

- One system/object per file; split files past ~500 lines.
- Keep code in the file that owns the behavior.

## Reset behaviour

- What survives a run reset? (persistent identity, cosmetics, legacy — separate
  from run-scoped state)
