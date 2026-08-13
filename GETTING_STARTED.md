# Getting Started

This lab is a **read-only workshop** for making games with AI. It holds the
starter (single source of truth), governance, skills, and templates. Games are
**spawned as brand-new sibling projects** — the lab's codebase is never edited
by a game.

Start every session by reading `production/active.md`.

## Prerequisites

- Node 20+ and npm
- Git
- Edge (Chromium) for the headless verify harness
- GitHub CLI (`gh`) if you want to publish a spawned game

## 1. Run the lab demo

```bash
npm install
npm run dev        # http://localhost:5173 (Particle Galaxy demo, ?seed=1337)
```

Confirm the machine works before building anything:

```bash
npm run check      # test && typecheck && build && lint && verify — must be green
```

## 2. Pick a track

| Track | Stack | Use for | Path |
| --- | --- | --- | --- |
| Sandbox | Single-file HTML + LittleJS | Prototypes, jams, tiny games | `games/sandbox-template/` (open `index.html` directly) |
| Production | Vite + TypeScript + PixiJS v8 + bitECS | Anything that ships | `npm run new-game -- <name>` |

Rule: one self-contained `.html` per sandbox game, no bundler.

## 3. Production track — spawn a game

```bash
npm run new-game -- <name>          # -> ../<name> (own git repo, own codebase)
npm run new-game -- <name> --out D:\games
```

The generator is transactional: it stages, validates, then renames into place.
A failure never leaves a half-built project. Inside the spawned project:

```bash
cd ../<name>
npm install
npm run dev
```

Each spawned project gets its own `AGENTS.md`, `production/` brain, knowledge
packs, skills, templates, and `scripts/verify.mjs` — but never the generator.

## 4. Run the 7-beat rhythm

Work happens in the spawned project, coordinated through its
`production/active.md`. The rhythm: **Explore → Frame → Expand → Attack →
Commit → Build → Prove**.

1. **Spec first.** Write `docs/SPEC.md` before code — feel-first, scope to a
   vertical slice. See `templates/prompt.md` for the spec → execute chain.
2. **Load the right pack at Frame**, not after building: `state-authority`
   (state/save/authority), `pixijs-lab` (render/input/assets), `qa-evidence`
   (how this story gets tested).
3. **Commit** the design contract, then **Build**.
4. **Prove** with the gate + evidence, and append to `production/events.md`.

## 5. The verification gate (non-negotiable)

After every change:

```bash
npm run check
```

Rules that keep it honest:

- A Logic story marked done without tests is a blocker.
- Every bug fix ships a regression test that would have caught it.
- Never trust headless FPS or `extract.pixels()` readings — only the
  screenshot-sampling checks in `scripts/verify.mjs`.
- Extend `scripts/verify.mjs` when you add features: boot check, geometry, and a
  pixel sample of the new content.

## Where to go next

- `docs/CONSORT_MODEL.md` — the full operating model (actors, escalation ladder, packs)
- `docs/packs/` — knowledge packs, loaded by path trigger
- `skills/` — verify, add-sprite, balance, kenney-assets
- `games/sandbox-template/` — the LittleJS sandbox starter
- `docs/ARCHITECTURE.md` — the ≤1-page constitution for a game project
