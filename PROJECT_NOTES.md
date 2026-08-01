# PROJECT_NOTES — session memory

Every session: read this first, and append a note when you finish.

## What this is

The lab (production-track starter + sandbox template). Synthesized from the
r/aigamedev compendium; the operating rules live in `AGENTS.md`.

## What exists (done)

- [x] Vite + TS + PixiJS v8 + bitECS production-track starter.
- [x] Deterministic pure state core (`src/state/`) with Node test.
- [x] Fixed-timestep ECS demo scene (`ParticleGalaxy`, `?seed=`).
- [x] Responsive viewport (1280×720 logical, renderer-screen CSS-px math).
- [x] Headless verify harness (`scripts/verify.mjs`).
- [x] Sandbox template (`games/sandbox-template/`, LittleJS single-file).
- [x] Governance: AGENTS.md, docs/, skills/, templates/.
- [x] Consort Model adopted (two actors + 7-beat rhythm + packs + project brain).
- [x] Knowledge packs distilled from AutoMagically (MIT):
      state-authority, pixijs-lab, qa-evidence.
- [x] Project brain: production/active.md, production/events.md,
      docs/architecture/adr/0001-consort-model.md.

## Session memory

Current operational state lives in `production/active.md` (read first); history
in `production/events.md`; durable decisions in `docs/architecture/adr/`.

## Decisions made (do not re-derive)

- Sim steps on a fixed timestep (1/60) for determinism regardless of FPS.
- All simulation math lives in `src/state/core.ts` (pure, no Pixi/bitECS);
  the ECS layer only stores/iterates entity components and calls the core.
- Renderer pinned to WebGL; GLSL-only shaders are allowed but no WGSL this round.

## Open questions / next steps

- [ ] Wire CI (GitHub Actions: typecheck + test + build on push) — for the lab and spawned projects.
- [ ] Add an art pipeline example (green-screen → snapper → Aseprite) to skills/.
- [x] First game: Asteroids — spawned to `../asteroids` (sibling repo, own codebase).

## Handoff note (most recent session)

Reorganized the lab into a **read-only workshop**: `npm run new-game -- <name>`
spawns a brand-new production-track project as a sibling repo (own git,
package.json, src/, tests/, verify). Asteroids spawned to
`C:\Users\oscar\AI WORKBENCH\asteroids`, demo spec moved in. The lab's own
codebase is never edited by a game.
