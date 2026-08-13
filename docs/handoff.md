# HANDOFF — template

Append a short note here at the end of every session so the next one starts
clean. Keep it terse.

## Last session

- **Date:** 2026-08-13
- **Worked on:** ADR-0002 — self-contained `scripts/verify.mjs` (no more
  manual dev-server + Edge-on-:9222 setup) and GitHub Actions CI for the lab
  and every spawned game. One of the deferred P3 items from the prior
  session (see old note below).
- **Done:**
  - `scripts/verify.mjs` rewritten: in-process Vite server on an ephemeral
    port, self-launched headless browser, ephemeral CDP port via
    `DevToolsActivePort`, cross-platform binary resolution
    (`VERIFY_BROWSER_PATH` override), proper teardown. `verify` folded into
    `npm run check`.
  - `.github/workflows/ci.yml` added to the lab; `new-game.mjs` now copies it
    into every spawned game too, along with a game-appropriate `check`
    script.
  - Two independent audits (DeepSeek) caught real bugs, both fixed and
    re-verified:
    1. Spawned games got a CI workflow that called a `check` script the
       generator had deleted — guaranteed first-push failure. Fixed, plus
       four hardening gaps (spawn-error handling, CDP timeouts, POSIX
       process-group kill).
    2. The first real GitHub Actions run failed: Ubuntu 24.04's AppArmor
       policy breaks Chromium's sandbox init. Fixed with `--no-sandbox` +
       stderr capture + fail-fast diagnostics.
  - Second real CI run passed clean. **ADR-0002 status: Accepted.**
- **Decisions made:** see `production/events.md` and
  `docs/architecture/adr/0002-ci-and-self-contained-verify.md`.

## Current state

- Lab gates green (test + typecheck + build + lint + self-contained verify),
  confirmed both locally and on a real GitHub Actions `ubuntu-latest` run.
  Asteroids game is a working sibling project at
  `C:\Users\oscar\AI WORKBENCH\asteroids` (tagged v1 + rotation fix, as of
  the last time it was touched — not revisited this session).

## Next session should

1. Resume the Asteroids game (its `production/active.md` was last at Prove).
2. Consider the remaining deferred P3 item: starter upgrade to the full
   serializable `GameState` + action-transition contract (currently only the
   particle-sim toy demonstrates the pure-core pattern; Asteroids is the
   only place the full pattern is proven out).
