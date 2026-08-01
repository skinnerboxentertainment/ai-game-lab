# SPEC — Asteroids (first test game)

> **Build:** A playable, deterministic Asteroids in the production-track app.
> **Architecture:** fit it into the pure-core + bitECS + PixiJS scene stack,
> respecting the fixed-timestep, seeded-RNG determinism contract. Never touch
> files outside the ownership list.
> **Feel:** the player should feel *lonely and small against an indifferent
> void* — the slow drift of a ship with no brakes, the quiet tension of clearing
> a wave, and the momentary relief of a post-respawn grace period. Space is
> calm, then suddenly loud.
> **Verify:** acceptance tests + `npm run test && npm run typecheck && npm run
> build` and the headless smoke scene must pass.

## 1. Scope (one concrete thing)

A single-screen Asteroids: a triangle ship that thrusts, turns, and fires
bullets; rocks that drift and split into smaller rocks; wrap-around edges;
wave progression; lives; score; game over. Deterministic from `?seed=` — every
frame's sim math is a pure function of the seed and the inputs.

## 2. Architecture fit

### Layers (unchanged contract)

- `src/state/asteroids.ts` (NEW) — **pure deterministic core** for the game.
  All sim math (physics, collisions, rock splits, wave spawns, scoring) lives
  here as pure functions `(state, action, seededRng) -> newState`. No Pixi/bitECS
  imports. Serializable `GameState`. Unit-tested in Node.
- `src/ecs/asteroidsWorld.ts` (NEW) — bitECS entity/component layer that holds
  ship, bullet, and rock entities and drives the pure core each tick. No sim
  math.
- `src/scenes/Asteroids.ts` (NEW) — PixiJS scene: fixed-timestep accumulator,
  keyboard input -> actions for the core, sprite/polygon rendering from ECS
  component data, HUD text. No state mutation.
- `src/main.ts` — select scene by `?scene=`; default `asteroids`, keep
  `galaxy` reachable for the smoke path.
- `scripts/verify.mjs` — keep boot/geometry checks; add a scene-agnostic
  "renders lit pixels" check that passes for either scene.

### Ownership list (never touch outside)

`src/state/asteroids.ts`, `src/state/rng.ts` (reuse only), `src/ecs/asteroidsWorld.ts`,
`src/scenes/Asteroids.ts`, `src/main.ts`, `scripts/verify.mjs`, `tests/asteroids.test.ts`,
`tests/state.test.ts` (extend only if core particles are touched — they are not).

### Design decisions

1. **One serializable `GameState`** (ship, bullets[], rocks[], score, lives,
   wave, phase, rngState). The RNG state is *inside* the game state so a full
   run replays deterministically. Nothing outside `src/state/` reads/writes it.
2. **Actions from input:** `THRUST`, `TURN_LEFT`, `TURN_RIGHT`, `FIRE` —
   collected per frame, folded into `step(state, action, dt)` in the core.
3. **Rocks split deterministically:** a big rock becomes 2 medium, a medium
   becomes 2 small, small dies. Split velocities come from the seeded RNG, so a
   seed fully determines the game.
4. **Collisions:** circle vs circle (ship/rock, bullet/rock). A hit kills the
   rock (with split); a ship hit costs a life, clears bullets, and respawns the
   ship with a short grace period at center.
5. **Wrap-around:** entities wrap across edges with a margin so they fully exit
   before reappearing.
6. **Scene wiring:** `ParticleGalaxy` stays intact as the `?scene=galaxy`
   smoke fallback. HUD is a Pixi `Text` (score, lives, wave) in the `uiLayer`.

## 3. Feel

- Ship has **momentum, no brakes** — drift is part of the personality. Max speed
  caps it so it never becomes unmanageable.
- Rocks are **neutral, then threatening**: they drift slowly at first; a wave
  that starts as 4 rocks can become 10+ as they split.
- Post-death respawn grants a brief **blink-invulnerability** — a moment to
  breathe before the void closes back in.
- Clearing a wave is a quiet exhale: a short pause, then the next wave slides in.

## 4. Numbers

| Parameter | Value |
| --- | --- |
| Logical display | 1280 × 720 |
| TICK | 1/60 s fixed timestep |
| Ship turn rate | 3.0 rad/s |
| Ship thrust | 320 px/s² |
| Ship max speed | 340 px/s |
| Ship drag | none (momentum; capped at max speed) |
| Fire cooldown | 0.28 s |
| Bullet speed | 460 px/s |
| Bullet lifetime | 1.1 s |
| Rock speed (spawn) | 60–140 px/s, random direction |
| Big rock radius | 42 px (splits into 2 × medium) |
| Medium rock radius | 24 px (splits into 2 × small) |
| Small rock radius | 13 px (dies) |
| Start rocks (wave 1) | 4 |
| Wave growth | +1 rock per cleared wave (cap 11) |
| Score | big 20, medium 50, small 100 |
| Lives | 3 |
| Respawn grace | 2.5 s invulnerable, ship blinks |
| Wrap margin | 60 px past each edge |

## 5. Anti-goals (explicitly NOT doing)

- No saucers/UFOs, power-ups, hyperspace, shields, or autofire.
- No physics beyond circles and straight lines (no rock rotation, no recoil,
  no ship-screen split for multiplayer).
- No audio, no screenshake, no particles-on-hit (that is a later polish pass;
  the smoke harness asserts pixels, not juice).
- No score persistence / high-score table (session-local only).
- No pausing, no gamepad, no mobile touch.
- Do **not** refactor `ParticleGalaxy`, `src/ecs/world.ts`, or the particle
  core — they are the regression baseline.

## 6. Verify (Definition of Done)

Evidence type: **Logic** → unit tests required (blocking).

Acceptance tests in `tests/asteroids.test.ts` (pure core, Node, seeded):
- Same seed + same action sequence -> identical state (determinism).
- Thrust increases speed toward max; turn rotates; idle coasts (no drag).
- Wrap: crossing an edge reappears on the far side.
- Bullet despawns after its lifetime; bullets move at constant speed.
- Bullet/rock collision removes the rock, adds score, spawns correct split
  children (count + sizes), deterministically.
- Rock/rock and rock/ship collision: ship hit costs a life, clears bullets,
  respawns with grace; 0 lives -> game over.
- Wave clear -> next wave spawns with one more rock (capped at 11).

Gate:
- `npm run test` — all determinism + asteroids tests pass.
- `npm run typecheck` — zero errors.
- `npm run build` — succeeds.
- `npm run verify` — headless smoke passes with `?scene=asteroids` default and
  `?scene=galaxy` still green.

### Playtest note (integration evidence)

I'll drive a short seeded playthrough in the running app (keyboard actions fed
to the core) and record the transcript in `production/events.md` at Prove.

## 7. Out of scope for this story (future ADRs)

- Audio, juice, particles-on-hit.
- Score persistence (server-authoritative economy).
- Gamepad/mobile input.
- More enemies / weapon variety.
