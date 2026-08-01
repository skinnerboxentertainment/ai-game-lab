---
name: qa-evidence
when: "Any story/feature completion, refactor, bug fix, or performance change."
triggers: "**/*.test.*, scripts/verify.mjs, tests/**, **/*.ts"
---

# QA & Evidence Pack

## When to use
Load at Frame (decide how the story will be tested BEFORE building — shift-left)
and at Prove (run the gate). Testing evidence is **Definition of Done**.

## Constraints
- **Verification gate is non-negotiable and symmetric:** `tsc --noEmit` zero
  errors + full test suite; new passing tests do NOT excuse old regressions.
  Up to 3 fix-and-rerun attempts; never proceed silently past a failure.
- Evidence by story type (see Patterns) — a Logic story marked done without
  tests is a blocker.
- No `@ts-ignore`/`@ts-expect-error`; strict mode; `unknown` over `any`.
- Every bug fix ships a regression test that would have caught the failure.
- Performance budgets measured, not guessed; profile before/after with recorded
  numbers.

## Patterns
- **Testing pyramid:** ~80% unit tests on deterministic logic (state, formulas,
  save/load, seeded RNG); integration for lifecycle/input/audio/resize; browser
  tests only for startup/canvas/input/pause-resume; visual tests only for stable
  contracts (menu, HUD, game-over) — never animation or nondeterministic content.
- **Evidence-gate classification:**
  - **Logic** → unit tests required (blocking).
  - **Integration** → integration test or documented playtest.
  - **Visual/Feel** → screenshot + lead sign-off in `production/qa/evidence/`.
  - **UI** → walkthrough/interaction test.
  - **Config/Data** → smoke pass.
- **Headless verify (no human eyes):** headless `document.hidden` throttles FPS
  and zeroes `extract.pixels()` — trust screenshot sampling
  (`scripts/verify.mjs`), never headless FPS/extract readings.
- **Test naming:** `test_[system]_[scenario]_[expected_result]`; arrange/act/
  assert; formula coverage = normal, zero/null, max, negative modifier, edge
  cases; binary pass criteria, never "feels snappy."
- **Determinism as leverage:** seeded RNG + pure core = replay any run, headless
  playouts, Monte-Carlo seeds in CI.

## Anti-patterns
- "I looked at it manually" closing a Logic story.
- Green on the touched file while the suite regresses.
- Tests after the logic has spread across render/hooks/UI (tests need pure
  functions exposed first).
- Frame-perfect assertions on animation; visual tests on nondeterministic content.

## Checklist
- [ ] Gate: tsc clean + full suite green + build + smoke scene.
- [ ] Story evidence type decided at Frame; evidence recorded at Prove.
- [ ] Regression test for every bug fix.
- [ ] Hot paths profiled with numbers (before/after).
- [ ] Headless verify passes (`npm run verify`).

## References
`scripts/verify.mjs` · `tests/state.test.ts` · `skills/verify.md`

## Escalation
- Blocking test failures → orchestrator; never silently waive the gate.
- Determinism questions → pull `state-authority`.
- Perf regressions → record numbers, then pull `pixijs-lab` for render-side.
