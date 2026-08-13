/**
 * Determinism test for the pure state core. Runs in Node (no browser, no Pixi):
 *   npm run test
 * This is the lab's "tests as backpressure" contract — the core must be
 * provably deterministic so an agent (and a headless harness) can verify work.
 */
import { seedParticles, stepParticle, simulate, TICK } from "../src/state/core.ts";
import { createRng, nextRandom } from "../src/state/rng.ts";
import type { RngState } from "../src/state/rng.ts";

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

// 6. RNG state round-trips: resuming from a serialized mid-sequence state
// (a plain JSON round-trip, standing in for a real save/load) continues
// identically to never having paused.
{
  const uninterrupted: number[] = [];
  let rng = createRng(42);
  for (let i = 0; i < 10; i++) {
    const [value, next] = nextRandom(rng);
    uninterrupted.push(value);
    rng = next;
  }

  const resumed: number[] = [];
  let rngA = createRng(42);
  for (let i = 0; i < 5; i++) {
    const [value, next] = nextRandom(rngA);
    resumed.push(value);
    rngA = next;
  }
  let rngB: RngState = JSON.parse(JSON.stringify(rngA));
  for (let i = 5; i < 10; i++) {
    const [value, next] = nextRandom(rngB);
    resumed.push(value);
    rngB = next;
  }

  check(
    "RNG state round-trips through JSON mid-sequence",
    JSON.stringify(uninterrupted) === JSON.stringify(resumed),
  );
}

// 7. RNG state is a plain value: nextRandom never mutates its input.
{
  const before = createRng(7);
  const snapshot = JSON.stringify(before);
  nextRandom(before);
  check(
    "nextRandom does not mutate its input state",
    JSON.stringify(before) === snapshot,
  );
}

if (failures > 0) {
  throw new Error(`${failures} determinism check(s) failed`);
}
console.log("\nAll determinism checks passed.");
