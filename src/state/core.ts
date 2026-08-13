/**
 * Pure deterministic state core.
 *
 * THE CONTRACT: all simulation math lives here as pure functions — no Pixi, no
 * bitECS, no side effects. Same seed + same inputs -> identical outputs. This is
 * what lets an agent (and a headless harness) provably verify work.
 *
 * Fixed timestep (TICK) means stepping is deterministic regardless of frame rate.
 */
import { createRng, nextRandom, nextRange } from "./rng.ts";
import type { RngState } from "./rng.ts";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hue: number;
}

export interface SimBounds {
  width: number;
  height: number;
}

export const TICK = 1 / 60;

/**
 * One serializable GameState: the entire simulation, as plain data. Nothing
 * outside this file reads/writes it directly or calls the RNG — every change
 * goes through a pure function that returns a new GameState.
 */
export interface GameState {
  /** Bumped on any incompatible shape change; not enforced yet (no prior
   * version exists to migrate from), but the field exists so a future save
   * format change has somewhere to record itself. */
  version: number;
  seed: number;
  rngState: RngState;
  tick: number;
  particles: Particle[];
}

export const GAME_STATE_VERSION = 1;

/** Spawn one particle, threading RNG state through. The shared primitive
 * behind both `seedParticles` and `createGameState`, so there's exactly one
 * place that defines "what a freshly spawned particle looks like." */
function spawnParticle(rng: RngState, bounds: SimBounds): [Particle, RngState] {
  let x: number, y: number, vx: number, vy: number, hue: number;
  [x, rng] = nextRange(rng, 0, bounds.width);
  [y, rng] = nextRange(rng, 0, bounds.height);
  [vx, rng] = nextRange(rng, -45, 45);
  [vy, rng] = nextRange(rng, -45, 45);
  [hue, rng] = nextRandom(rng);
  return [{ x, y, vx, vy, hue }, rng];
}

/** Create `count` particles deterministically from a seed. */
export function seedParticles(
  seed: number,
  count: number,
  bounds: SimBounds,
): Particle[] {
  let rng = createRng(seed);
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    let p: Particle;
    [p, rng] = spawnParticle(rng, bounds);
    out.push(p);
  }
  return out;
}

/** Create a fresh GameState: `count` particles seeded deterministically,
 * with the RNG state left exactly where spawning consumed it up to — so a
 * later action (e.g. spawning more particles) continues the same sequence
 * rather than restarting it. */
export function createGameState(
  seed: number,
  count: number,
  bounds: SimBounds,
): GameState {
  let rng = createRng(seed);
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    let p: Particle;
    [p, rng] = spawnParticle(rng, bounds);
    particles.push(p);
  }
  return { version: GAME_STATE_VERSION, seed, rngState: rng, tick: 0, particles };
}

/** Advance one particle by `dt` seconds, bouncing off the bounds. Pure. */
export function stepParticle(
  p: Particle,
  dt: number,
  bounds: SimBounds,
): Particle {
  let x = p.x + p.vx * dt;
  let y = p.y + p.vy * dt;
  let vx = p.vx;
  let vy = p.vy;
  if (x < 0) {
    x = 0;
    vx = Math.abs(vx);
  } else if (x > bounds.width) {
    x = bounds.width;
    vx = -Math.abs(vx);
  }
  if (y < 0) {
    y = 0;
    vy = Math.abs(vy);
  } else if (y > bounds.height) {
    y = bounds.height;
    vy = -Math.abs(vy);
  }
  return { x, y, vx, vy, hue: p.hue };
}

/** Advance the whole GameState by one fixed tick. Pure — `state` is never
 * mutated; a new GameState is returned. */
export function stepState(state: GameState, bounds: SimBounds): GameState {
  return {
    ...state,
    tick: state.tick + 1,
    particles: state.particles.map((p) => stepParticle(p, TICK, bounds)),
  };
}

/** GameState is already plain, JSON-safe data — `toJSON` exists to name the
 * save contract explicitly (per docs/packs/state-authority-pack.md) rather
 * than relying on every caller to know `JSON.stringify(state)` happens to
 * work today. Returns a fresh copy so the caller can't accidentally mutate
 * live simulation state through the "saved" value. */
export function toJSON(state: GameState): GameState {
  return {
    version: state.version,
    seed: state.seed,
    rngState: { a: state.rngState.a },
    tick: state.tick,
    particles: state.particles.map((p) => ({ ...p })),
  };
}

/** Reconstruct a GameState from a plain value produced by `toJSON` (after a
 * JSON.stringify/parse round-trip, or straight from `toJSON`'s return). */
export function fromJSON(data: GameState): GameState {
  return toJSON(data);
}

/** Spawn one burst particle at a fixed point with random outward velocity —
 * deliberately different generation logic from `spawnParticle` (random
 * position, ambient velocity), so SPAWN_BURST is a genuinely distinct
 * transition rather than a relabeled copy of the initial seeding. */
function spawnBurstParticle(rng: RngState, x: number, y: number): [Particle, RngState] {
  let vx: number, vy: number, hue: number;
  [vx, rng] = nextRange(rng, -120, 120);
  [vy, rng] = nextRange(rng, -120, 120);
  [hue, rng] = nextRandom(rng);
  return [{ x, y, vx, vy, hue }, rng];
}

export interface SpawnBurstAction {
  type: "SPAWN_BURST";
  x: number;
  y: number;
  count: number;
}

export type Action = SpawnBurstAction;

/**
 * Apply a discrete action to GameState. Pure, same contract as `stepState`:
 * `state` is never mutated, a new GameState is returned.
 *
 * Docs describe this as `(state, action, seededRng) -> newState`; `rng`
 * isn't a separate third parameter here because it already lives inside
 * `state` (`state.rngState`) — that's what Slice 1/2 made possible, and
 * passing it again separately would just restate something `state` already
 * carries. This is the only place besides `createGameState` that consumes
 * the RNG, and exactly why it had to become a serializable value: an action
 * dispatched after a save/load must continue the same sequence, not restart
 * it.
 */
export function applyAction(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SPAWN_BURST": {
      let rng = state.rngState;
      const spawned: Particle[] = [];
      for (let i = 0; i < action.count; i++) {
        let p: Particle;
        [p, rng] = spawnBurstParticle(rng, action.x, action.y);
        spawned.push(p);
      }
      return { ...state, rngState: rng, particles: [...state.particles, ...spawned] };
    }
  }
}

/** Simulate `ticks` fixed-timestep steps from a seed. Pure & headless. */
export function simulate(
  seed: number,
  count: number,
  ticks: number,
  bounds: SimBounds,
): Particle[] {
  let state = createGameState(seed, count, bounds);
  for (let i = 0; i < ticks; i++) {
    state = stepState(state, bounds);
  }
  return state.particles;
}
