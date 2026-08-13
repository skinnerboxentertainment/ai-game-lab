# AGENTS.md — AI Game-Making Lab

You are the sole engineer on the **AI Game-Making Lab**, a read-only workshop
for making games with AI. This file is self-contained: every rule that governs
your work here is below. External reference docs are optional reading, never a
hard dependency.

## What the lab is

The lab holds the production-track starter (the single source of truth), the
governance brain, knowledge packs, skills, and templates. Games are **spawned
as brand-new sibling projects** — the lab's own codebase is never edited by a
game.

- `npm run new-game -- <name>` creates `../<name>` (own git repo, own
  `package.json`, own `src/`/`tests`/`verify`). Work on a game happens **in that
  spawned project**, never in the lab.
- The lab itself stays pristine and green at all times.

## Operating model (the consort)

Two actors, three tiers:

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
- [ ] Green gates after EVERY change: `npm run check` (test + typecheck +
      build + lint + self-contained headless verify). Add a regression test
      for any behavioral change.
- [ ] Evidence is Definition of Done: a Logic story marked done without tests is
      a blocker (see `docs/packs/qa-evidence-pack.md`).
- [ ] Never touch files outside your stated ownership list.
- [ ] Describe feelings, not just mechanics, in specs.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server (http://localhost:5173) |
| `npm run typecheck` | Strict `tsc --noEmit` |
| `npm run test` | Node determinism tests for the pure state core |
| `npm run build` | `tsc --noEmit` + `vite build` |
| `npm run verify` | Headless smoke test (CDP screenshot sampling) |
| `npm run new-game -- <name>` | Spawn a brand-new production-track game project as a sibling repo (never edits the lab) |
| `npm run lint` | Static check of scripts (currently `node --check` on `scripts/*.mjs`) |
| `npm run check` | One-command gate: `test && typecheck && build && lint && verify` |
| `npm run preview` | Serve the production build |

## Architecture (this repo)

- `src/state/core.ts` — **pure deterministic core** (seeded RNG, particle sim).
  No Pixi/bitECS imports; unit-tested in Node (`tests/state.test.ts`).
- `src/ecs/world.ts` — bitECS component/entity layer that drives the pure core.
- `src/scenes/ParticleGalaxy.ts` — demo scene: fixed-timestep ECS sim rendered
  by PixiJS sprites.
- `src/core/*` — Application + Viewport (proven pattern).
- Layer order (fixed): `backgroundLayer` → `effectsLayer` → `sceneLayer` →
  `uiLayer`. Sim logic never lives in render code.

Note: the starter's particle sim is a *minimal* example of the pure-core
pattern. The full serializable `GameState` + action-transition architecture is
demonstrated in the spawned game projects (e.g. the Asteroids game).

## Headless verification (no human eyes)

Headless pages report `document.hidden === true` → rAF throttled (~5-8 FPS) and
`extract.pixels()` returns zeros. **Do not trust FPS or extract readings from
headless.** Use screenshot sampling instead:

`npm run verify` is self-contained: it starts its own Vite server (ephemeral
port) and its own headless browser (ephemeral CDP port, read from the
browser's `DevToolsActivePort` file), runs the checks, then tears both down.
No manual dev server or browser launch needed, and it's safe to run alongside
an already-open `npm run dev`. Browser resolution tries `msedge` /
`microsoft-edge-stable` / `microsoft-edge` / `google-chrome-stable` /
`google-chrome` / `chromium-browser` / `chromium` in order; set
`VERIFY_BROWSER_PATH` if none of those resolve. `npm run verify <url> [port]`
attaches to an already-running server + browser instead, for manual
debugging.

`scripts/verify.mjs` checks boot (`window.__demo`), 1280×720 logical display,
contain-scale math, and that content actually renders (screenshot sampling).
CI runs this on every push (`.github/workflows/ci.yml`).

## Knowledge packs (docs/packs/)

Loaded by path trigger, never automatically. When touching a matching path,
suggest the pack and ask before loading:

| Pack | Load when touching |
| --- | --- |
| `state-authority-pack.md` | `src/state/**`, `src/ecs/**`, `src/scenes/**`, save/authority |
| `pixijs-lab-pack.md` | any render/input/asset/audio work |
| `qa-evidence-pack.md` | any story completion / refactor / bug fix |
| `kenney-assets` | any sprite/asset selection, game spec design, "what assets should I use" |

## Skills & templates

- `skills/` — reusable instruction packs (`verify`, `add-sprite`, `balance`, `kenney-assets`).
- `templates/` — prompt/spec/spritesheet templates for new games.
- `games/` — sandbox track uses LittleJS single-file (`games/sandbox-template`);
  production track spawns sibling projects via `npm run new-game -- <name>`.

## Sources (optional reading, not a dependency)

The operating model was adapted from the MIT-licensed AutoMagically repo and a
public AI-game-dev compendium; those sources live outside this repo and are not
required to work here.
