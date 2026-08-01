# games/ — one game per folder

Each game is a self-contained unit. Two tracks:

## Sandbox track (prototypes, jams, tiny games)

Single-file HTML. The whole game fits in one agent context — "Claude can hold an
entire game in context, iterate on one file, and the diff is always visible."

- `sandbox-template/` — LittleJS starter with a tiny example (open
  `index.html` directly, no build step).
- Rule: one self-contained `.html` per game; no bundler.

## Production track (anything that ships)

Games are **spawned as brand-new sibling projects** — never built in the lab.

```bash
npm run new-game -- <name>
# -> ../<name>   (own repo, own package.json, own src/tests/verify)
```

The lab is a read-only workshop: it holds the starter (single source of truth),
governance, skills, templates, and the verify harness. Each spawned project gets
its own git repo and codebase.

## To add a game

1. Write `docs/SPEC.md` first (feel-first, scope to a vertical slice) — in the
   spawned project, or draft it in the lab and move it across.
2. Sandbox: copy `sandbox-template/` → `games/<name>/index.html`.
   Production: `npm run new-game -- <name>` (from the lab), then work in the
   spawned project.
3. Extend `scripts/verify.mjs` with a pixel sample of the new game's content.
4. `npm run test && npm run typecheck && npm run build && npm run verify`.
