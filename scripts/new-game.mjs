#!/usr/bin/env node
// Spawn a brand-new production-track game project as a sibling of the lab,
// never modifying the lab itself. The lab is a read-only workshop: templates,
// skills, verify harness, governance brain. Each game gets its own repo.
//
//   npm run new-game -- asteroids             -> ../asteroids
//   npm run new-game -- asteroids --out D:\games
//   npm run new-game -- asteroids --out=D:\games
//
// The scaffold is staged in a temp sibling directory, validated, then renamed
// into place (transactional: a failure never leaves a half-built project).

import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const LAB_ROOT = resolve(import.meta.dirname, "..");
const WORKBENCH_ROOT = resolve(LAB_ROOT, "..");

const args = process.argv.slice(2);
const nameArg = args.find((a) => !a.startsWith("--"));
let outDir = null;
const outIdx = args.findIndex((a) => a.startsWith("--out"));
if (outIdx >= 0) {
  const flag = args[outIdx];
  const inline = flag.slice("--out".length).replace(/^=/, "");
  outDir = inline || args[outIdx + 1] || null;
}

if (!nameArg) {
  console.error("Usage: npm run new-game -- <name> [--out=DIR | --out DIR]");
  process.exit(1);
}

const name = nameArg.toLowerCase().replace(/[^a-z0-9-]/g, "-");
if (!/^[a-z0-9][a-z0-9-]*$/.test(name) || name.includes("--")) {
  console.error(`Invalid game name: "${nameArg}". Use kebab-case, e.g. "asteroids".`);
  process.exit(1);
}

const dest = outDir ? resolve(outDir, name) : join(WORKBENCH_ROOT, name);
if (existsSync(dest)) {
  console.error(`Destination already exists: ${dest}`);
  process.exit(1);
}
mkdirSync(dirname(dest), { recursive: true });

const log = (msg) => console.log(`  ${msg}`);

// --- Stage in the same parent as the final name so rename is atomic.
const stage = mkdtempSync(join(dirname(dest), `.new-game-${name}-`));
let committed = false;
try {
  buildProject(stage);
  log(`validated ${stage}`);
  renameSync(stage, dest);
  committed = true;
} finally {
  if (!committed) rmSync(stage, { recursive: true, force: true });
}

log(`Spawning game project "${name}" -> ${dest}`);
initGit(dest);

console.log(`\nDone. Next steps:
  cd ${dest}
  npm install
  npm run dev
  npm run test && npm run typecheck && npm run build && npm run verify
Write docs/SPEC.md (or move an existing spec) and start the 7-beat rhythm.`);

// --- Scaffold construction ---

function buildProject(dest) {
  const copyFiles = ["index.html", "package.json", "package-lock.json", "tsconfig.json", "vite.config.ts", ".gitignore"];
  for (const f of copyFiles) {
    cpSync(join(LAB_ROOT, f), join(dest, f));
    log(`copied ${f}`);
  }

  // Starter code + the ONE game script (verify). The lab's new-game generator
  // itself is lab-only and must NOT leak into generated projects.
  const copyDirs = [
    ["src", "src"],
    ["scripts/verify.mjs", "scripts/verify.mjs"],
  ];
  for (const [src, out] of copyDirs) {
    cpSync(join(LAB_ROOT, src), join(dest, out), { recursive: true });
    log(`copied ${out}`);
  }

  // Only the starter's pure-core determinism test ships to games. The lab's
  // sandbox + harness tests assert on lab-internal paths (games/ sandbox
  // template, the generator itself) that a spawned project must not contain.
  mkdirSync(join(dest, "tests"), { recursive: true });
  for (const t of ["state.test.ts"]) {
    cpSync(join(LAB_ROOT, "tests", t), join(dest, "tests", t));
    log(`copied tests/${t}`);
  }

  // Governance + knowledge packs + templates (shared, game-relevant).
  const sharedDirs = [
    "docs/packs",
    "docs/architecture",
    "skills",
    "templates",
    ".github/workflows",
  ];
  for (const d of sharedDirs) {
    cpSync(join(LAB_ROOT, d), join(dest, d), { recursive: true });
    log(`copied ${d}/`);
  }
  for (const f of ["CONSORT_MODEL.md", "ARCHITECTURE.md", "handoff.md"]) {
    if (existsSync(join(LAB_ROOT, "docs", f))) {
      cpSync(join(LAB_ROOT, "docs", f), join(dest, "docs", f));
      log(`copied docs/${f}`);
    }
  }

  rewritePackageJson(dest);
  rewriteIndexHtml(dest);
  writeGameAgentsMd(dest);
  writeProjectBrain(dest);
  writeReadme(dest);
  log("scaffold complete");
}

