#!/usr/bin/env node
// Lint gate for the lab: static checks that need no external linter dependency.
// Currently: node --check on every scripts/*.mjs + an inline-script syntax check
// on the sandbox template. Fails with exit code 1 if anything does not parse.
import { readFileSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const LAB_ROOT = import.meta.dirname ? join(import.meta.dirname, "..") : ".";
let failures = 0;

function check(name, ok, detail) {
  if (ok) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

for (const f of readdirSync(join(LAB_ROOT, "scripts")).filter((f) => f.endsWith(".mjs"))) {
  const r = spawnSync(process.execPath, ["--check", join(LAB_ROOT, "scripts", f)], { encoding: "utf8" });
  check(`script parses: ${f}`, r.status === 0, r.stderr.trim().split("\n")[0] ?? "");
}

const html = readFileSync(join(LAB_ROOT, "games", "sandbox-template", "index.html"), "utf8");
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) {
  check("sandbox inline script found", false);
} else {
  const tmp = join(tmpdir(), "sandbox-inline-lint.js");
  writeFileSync(tmp, m[1]);
  const r = spawnSync(process.execPath, ["--check", tmp], { encoding: "utf8" });
  rmSync(tmp, { force: true });
  check("sandbox inline script parses", r.status === 0, r.stderr.trim().split("\n")[0] ?? "");
}

if (failures > 0) {
  console.error(`\n${failures} lint check(s) failed`);
  process.exit(1);
}
console.log("\nLint clean.");
