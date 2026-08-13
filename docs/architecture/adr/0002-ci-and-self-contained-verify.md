# ADR-0002: CI + self-contained verify harness

**Date:** 2026-08-13
**Status:** Proposed

## Context
`scripts/verify.mjs` only connects to CDP — it assumes a human already ran
`npm run dev` and hand-launched headless Edge with
`--remote-debugging-port=9222`. Two manual, skippable steps, and `verify` is
therefore excluded from `npm run check`. It also cannot run on a CI runner as
written. `PROJECT_NOTES.md` already names "wire CI (GitHub Actions: typecheck
+ test + build on push) — for the lab and spawned projects" as an open item.
This conflicts with the lab's own rule: "verify with a harness, never trust."

## Decision

### A. Self-contained `scripts/verify.mjs`
1. **Serve in-process.** Use Vite's Node API (`createServer` from `"vite"`)
   instead of requiring a separately-running `npm run dev`. Bind to an
   ephemeral port (`listen(0)`, read the assigned port back) so it never
   collides with a dev server the user may already have open.
2. **Launch the browser as a child process**, cross-platform, with
   `--remote-debugging-port=0` — Chromium writes the real assigned port to a
   `DevToolsActivePort` file inside `--user-data-dir`; read that file instead
   of hardcoding `9222`.
3. **Resolve a browser binary** by trying, in order: `msedge`,
   `microsoft-edge-stable`, `microsoft-edge`, `google-chrome-stable`,
   `google-chrome`, `chromium-browser`, `chromium`. Covers Windows dev
   machines (Edge) and GitHub-hosted Ubuntu runners (Edge + Chrome
   preinstalled). Override via `VERIFY_BROWSER_PATH`.
4. **Existing checks unchanged** — boot, geometry/contain-scale, seed, tick
   count, screenshot-sampling lit-pixel check.
5. **Teardown in a `finally`:** kill the browser child, close the Vite
   server, exit with the existing pass/fail code.
6. **Escape hatch:** `node scripts/verify.mjs <url> [port]` still attaches to
   something already running, for local debugging — no longer the default.

`verify` folds into `npm run check` once self-contained: one command is the
entire gate.

### B. CI (GitHub Actions)
Add `.github/workflows/ci.yml` to the lab: checkout → setup-node
(`node-version-file: package.json`, `cache: npm`) → `npm ci` → `npm run
check`. Runner: `ubuntu-latest` — verify's browser resolution is
cross-platform, so there's no reason to pay for Windows runners.

`scripts/new-game.mjs` copies the same workflow file into every spawned
project (added to `sharedDirs`, alongside `docs/packs`, `skills`,
`templates`).

Add an `engines.node` field to `package.json` so local and CI can't silently
drift on Node version — relevant since `--experimental-strip-types` behavior
is version-sensitive.

## Rationale
- The gate is only real backpressure if it runs without a human remembering
  three manual steps. A skippable step is a step that gets skipped.
- Ephemeral ports (server + CDP) make `verify` safe to run even when a dev
  server is already open on the default port — no more "kill your existing
  `npm run dev` first."
- Browser-binary resolution (rather than a hard Edge dependency) is what
  makes CI possible at all without adding a heavyweight dependency
  (Playwright/Puppeteer) — consistent with the project's existing choice to
  hand-roll raw CDP over WebSocket rather than pull in a browser-automation
  library.
- Spawned games inherit the same CI file for the same reason they inherit
  `verify.mjs` itself: the gate is part of what "production-track" means.

## Consequences
- Enables: `npm run check` is a complete, unattended gate; CI enforces it on
  every push for the lab and every spawned game; no more manual Edge
  launch instructions to keep in sync across `AGENTS.md` / `skills/verify.md`
  / `docs/handoff.md`.
- Constrains: `scripts/verify.mjs` grows real process-lifecycle logic
  (spawn/kill, port discovery) instead of being a thin CDP client; that
  logic itself now needs to be trustworthy (leaked child processes on a
  crashed run are a real failure mode to guard against).
- Local dev workflow changes: the three-step manual verify instructions in
  `AGENTS.md` / `skills/verify.md` / `docs/handoff.md` become stale and need
  updating alongside the code.

## Rejected Alternatives
- **Keep manual verify, add CI for test/typecheck/build/lint only:** cheaper,
  but leaves the actual rendering/geometry checks — the only meaningfully
  "did anything render" evidence — as manual-only and CI-blind.
- **Adopt Playwright/Puppeteer for browser lifecycle management:** would
  remove the hand-rolled binary-resolution and DevToolsActivePort-file
  logic, but adds a heavy dependency to a project whose only current runtime
  deps are `bitecs` and `pixi.js`, and the raw-CDP approach is already
  proven working in `verify.mjs` today.
- **Pin CI to `windows-latest` to mirror the primary dev machine exactly:**
  slower and more expensive per run; only worth it if Windows-specific
  behavior were suspected, and the whole point of binary resolution is that
  there shouldn't be any.

## Validation
- `npm run verify` succeeds from a clean checkout with zero manual steps (no
  pre-running dev server, no hand-launched browser). **Met** — two clean
  back-to-back local runs.
- `npm run check` is green in GitHub Actions on a fresh clone of the lab.
  **Not yet met** — nothing has been pushed; the workflow has never executed
  on a real runner.
- A game spawned via `new-game -- <name>` after this change has its own
  working `.github/workflows/ci.yml` out of the box. **Met** — verified by
  spawning a throwaway game, running `npm install` for real, then `npm run
  check` end-to-end (test, typecheck, build, and the browser-launching
  verify step) in that project. All green.

## Audit note (2026-08-13)

An independent audit (DeepSeek, given the change summary + full diff) caught
a real blocker missed in the original Build pass: `.github/workflows/ci.yml`
is copied verbatim into every spawned game and runs `npm run check`, but
`new-game.mjs`'s `rewritePackageJson` deleted `check` from every spawned
game's `package.json` (a leftover from before this ADR, when games had no
`verify` step worth gating on). Every game spawned between the original
Build and this fix would have failed CI on its first push with `npm error
Missing script: "check"` — the third validation criterion above was false
when first claimed "met."

Fixed: `new-game.mjs` now writes a game-appropriate `check` script (`test &&
typecheck && build && verify`, no `lint` — games never get `lint.mjs`
copied). Also fixed from the same audit: a stale `README.md` template line
in `new-game.mjs` (`writeReadme`) still describing the old manual verify
flow; no `error` listener on the spawned browser process (an unhandled spawn
failure would previously crash outside the `try`/`finally`, skipping
cleanup); no timeout on CDP commands or the initial `/json` fetch (a hung
call could stall `npm run check` — now CI — indefinitely); and POSIX
teardown used a bare `proc.kill()` (single-process `SIGTERM`) instead of
killing the whole process group, risking orphaned Chromium child processes
on Linux/macOS. All fixed; see `tests/harness.test.ts` for the new
regression-guard assertions, including one that actually runs the generated
project's test script rather than only checking file contents.

Status stays **Proposed** — the audit's own remaining open item (GitHub
Actions has never executed for real) is still true and is the actual bar for
"Accepted."
