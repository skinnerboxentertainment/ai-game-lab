# Events — chronological log

## 2026-08-01
- Scaffolded the lab from the blueprint: two tracks (LittleJS sandbox + PixiJS/bitECS production), governance, determinism test, verify harness.
- All green: test 5/5, typecheck, build, headless verify 7/7.
- Pinned bitecs to 0.3.x (0.4.0 is a full API rewrite; upgrade deliberately with tests).
- Adopted the Consort Model + project brain (active.md / events.md / ADRs) from the AutoMagically repo (MIT).
- Distilled AutoMagically's 56-chunk knowledge base into docs/packs/: state-authority, pixijs-lab, qa-evidence.
- Git checkpoint: initialized repo, initial commit of the lab scaffold (see ADR-0001).
- **Workshop reorg (Option A):** lab is now a read-only workshop. Added
  `scripts/new-game.mjs` + `npm run new-game -- <name>` which spawns a brand-new
  production-track project as a sibling repo (own git, package.json, src, tests,
  verify, governance brain). Lab gates green (test 5/5, typecheck, build).
- **First spawned game: Asteroids** at `C:\Users\oscar\AI WORKBENCH\asteroids`
  (git init'd, npm install'd, gates green). Demo spec moved from the lab to
  `asteroids/docs/SPEC.md`; the game's 7-beat rhythm continues there.
- **Lab hardening (external audit, 10 findings, all verified):**
  - Sandbox template fixed: `gameInit() {` syntax error + `engineInit()` called
    with no callbacks + `new Particle(...)` misuse → proper function
    declarations, `engineInit(gameInit, gameUpdate, gameUpdatePost)`, and a
    real `ParticleEmitter` burst.
  - `new-game.mjs` rewritten: game-specific `AGENTS.md` template (no lab-workshop
    wording, no `new-game` command), only `scripts/verify.mjs` copied (generator
    no longer leaks into games), transactional stage→rename (no partial dirs),
    both `--out DIR` and `--out=DIR` forms.
  - Lab `AGENTS.md` made self-contained (removed `../ArcadeDemosceneTest`
    hard dependency); README updated to match.
  - Added `lint` (`node --check` on scripts + sandbox inline script) and the
    one-command `npm run check` gate.
  - Viewport letterbox now `clear()`s before redraw (no geometry accumulation).
  - New tests: `tests/sandbox.test.ts` (template validity) and
    `tests/harness.test.ts` (containScale, accumulator, ECS/core equivalence,
    generator output). Added `@types/node` + `src/core/containScale.ts` +
    `src/core/fixedstep.ts`.
  - Reconciled `production/active.md` + `docs/handoff.md` drift.
  - Gate green: test 21/21, typecheck, build, lint, headless verify 7/7.

