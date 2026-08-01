/**
 * Sandbox template validity test (Node, no browser):
 *   node --experimental-strip-types tests/sandbox.test.ts
 * Guards the fix for the "sandbox template does not parse" finding: the inline
 * script must be syntactically valid and must pass its callbacks to engineInit.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;

function check(name: string, ok: boolean, detail?: string): void {
  if (ok) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const html = readFileSync(
  join(ROOT, "games", "sandbox-template", "index.html"),
  "utf8",
);
const inline = html.match(/<script>([\s\S]*?)<\/script>/);

check("sandbox template has one inline <script>", !!inline);
if (!inline) {
  throw new Error("cannot inspect sandbox template");
}

const code = inline[1];

// No bare method declarations (the original bug: `gameInit() {` at top level).
check(
  "callbacks are function declarations, not bare methods",
  !/^\s*game(Init|Update|UpdatePost|Render|RenderPost)\(\)\s*\{/m.test(code),
);

// All three callbacks passed to engineInit.
const m = code.match(/engineInit\s*\(([\s\S]*?)\)\s*;/);
check("engineInit called", !!m);
if (m) {
  const args = m[1];
  check(
    "engineInit receives gameInit",
    /gameInit/.test(args) && !/engineInit\s*\(\s*\)/.test(m[0]),
  );
  check(
    "engineInit receives gameUpdate",
    /gameUpdate\b/.test(args),
  );
  check(
    "engineInit receives gameUpdatePost",
    /gameUpdatePost\b/.test(args),
  );
}

// Seeded RNG present (lab determinism rule for the sandbox track).
check(
  "seeded RNG present",
  /seed\s*=\s*new URLSearchParams\(location\.search\)/.test(code) &&
    /function rand\(\)/.test(code),
);

if (failures > 0) {
  throw new Error(`${failures} sandbox check(s) failed`);
}
console.log("\nAll sandbox checks passed.");
