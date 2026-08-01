#!/usr/bin/env node
// Spawn a brand-new production-track game project as a sibling of the lab,
// never modifying the lab itself. The lab is a read-only workshop: templates,
// skills, verify harness, governance brain. Each game gets its own repo.
//
//   npm run new-game -- asteroids            -> ../asteroids
//   npm run new-game -- asteroids --out D:\games
//
// The scaffolded project is a copy of the production-track starter plus the
// governance brain (AGENTS.md, docs/packs, skills, templates), a fresh
// package.json name, and an initialized git repo.

import { cpSync, existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { spawnSync } from "node:child_process";

const LAB_ROOT = resolve(import.meta.dirname, "..");
const WORKBENCH_ROOT = resolve(LAB_ROOT, "..");

const args = process.argv.slice(2);
const nameArg = args.find((a) => !a.startsWith("--"));
const outFlag = args.find((a) => a.startsWith("--out="));
const outDir = outFlag ? outFlag.slice("--out=".length) : null;

if (!nameArg) {
  console.error("Usage: npm run new-game -- <name> [--out=DIR]");
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

const log = (msg) => console.log(`  ${msg}`);
log(`Spawning game project "${name}" -> ${dest}`);

mkdirSync(dest, { recursive: true });

const copyFiles = [
  "index.html",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "vite.config.ts",
  ".gitignore",
  "AGENTS.md",
];

const copyDirs = [
  "src",
  "tests",
  "scripts",
  "docs/packs",
  "docs/architecture",
  "skills",
  "templates",
];

for (const f of copyFiles) {
  cpSync(join(LAB_ROOT, f), join(dest, f), { recursive: true });
  log(`copied ${f}`);
}

for (const d of copyDirs) {
  cpSync(join(LAB_ROOT, d), join(dest, d), { recursive: true });
  log(`copied ${d}/`);
}

const docs = ["CONSORT_MODEL.md", "ARCHITECTURE.md", "handoff.md"];
for (const f of docs) {
  if (existsSync(join(LAB_ROOT, "docs", f))) {
    cpSync(join(LAB_ROOT, "docs", f), join(dest, "docs", f));
    log(`copied docs/${f}`);
  }
}

// Rewrite package.json name + description.
const pkgPath = join(dest, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.name = name;
pkg.description = `Production-track game "${name}" spawned from the AI Game Lab.`;
delete pkg.scripts["new-game"];
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
log("rewrote package.json name");

// Rewrite index.html title.
const htmlPath = join(dest, "index.html");
const html = readFileSync(htmlPath, "utf8").replace(
  /<title>.*<\/title>/,
  `<title>${name} — AI Game Lab</title>`,
);
writeFileSync(htmlPath, html);
log("rewrote index.html title");

// Fresh project brain (active.md, events.md).
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

// A per-game README pointing at the lab and the workflow.
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
npm run test       # determinism test for the state core
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

// Init git.
const git = spawnSync("git", ["init", "-b", "main"], { cwd: dest, stdio: "inherit" });
if (git.status !== 0) {
  console.error("git init failed (is git installed?)");
  process.exit(1);
}
log("git repo initialized (branch: main)");

console.log(`\nDone. Next steps:
  cd ${dest}
  npm install
  npm run dev
  npm run test && npm run typecheck && npm run build && npm run verify
Write docs/SPEC.md (or move an existing spec) and start the 7-beat rhythm.`);
