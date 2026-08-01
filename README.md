# AI Game-Making Lab

A personal lab for making games with AI. Two tracks, one rule set.

## The rule set (from the blueprint)

1. **You are the architect; the AI is the typist.** Specs, boundaries, taste,
   and "when to rewrite" are yours.
2. **Spec first, then execute.** `.md` spec before code. Vague in → slop out.
3. **Verify with a harness, never trust.** Headless `verify` + deterministic
   tests are backpressure.
4. **Human taste is the moat.** Agents can't judge aesthetics or fun.
5. **Keep context small.** `AGENTS.md` + `docs/` + skills beat re-explaining.

Full rationale + synthesis: `../ArcadeDemosceneTest/docs/AI_GAME_LAB_BLUEPRINT.md`
and `../ArcadeDemosceneTest/docs/r_aigamedev_COMPENDIUM.md`.

## Two tracks

| Track | Path | Stack | Use for |
| --- | --- | --- | --- |
| Sandbox | `games/sandbox-template/` | Single-file HTML + LittleJS | Prototypes, jams, tiny games — whole game fits in one context |
| Production | this app (`src/`) | Vite + TypeScript + PixiJS v8 + bitECS | Anything that ships |

## Production track (this app)

A runnable starter demonstrating the lab's core patterns:

- **Fixed logical 1280 × 720 display** that contains-scales to any window
  (`src/core/Viewport.ts`, `renderer.screen` CSS-px math).
- **Deterministic pure state core** (`src/state/core.ts`) — seeded RNG, pure
  `stepParticle`, unit-tested in Node (`npm run test`).
- **bitECS entity layer** (`src/ecs/world.ts`) driving the pure core.
- **Fixed-timestep simulation** (`TICK = 1/60`) so the sim is deterministic
  regardless of frame rate.
- **Headless verify harness** (`scripts/verify.mjs`) — boot + geometry + render
  checks via CDP screenshot sampling.

Seed the demo deterministically with `?seed=<number>` (default `1337`).

## Quickstart

```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # determinism test for the state core
npm run build      # typecheck + production build
npm run verify     # headless smoke test (needs dev server + Edge on :9222)
```

## Layout

```
AGENTS.md · PROJECT_NOTES.md · README.md
docs/            # CONSORT_MODEL.md, SPEC/ARCHITECTURE/handoff templates,
                 # architecture/adr/, packs/ (distilled knowledge packs)
production/      # active.md (current state), events.md (chronological log)
skills/          # verify, add-sprite, balance (reusable instruction packs)
templates/       # spec, prompt, spritesheet templates
scripts/verify.mjs
tests/state.test.ts
src/             # production-track starter
games/           # one folder per game; sandbox-track template included
```

## Operating model

The lab runs on the **Consort Model** (two actors + 7-beat rhythm + knowledge
packs + a three-file project brain) — adapted from the MIT-licensed
AutoMagically repo. See `docs/CONSORT_MODEL.md`, `docs/packs/`,
`production/active.md`, and `production/events.md`. Every session starts by
reading `production/active.md`.
