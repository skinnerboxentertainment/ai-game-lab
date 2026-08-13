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

/** Create `count` particles deterministically from a seed. */
export function seedParticles(
  seed: number,
  count: number,
  bounds: SimBounds,
): Particle[] {
  let rng = createRng(seed);
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    let x: number, y: number, vx: number, vy: number, hue: number;
    [x, rng] = nextRange(rng, 0, bounds.width);
    [y, rng] = nextRange(rng, 0, bounds.height);
    [vx, rng] = nextRange(rng, -45, 45);
    [vy, rng] = nextRange(rng, -45, 45);
    [hue, rng] = nextRandom(rng);
    out.push({ x, y, vx, vy, hue });
  }
  return out;
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

/** Simulate `ticks` fixed-timestep steps from a seed. Pure & headless. */
export function simulate(
  seed: number,
  count: number,
  ticks: number,
  bounds: SimBounds,
): Particle[] {
  const particles = seedParticles(seed, count, bounds);
  for (let i = 0; i < ticks; i++) {
    for (let j = 0; j < particles.length; j++) {
      particles[j] = stepParticle(particles[j], TICK, bounds);
    }
  }
  return particles;
}