function rewritePackageJson(dest) {
  const pkgPath = join(dest, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.name = name;
  pkg.description = `Production-track game "${name}" spawned from the AI Game Lab.`;
  delete pkg.scripts["new-game"];
  // Games ship only the pure-core determinism test; the lab's sandbox/harness
  // tests and lint script reference lab-internal paths that games don't have.
  pkg.scripts["test"] = "node --experimental-strip-types tests/state.test.ts";
  delete pkg.scripts["lint"];
  delete pkg.scripts["check"];
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  log("rewrote package.json name");
}

function rewriteIndexHtml(dest) {
  const htmlPath = join(dest, "index.html");
  const html = readFileSync(htmlPath, "utf8").replace(
    /<title>.*<\/title>/,
    `<title>${name} — AI Game Lab</title>`,
  );
  writeFileSync(htmlPath, html);
  log("rewrote index.html title");
}

/** Game-specific AGENTS.md: describes THIS project, not the lab workshop. */
function writeGameAgentsMd(dest) {
  writeFileSync(
    join(dest, "AGENTS.md"),
    `# AGENTS.md — ${name}

You are the sole engineer on the **${name}** production-track game, spawned from
the AI Game Lab. This repo is its own codebase — not the lab, not a demo.

## Rules (inherited from the lab's operating model)

- **Deterministic pure core:** one serializable \`GameState\`; all simulation
  runs through pure functions \`(state, action, seededRng) -> newState\` in
  \`src/state/\`. No module reads/writes state or calls the RNG outside the core.
- **Fixed timestep** (\`TICK = 1/60\`) so the sim is deterministic regardless of
  frame rate. Never reuse a seed across two scopes.
- **State/render separation:** gameplay owns plain state; visuals sync from it;
  never store gameplay on sprites; the scene graph can be rebuilt without losing
  the simulation.
- **Viewport:** logical display is permanently 1280 × 720 (\`src/config/display.ts\`).
  \`src/core/Viewport.ts\` owns the stage; only the viewport root is scaled/centered,
  using \`renderer.screen\` (CSS px), never \`renderer.width\`.
- **Green gates after EVERY change:** \`npm run test && npm run typecheck &&
  npm run build\` plus the headless smoke (\`npm run verify\`). Evidence is
  Definition of Done — a Logic story marked done without tests is a blocker.
- One system/object per file; split any file past ~500 lines.
- Describe feelings, not just mechanics, in specs.
- **No commits without explicit instruction.** Multi-file changes need approval.
- Headless verification caveat: \`document.hidden === true\` throttles FPS and
  zeroes \`extract.pixels()\`; trust screenshot sampling (\`scripts/verify.mjs\`),
  never headless FPS/extract readings.

## Commands

| Command | Purpose |
| --- | --- |
| \`npm run dev\` | Vite dev server (http://localhost:5173) |
| \`npm run typecheck\` | Strict \`tsc --noEmit\` |
| \`npm run test\` | Node determinism tests for the pure state core |
| \`npm run build\` | \`tsc --noEmit\` + \`vite build\` |
| \`npm run verify\` | Headless smoke test (CDP screenshot sampling) |
| \`npm run preview\` | Serve the production build |

## Architecture

- \`src/state/\` — pure deterministic core (seeded RNG, game sim). Unit-tested in Node.
- \`src/ecs/\` — bitECS component/entity layer that drives the pure core.
- \`src/scenes/\` — fixed-timestep sim rendered by PixiJS sprites.
- \`src/core/*\` — Application + Viewport.
- Layer order (fixed): \`backgroundLayer\` → \`effectsLayer\` → \`sceneLayer\` → \`uiLayer\`.
  Sim logic never lives in render code.

## Knowledge packs (docs/packs/)

Loaded by path trigger, never automatically:

| Pack | Load when touching |
| --- | --- |
| \`state-authority-pack.md\` | \`src/state/**\`, \`src/ecs/**\`, \`src/scenes/**\`, save/authority |
| \`pixijs-lab-pack.md\` | any render/input/asset/audio work |
| \`qa-evidence-pack.md\` | any story completion / refactor / bug fix |
`,
  );
  log("wrote game-specific AGENTS.md");
}

function writeProjectBrain(dest) {
  const prod = join(dest, "production");
  mkdirSync(prod, { recursive: true });
  writeFileSync(
    join(prod, "active.md"),
    `# Active Session\n\n## Current Beat\nFrame\n\n## Current Objective\n${name}: first playable vertical slice from spec.\n\n## Active Packs\n- qa-evidence: how this story gets tested (decide at Frame)\n\n## Open Decisions\n- (none blocking)\n\n## Next Action\nWrite or confirm docs/SPEC.md, then run the 7-beat rhythm through Commit -> Build -> Prove.\n\n## Blockers\n- None.\n`,
  );
  writeFileSync(
    join(prod, "events.md"),
    `# Events — chronological log\n\n## ${new Date().toISOString().slice(0, 10)}\n- Project spawned from the AI Game Lab via scripts/new-game.mjs (production-track starter + governance brain).\n`,
  );
  log("wrote fresh production/active.md + events.md");
}

function writeReadme(dest) {
  writeFileSync(
    join(dest, "README.md"),
    `# ${name}

A production-track game spawned from the **AI Game Lab** (Vite + TypeScript +
PixiJS v8 + bitECS). The lab is a read-only workshop; this project is its own
repo and codebase.

## Quickstart

\`\`\`bash
npm install
npm run dev        # http://localhost:5173
npm run test       # determinism tests for the state core
npm run build      # typecheck + production build
npm run verify     # headless smoke test (needs dev server + Edge on :9222)
\`\`\`

## Rules

- Deterministic pure core (seeded RNG, fixed timestep 1/60), one serializable
  GameState, all sim math in \`src/state/\`.
- Evidence is Definition of Done: unit tests for logic, \`npm run test\` +
  \`typecheck\` + \`build\` + headless verify green after every change.
- See \`AGENTS.md\` (full rules), \`docs/ARCHITECTURE.md\` (constitution),
  \`docs/packs/\` (knowledge packs), \`docs/SPEC.md\` (the current story).
`,
  );
  log("wrote README.md");
}

function initGit(dest) {
  const git = spawnSync("git", ["init", "-b", "main"], { cwd: dest, stdio: "inherit" });
  if (git.status !== 0) {
    console.error("git init failed (is git installed?)");
    process.exit(1);
  }
  log("git repo initialized (branch: main)");
}
