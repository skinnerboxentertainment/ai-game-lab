/**
 * Harness tests (Node): pure helpers + generator output validity.
 *   node --experimental-strip-types tests/harness.test.ts
 * Covers findings #7 (coverage gaps): viewport math, accumulator, ECS/core
 * equivalence, and scaffold generator output.
 */
import { mkdtempSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { containScale } from "../src/core/containScale.ts";
import { accumulate } from "../src/core/fixedstep.ts";
import { stepParticle, TICK } from "../src/state/core.ts";
import { addParticle, createEcsWorld, stepAll, Position, Velocity } from "../src/ecs/world.ts";
import type { Particle, SimBounds } from "../src/state/core.ts";

const LAB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let failures = 0;
function check(name: string, ok: boolean, detail?: string): void {
  if (ok) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// 1. containScale: 16:9 window, square window, zero-size window.
{
  const wide = containScale(1920, 1080, 1280, 720);
  check("containScale 16:9 -> scale 1.5", Math.abs(wide.scale - 1.5) < 1e-9);
  check("containScale centers vertically", wide.offsetX === 0 && wide.offsetY === 0);

  const tall = containScale(800, 800, 1280, 720);
  const expected = Math.min(800 / 1280, 800 / 720);
  check(
    "containScale caps by limiting axis",
    Math.abs(tall.scale - expected) < 1e-9,
    `scale=${tall.scale}`,
  );
  check("containScale positive offsets", tall.offsetX >= 0 && tall.offsetY >= 0);

  const zero = containScale(0, 0, 1280, 720);
  check("containScale zero window -> scale 0", zero.scale === 0);
}

// 2. accumulate: fixed-timestep semantics + max-step guard.
{
  const one = accumulate(1 / 60, TICK, 8);
  check("accumulate: exactly one tick", one.steps === 1 && Math.abs(one.remainder) < 1e-12);

  const three = accumulate(3.5 / 60, TICK, 8);
  check("accumulate: 3.5 ticks -> 3 steps + 0.5 remainder",
    three.steps === 3 && Math.abs(three.remainder - 0.5 / 60) < 1e-12);

  const capped = accumulate(20 / 60, TICK, 8);
  check("accumulate caps steps at maxSteps", capped.steps === 8);

  const none = accumulate(0.01, TICK, 8);
  check("accumulate: sub-tick dt -> 0 steps", none.steps === 0);
}

// 3. ECS/core equivalence: bitECS stepAll == pure core stepParticle.
{
  const bounds: SimBounds = { width: 1280, height: 720 };
  const particles: Particle[] = [
    { x: 100, y: 200, vx: 40, vy: -30, hue: 0.2 },
    { x: 600, y: 100, vx: -55, vy: 25, hue: 0.7 },
    { x: 1200, y: 650, vx: 15, vy: 60, hue: 0.9 },
  ];

  const ecsWorld = createEcsWorld();
  const eids = particles.map((p) => addParticle(ecsWorld, p, 1));

  const expected = particles.map((p) => stepParticle(p, TICK, bounds));
  stepAll(eids, TICK, bounds);

  let equivalent = true;
  let detail = "";
  for (let i = 0; i < eids.length; i++) {
    const eid = eids[i];
    const got = {
      x: Position.x[eid],
      y: Position.y[eid],
      vx: Velocity.vx[eid],
      vy: Velocity.vy[eid],
    };
    const want = expected[i];
    if (
      Math.abs(got.x - want.x) > 1e-3 ||
      Math.abs(got.y - want.y) > 1e-3 ||
      Math.abs(got.vx - want.vx) > 1e-3 ||
      Math.abs(got.vy - want.vy) > 1e-3
    ) {
      equivalent = false;
      detail = JSON.stringify({ got, want });
      break;
    }
  }
  check("ECS stepAll matches pure core stepParticle", equivalent, detail);
}

// 4. Generator output validity: new-game produces a game-specific project.
{
  const tmp = mkdtempSync(join(tmpdir(), "new-game-test-"));
  const r = spawnSync(
    process.execPath,
    [join(LAB_ROOT, "scripts", "new-game.mjs"), "verifygen", `--out=${tmp}`],
    { encoding: "utf8" },
  );
  check("new-game spawns a project (exit 0)", r.status === 0, r.stderr?.trim());

  const gameDir = join(tmp, "verifygen");
  if (existsSync(gameDir)) {
    const pkg = JSON.parse(readFileSync(join(gameDir, "package.json"), "utf8"));
    check("generated package name is the game", pkg.name === "verifygen");

    const ag = readFileSync(join(gameDir, "AGENTS.md"), "utf8");
    check(
      "generated AGENTS.md is game-specific (no lab-workshop wording)",
      !/read-only workshop/.test(ag) && /^# AGENTS\.md [—-] verifygen/m.test(ag),
    );
    check(
      "generated AGENTS.md has no new-game command",
      !/new-game/.test(ag),
    );
    check(
      "no leaked new-game.mjs in generated scripts",
      !existsSync(join(gameDir, "scripts", "new-game.mjs")),
    );
    check(
      "generated project has verify.mjs",
      existsSync(join(gameDir, "scripts", "verify.mjs")),
    );
    check(
      "generated scripts dir has only verify.mjs",
      JSON.stringify(readdirSync(join(gameDir, "scripts")).sort()) ===
        JSON.stringify(["verify.mjs"]),
    );

    const testScript = pkg.scripts?.test ?? "";
    check(
      "generated test script runs only existing tests",
      testScript === "node --experimental-strip-types tests/state.test.ts" &&
        existsSync(join(gameDir, "tests", "state.test.ts")) &&
        !readdirSync(join(gameDir, "tests")).some((f) => f !== "state.test.ts"),
      testScript,
    );
    check(
      "generated project has no lab-only lint/check scripts",
      !pkg.scripts?.lint && !pkg.scripts?.check,
    );
  }
}

if (failures > 0) {
  throw new Error(`${failures} harness check(s) failed`);
}
console.log("\nAll harness checks passed.");
