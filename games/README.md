# games/ — one game per folder

Each game is a self-contained unit. Two tracks:

## Sandbox track (prototypes, jams, tiny games)

Single-file HTML. The whole game fits in one agent context — "Claude can hold an
entire game in context, iterate on one file, and the diff is always visible."

- `sandbox-template/` — LittleJS starter with a tiny example (open
  `index.html` directly, no build step).
- Rule: one self-contained `.html` per game; no bundler.

## Production track (anything that ships)

This app (`src/`) — Vite + TypeScript + PixiJS v8 + bitECS. Copy a game folder
pattern, wire it into `src/main.ts` as a scene, and keep the lab rules
(deterministic core, fixed timestep, verify harness, green gates).

## To add a game

1. Write `docs/SPEC.md` first (feel-first, scope to a vertical slice).
2. Sandbox: copy `sandbox-template/` → `games/<name>/index.html`.
   Production: add `src/scenes/<Name>.ts` + swap in `main.ts`.
3. Extend `scripts/verify.mjs` with a pixel sample of the new game's content.
4. `npm run test && npm run typecheck && npm run build && npm run verify`.
