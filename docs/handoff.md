# HANDOFF — template

Append a short note here at the end of every session so the next one starts
clean. Keep it terse.

## Last session

- **Date:** 2026-08-01
- **Worked on:** Lab hardening after an external audit (10 findings verified).
- **Done:**
  - Sandbox template fixed (syntax + `engineInit(gameInit, gameUpdate,
    gameUpdatePost)` + correct `ParticleEmitter` burst).
  - `new-game.mjs` rewritten: game-specific AGENTS.md template, only
    `scripts/verify.mjs` copied (no leaked generator), transactional
    stage→rename, both `--out DIR` and `--out=DIR`.
  - Lab `AGENTS.md` made self-contained (no external `../ArcadeDemosceneTest`
    dependency).
  - `lint` (`node --check` on scripts) + `npm run check` gate added.
  - Viewport letterbox `clear()` fix; added sandbox/generator/viewport/accumulator
    tests.
- **Decisions made:** see `production/events.md` + tagged checkpoint.

## Current state

- Lab gates green (test + typecheck + build + lint). Asteroids game is a working
  sibling project at `C:\Users\oscar\AI WORKBENCH\asteroids` (tagged v1 + rotation
  fix).

## Next session should

1. Confirm lab checkpoint after this hardening changeset.
2. Resume the Asteroids game (its `production/active.md` is at Prove).
3. Consider the deferred P3 items: self-contained verify harness, starter upgrade
   to the full serializable `GameState` contract.
