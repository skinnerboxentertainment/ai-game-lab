# AGENTS.md — AI Game-Making Lab

The lab is a sandbox for making games with AI, following the operating rules in
`../ArcadeDemosceneTest/docs/AI_GAME_LAB_BLUEPRINT.md` (knowledge base:
`../ArcadeDemosceneTest/docs/r_aigamedev_COMPENDIUM.md`).

## Operating model (the consort)

Two actors, three tiers — see `docs/CONSORT_MODEL.md` for the full model.

- **Orchestrator** (human/lead): architecture, workflow, integration, final
  review, decision log.
- **Builder** (coding agent): implementation, verification, testing, debugging.
- **7-beat rhythm:** Explore → Frame → Expand → Attack → Commit → Build → Prove,
  coordinated via `production/active.md`.
- **Escalation ladder:** clarify → ask what evidence decides → prefer reversible
  → ADR for irreversible → user on taste/scope → orchestrator on
  integration/architecture → builder on implementation mechanics.
- **Collaboration:** agents propose 2-4 options with trade-offs; user decides.
  No commits without explicit instruction. Multi-file changes need approval.

## Project brain (durable memory)

- `production/active.md` — current beat, objective, active packs, next action.
  Read this first in every session.
- `production/events.md` — chronological log; append at each Prove.
- `docs/architecture/adr/` — numbered ADRs with validation criteria.

## Knowledge packs (docs/packs/)

Loaded by path trigger, never automatically. When touching a matching path,
suggest the pack and ask before loading:

| Pack | Load when touching |
| --- | --- |
| `state-authority-pack.md` | `src/state/**`, `src/ecs/**`, `src/scenes/**`, save/authority |
| `pixijs-lab-pack.md` | any render/input/asset/audio work |
| `qa-evidence-pack.md` | any story completion / refactor / bug fix |

## Identity

You are the sole engineer on this project. You have read this file every session.
Never silently undo or re-derive a decision recorded below — re-read, then ask.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server (http://localhost:5173) |
| `npm run typecheck` | Strict `tsc --noEmit` |
| `npm run test` | Node determinism test for the pure state core |
| `npm run build` | `tsc --noEmit` + `vite build` |
| `npm run verify` | Headless smoke test (CDP screenshot sampling) |
| `npm run new-game -- <name>` | Spawn a brand-new production-track game project as a sibling repo (never edits the lab) |
| `npm run preview` | Serve the production build |

## Live rules (update when the model fumbles)

- [ ] Logical display is permanently 1280 × 720 (`src/config/display.ts`).
- [ ] `src/core/Viewport.ts` owns the stage. **Only the viewport root is
      scaled/centered.** Resize is handled by `app.renderer.on("resize", ...)`
      using `renderer.screen` (CSS px) — never `renderer.width` (physical).
- [ ] **One serializable `GameState`; all simulation runs through pure functions
      `(state, action, seededRng) -> newState`.** No module reads/writes state or
      calls the RNG except the simulation core (`src/state/`).
- [ ] Never reuse a seed across two scopes. The sim steps on a **fixed timestep**
      (`TICK = 1/60`) so it is deterministic regardless of frame rate.
- [ ] Server-authoritative for any economy/progression/irreversible outcome.
- [ ] One system/object per file; split any file past ~500 lines.
- [ ] Green gates after EVERY change: `tests + typecheck + build + lint` plus a
      smoke scene. Add a regression test for any behavioral change.
- [ ] Evidence is Definition of Done: a Logic story marked done without tests is
      a blocker (see `docs/packs/qa-evidence-pack.md`).
- [ ] Never touch files outside your stated ownership list.
- [ ] Describe feelings, not just mechanics, in specs.

## Architecture

- `src/state/core.ts` — **pure deterministic core** (seeded RNG, particle sim).
  No Pixi/bitECS imports; unit-tested in Node (`tests/state.test.ts`).
- `src/ecs/world.ts` — bitECS component/entity layer that drives the pure core.
- `src/scenes/ParticleGalaxy.ts` — demo scene: fixed-timestep ECS sim rendered
  by PixiJS sprites.
- `src/core/*` — Application + Viewport (proven pattern, see the Arcade demo).
- Layer order (fixed): `backgroundLayer` → `effectsLayer` → `sceneLayer` →
  `uiLayer`. Sim logic never lives in render code.

## Headless verification (no human eyes)

Headless pages report `document.hidden === true` → rAF throttled (~5-8 FPS) and
`extract.pixels()` returns zeros. **Do not trust FPS or extract readings from
headless.** Use screenshot sampling:

1. `npm run dev`
2. Start Edge headless with a debug port:
   `msedge --headless=new --disable-gpu --enable-unsafe-swiftshader --no-first-run --user-data-dir=%TEMP%\edge-cdp --remote-debugging-port=9222 --window-size=1440,900 http://localhost:5173/?seed=1337`
3. `node scripts/verify.mjs`

`scripts/verify.mjs` checks boot (`window.__demo`), 1280×720 logical display,
contain-scale math, and that particles actually render (screenshot sampling).

## Skills & templates

- `skills/` — reusable instruction packs (`verify`, `add-sprite`, `balance`).
- `templates/` — prompt/spec/spritesheet templates for new games.
- `games/` — one folder (or one HTML file) per game. Sandbox track uses LittleJS
  single-file (`games/sandbox-template`); production track spawns **sibling
  projects** via `npm run new-game -- <name>` (never edits the lab).
