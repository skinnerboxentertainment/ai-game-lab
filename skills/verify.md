# Skill: verify (headless backpressure)

Run after ANY change, before declaring done. Do not trust "it looks fine".

## Trigger
User says "verify", "is it green", or after any meaningful change.

## Steps
1. `npm run check` — runs test, typecheck, build, lint, and verify in one
   command.
2. Must print `All checks passed`. `npm run verify` alone is self-contained
   too: it launches its own Vite server and headless browser and tears both
   down when done — no manual dev server or browser launch needed.

## Rules
- Headless FPS and `extract.pixels()` readings are meaningless (hidden tab).
  Only the screenshot-sampling checks in `scripts/verify.mjs` are trusted.
- Extend `scripts/verify.mjs` when adding features: boot check, geometry math,
  and a pixel sample of the new content.
- If no supported browser is found, set `VERIFY_BROWSER_PATH` to an explicit
  binary (see the search order in `scripts/verify.mjs`'s header comment).
