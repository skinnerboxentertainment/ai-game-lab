# AI Game-Making Lab

A personal lab for making games with AI. Two tracks, one rule set.

## What the lab is

A **read-only workshop**. The lab holds the production-track starter (the single
source of truth), governance, skills, and templates. Games are **spawned as
brand-new sibling projects** — the lab's own codebase is never edited by a game.

```bash
npm run new-game -- asteroids   # -> ../asteroids (own repo, own codebase)
```

## The rule set

1. **You are the architect; the AI is the typist.** Specs, boundaries, taste,
   and "when to rewrite" are yours.
2. **Spec first, then execute.** `.md` spec before code. Vague in → slop out.
3. **Verify with a harness, never trust.** Headless `verify` + deterministic
   tests are backpressure.
4. **Human taste is the moat.** Agents can't judge aesthetics or fun.
5. **Keep context small.** `AGENTS.md` + `docs/` + skills beat re-explaining.

The full operating contract is self-contained in `AGENTS.md`; the knowledge
packs in `docs/packs/` carry the deep, path-triggered detail.

## Two tracks

| Track | Path | Stack | Use for |
| --- | --- | --- | --- |
| Sandbox | `games/sandbox-template/` | Single-file HTML + LittleJS | Prototypes, jams, tiny games — whole game fits in one context |
| Production | spawned sibling projects | Vite + TypeScript + PixiJS v8 + bitECS | Anything that ships |

## Production track

`npm run new-game -- <name>` copies the starter + governance brain into a new
sibling repo (`../<name>`), rewrites the package name, and `git init`s it. That
project is where the game is built — never in the lab.

The starter demonstrates the lab's core patterns:

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
npm run verify     # headless smoke test (self-contained: launches its own server + browser)
npm run new-game -- <name>   # spawn a new game project as a sibling repo
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
