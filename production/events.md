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

## 2026-08-13
- **ADR-0002: CI + self-contained verify.** Rewrote `scripts/verify.mjs` to
  own its full lifecycle — in-process Vite server on an ephemeral port,
  headless browser launched by the script itself (binary resolved from
  `msedge`/`microsoft-edge`/`google-chrome`/`chromium` candidates, CDP port
  read from the browser's own `DevToolsActivePort` file), teardown in a
  `finally`. No more manual "start dev server, hand-launch Edge on :9222"
  steps. `verify` folded into `npm run check`.
  - Found and fixed a real teardown race during Build: `rmSync` on the
    browser's temp profile dir raced `taskkill`, causing EBUSY crashes on
    Windows. Fixed by awaiting the process's actual `exit` event before
    removing its directory, plus `rmSync` retries as a safety net.
  - Added `.github/workflows/ci.yml` (checkout, setup-node reading
    `engines.node` from `package.json`, `npm ci`, `npm run check`) on
    `ubuntu-latest`. Added `engines.node` to `package.json`.
  - `new-game.mjs` now copies `.github/workflows` into every spawned game
    (added to `sharedDirs`); `tests/harness.test.ts` asserts the generated
    project has its own `ci.yml`.
  - Updated the now-stale manual-verify instructions in `AGENTS.md`,
    `skills/verify.md`, `README.md`, `GETTING_STARTED.md`.
  - Gate green: test 22/22, typecheck, build, lint, self-contained verify
    7/7 — confirmed on two independent runs (not flaky after the teardown
    fix).
  - **Not yet verified:** the GitHub Actions workflow itself has never run —
    nothing has been pushed. ADR-0002 stays "Proposed" until it goes green
    on a real push.
- **Independent audit (DeepSeek) of the above, blocker found + fixed.** Given
  the change summary + full diff, the audit caught a real blocker missed
  during Build: the copied `ci.yml` runs `npm run check`, but
  `new-game.mjs` deleted `check` from every spawned game's `package.json` —
  every game spawned since would fail CI immediately with `npm error
  Missing script: "check"`. Confirmed by spawning a throwaway game and
  inspecting it directly.
  - Fixed: `new-game.mjs` now writes a game-appropriate `check` script
    (`test && typecheck && build && verify`, no `lint`).
  - Also fixed from the same audit: stale `README.md` template text in
    `new-game.mjs`; missing `error` listener on the spawned browser process
    (a spawn failure previously crashed outside `try`/`finally`, skipping
    cleanup); no timeout on CDP commands or the initial CDP `/json` fetch
    (a hang could stall the gate — now CI — indefinitely); POSIX teardown
    used bare `proc.kill()` instead of killing the whole process group
    (risk of orphaned Chromium children on Linux/macOS CI).
  - `tests/harness.test.ts` gained real regression guards: a static check
    that the generated `check` script doesn't reference `lint`, and — per
    the audit's own recommendation — an assertion that actually **runs**
    the generated project's test script, not just checks it exists.
  - Re-verified end-to-end: spawned a fresh game, ran `npm install` for
    real, then `npm run check` (test + typecheck + build + the
    browser-launching verify step) in that project. All green — the
    strongest evidence available short of an actual GitHub Actions run.
  - Lab gate re-confirmed green: test 27/27 (harness suite grew), typecheck,
    build, lint, verify 7/7.
  - ADR-0002 updated with an audit-note addendum; status remains "Proposed"
    (GitHub Actions still hasn't executed for real — that's the one
    remaining true gap).
- **Pushed. First real CI run failed** (`31704002178`, commit `2a9a1af`):
  `verify harness error: timed out waiting for the browser's DevTools port`.
  Root cause (found via a second independent audit pass): GitHub's
  `ubuntu-latest` (Ubuntu 24.04) runners restrict unprivileged user
  namespaces via AppArmor, breaking Chromium's sandbox init — the browser
  exits before DevTools opens. The old harness gave zero diagnostic detail
  (no stderr capture), just a blind timeout.
  - Fixed (commit `5fa2800`): `--no-sandbox` (safe — throwaway profile,
    localhost-only content), browser stderr captured to a log file, fail-fast
    on early browser exit with exit code + stderr tail surfaced, timeout
    bumped 10s → 20s for CI cold starts.
  - Verified locally (green) and the new failure path itself proven (pointed
    `VERIFY_BROWSER_PATH` at a non-browser binary → fast, clear error instead
    of a hang).
  - Re-pushed. **Second real CI run passed** (`31704935262`, commit
    `5fa2800`): verify 7/7 on a real `ubuntu-latest` runner — confirmed by
    reading the actual step log, not just the run's conclusion.
  - **ADR-0002 flipped to Accepted.** All three original validation criteria
    now met with real evidence: self-contained verify runs clean locally,
    spawned games get a working gate (proven via a real `npm install` +
    `npm run check`), and GitHub Actions itself is green.

## 2026-08-13 (continued)
- **ADR-0003: serializable GameState + action-transition pattern for the
  starter demo.** The lab's own demo (`ParticleGalaxy`) didn't demonstrate
  the pattern its own `AGENTS.md`/`ARCHITECTURE.md` claim — no `GameState`
  object (bare `Particle[]`), no actions, no input at all, and an RNG that
  was a non-serializable stateful closure. Since `new-game.mjs` copies
  `src/` verbatim, every future spawned game inherited that gap too.
  Three incremental slices, each independently gated, per the ADR.
  - **Slice 1 (this session): pure, serializable RNG.** Rewrote
    `src/state/rng.ts`: stateful closure → plain `{ a: number }` state +
    pure `nextRandom(state) -> [value, newState]` / `nextRange(...)`.
    Updated `seedParticles` in `src/state/core.ts` (only caller) to thread
    state through instead of mutating a closure. Same algorithm
    (mulberry32), same output sequence for a given seed — this is a
    representation change, not a behavior change.
    - New tests: RNG state round-trips through a JSON serialize/deserialize
      mid-sequence (resuming continues identically to never pausing);
      `nextRandom` doesn't mutate its input.
    - Gate green: test 24/24 (was 22), typecheck, build, lint, verify 7/7.
  - Next: Slice 2 (`GameState` wrapper + `toJSON`/`fromJSON`, tested via
    round-trip), then Slice 3 (one action + `scripts/verify.mjs`
    extension).
  - **Slice 2: `GameState` wrapper + serialization.** Added `GameState`
    (`{ version, seed, rngState, tick, particles }`), `createGameState`,
    `stepState`, `toJSON`/`fromJSON` to `src/state/core.ts`. Extracted
    `spawnParticle` as a shared internal primitive so `seedParticles` (kept,
    existing callers/tests untouched) and `createGameState` don't duplicate
    spawn logic. Rebuilt `simulate()` on top of `createGameState`/
    `stepState` instead of its own parallel spawn+step loop — one code path,
    not two. Deliberately core-layer only: `ParticleGalaxy`/`ecs/world.ts`
    untouched, live demo behavior unaffected (verify still 7/7).
    - New tests: a real `JSON.stringify`/`toJSON`/`fromJSON`/`JSON.parse`
      round-trip mid-simulation is bit-identical to uninterrupted
      simulation; `stepState`/`toJSON` don't mutate their input.
    - Gate green: test 26/26 (was 24), typecheck, build, lint, verify 7/7.
    - Next: Slice 3 — one `SPAWN_BURST` action, wired to a click in
      `ParticleGalaxy`, with `scripts/verify.mjs` extended to prove it.
  - **Slice 3: one action, wired to a real click, verified end-to-end.**
    Added `SpawnBurstAction`/`applyAction(state, action) -> newState` to
    `src/state/core.ts` — the only place besides `createGameState` that
    consumes the RNG, using a genuinely distinct spawn rule (fixed point,
    fast outward velocity) rather than relabeling the ambient-spawn logic.
    `applyAction` takes 2 args, not the docs' literal 3 (`state, action,
    seededRng`) — `rng` already lives inside `state.rngState` since
    Slice 1/2, so a separate third parameter would just restate it;
    documented inline why.
    - `ParticleGalaxy` now holds a `GameState` (via `createGameState`
      instead of `seedParticles`) and dispatches `SPAWN_BURST` on click,
      using Pixi's own event system (`eventMode`/`hitArea`/`on`) per
      `pixijs-lab-pack.md`'s "no raw DOM listeners" rule — verified the
      actual v8 API (`getLocalPosition`, `eventMode`, `hitArea`) against
      the installed package's type defs before writing it, not from
      memory. Per-frame continuous stepping stays ECS-owned (`stepAll`,
      unchanged) — `state.particles` tracks spawn history, not live
      position, an intentional, documented, minimal-footprint split rather
      than migrating the whole render-driving mechanism.
    - `scripts/verify.mjs` extended: dispatches a real CDP click at the
      logical-stage center and asserts the scene's sprite count increased
      by exactly `BURST_COUNT` — proof the whole chain (CDP → Pixi event
      system → `applyAction` → new sprites) works in the live app, not
      just in unit tests. Confirmed non-flaky across two runs.
    - New tests: `applyAction` is pure, appends exactly `count` particles
      at the click point, advances the RNG, and is deterministic
      (same state + action -> identical result).
    - Gate green: test 28/28 (was 26), typecheck, build, lint, verify 8/8
      (including the new click-dispatch check, `before=140 after=160`).
  - **ADR-0003 complete, locally.** Not yet pushed for a real CI
    confirmation — that's the next step, same discipline as ADR-0002.

