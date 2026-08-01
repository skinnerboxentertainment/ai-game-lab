/**
 * Determinism test for the pure state core. Runs in Node (no browser, no Pixi):
 *   npm run test
 * This is the lab's "tests as backpressure" contract — the core must be
 * provably deterministic so an agent (and a headless harness) can verify work.
 */
import { seedParticles, stepParticle, simulate, TICK } from "../src/state/core.ts";

const BOUNDS = { width: 1280, height: 720 };
let failures = 0;

function check(name: string, ok: boolean, detail?: string): void {
  if (ok) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// 1. Same seed -> identical particle sets.
const a = seedParticles(1337, 50, BOUNDS);
const b = seedParticles(1337, 50, BOUNDS);
check("same seed -> identical spawn", JSON.stringify(a) === JSON.stringify(b));

// 2. Different seeds -> different sets.
const c = seedParticles(1338, 50, BOUNDS);
check(
  "different seed -> different spawn",
  JSON.stringify(a) !== JSON.stringify(c),
);

// 3. Simulation is deterministic (same seed + ticks -> identical final state).
const r1 = simulate(2024, 20, 600, BOUNDS);
const r2 = simulate(2024, 20, 600, BOUNDS);
check(
  "simulate deterministic (600 ticks)",
  JSON.stringify(r1) === JSON.stringify(r2),
);

// 4. stepParticle bounces off bounds.
const p = { x: 0, y: 0, vx: -50, vy: -50, hue: 0.5 };
const next = stepParticle(p, TICK, BOUNDS);
check(
  "bounce keeps inside bounds and flips velocity",
  next.x >= 0 && next.y >= 0 && next.vx >= 0 && next.vy >= 0,
);

// 5. Pure: inputs are never mutated.
check(
  "stepParticle is pure (inputs unchanged)",
  p.x === 0 && p.y === 0 && p.vx === -50 && p.vy === -50,
);

if (failures > 0) {
  throw new Error(`${failures} determinism check(s) failed`);
}
console.log("\nAll determinism checks passed.");
