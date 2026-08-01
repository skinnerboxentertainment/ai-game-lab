# Skill: verify (headless backpressure)

Run after ANY change, before declaring done. Do not trust "it looks fine".

## Trigger
User says "verify", "is it green", or after any meaningful change.

## Steps
1. `npm run typecheck` and `npm run test` — fix failures first.
2. `npm run build`.
3. Start dev server (`npm run dev`) and headless Edge on :9222 (see AGENTS.md).
4. `npm run verify` — must print `All checks passed`.

## Rules
- Headless FPS and `extract.pixels()` readings are meaningless (hidden tab).
  Only the screenshot-sampling checks in `scripts/verify.mjs` are trusted.
- Extend `scripts/verify.mjs` when adding features: boot check, geometry math,
  and a pixel sample of the new content.
