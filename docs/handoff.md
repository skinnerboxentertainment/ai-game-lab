# HANDOFF — template

Append a short note here at the end of every session so the next one starts
clean. Keep it terse.

## Last session

- **Date:** 2026-08-13
- **Worked on:** ADR-0002 (self-contained verify + CI), then ADR-0003 (the
  starter demo now actually demonstrates the serializable `GameState` +
  action-transition pattern its own docs claim — the deferred P3 item from
  the session before).
- **Done (ADR-0002):**
  - `scripts/verify.mjs` rewritten: in-process Vite server, self-launched
    headless browser, ephemeral ports, cross-platform binary resolution,
    proper teardown. `verify` folded into `npm run check`.
  - `.github/workflows/ci.yml` added to the lab and every spawned game.
  - Two independent audits (DeepSeek) caught real bugs, fixed and
    re-verified: spawned games got a CI workflow calling a `check` script
    the generator had deleted (guaranteed first-push failure), plus four
    hardening gaps; then the first real GitHub Actions run failed on Ubuntu
    24.04's AppArmor sandbox restriction, fixed with `--no-sandbox` +
    diagnostics. **Status: Accepted**, confirmed on a real CI run.
- **Done (ADR-0003):**
  - Three incremental slices, each independently gated: (1) `src/state/rng.ts`
    rewritten from a stateful closure to plain, serializable state; (2) a
    real `GameState` wrapper + `toJSON`/`fromJSON`, proven via a mid-
    simulation serialize/deserialize round-trip test; (3) a `SPAWN_BURST`
    action wired to a click in `ParticleGalaxy` via Pixi's own event system,
    with `scripts/verify.mjs` extended to dispatch a real CDP click and
    confirm the sprite count rose by exactly `burstCount`.
  - A third independent review (DeepSeek) confirmed the architecture and
    caught one real issue — `verify.mjs` hardcoded `20 == BURST_COUNT` as a
    hidden cross-file constant. Fixed: the scene now exposes `burstCount`
    publicly; `verify.mjs` reads it live instead of duplicating it.
  - **Status: Accepted**, confirmed on a real CI run (`before=140 after=160`
    on `ubuntu-latest`, read from the actual step log).
- **Decisions made:** see `production/events.md`,
  `docs/architecture/adr/0002-ci-and-self-contained-verify.md`, and
  `docs/architecture/adr/0003-serializable-gamestate-and-actions.md`.

## Current state

- Lab gates green (test 28/28 + typecheck + build + lint + self-contained
  verify 8/8), confirmed both locally and on real GitHub Actions
  `ubuntu-latest` runs. The starter demo now genuinely matches its own
  `AGENTS.md`/`ARCHITECTURE.md` claims — every future spawned game inherits
  a template that proves the pattern, not one that admits to simplifying it.
  Asteroids game is a working sibling project at
  `C:\Users\oscar\AI WORKBENCH\asteroids` (tagged v1 + rotation fix, as of
  the last time it was touched — not revisited this session).

## Next session should

1. Resume the Asteroids game (its `production/active.md` was last at Prove).
2. No remaining deferred P3 items from prior sessions — both were closed
   this session (self-contained verify/CI, and the GameState/action
   pattern). Next objective is open.
