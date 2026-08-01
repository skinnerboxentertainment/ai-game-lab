---
name: state-authority
when: "Any work touching simulation state, save/load, scenes, or client/server authority."
triggers: "src/state/**, src/ecs/**, src/scenes/**, save*, authority*, netcode"
---

# State & Authority Pack

## When to use
Load EARLY (Frame/Commit), before the feature is designed — decide how state is
owned and how it will be tested before building it.

## Constraints
- Simulation state lives in plain data/pure functions (`src/state/`); PixiJS
  display objects are disposable mirrors. **Never store gameplay on sprites**
  (`sprite.health` is forbidden).
- No module reads/writes state or calls the RNG except the simulation core.
- One serializable `GameState`; pure `(state, action, seededRng) -> newState`;
  fixed timestep so stepping is deterministic regardless of frame rate.
- Persistent state gets `toJSON()`/`fromJSON()`; never save by walking the
  scene graph.
- Server-authoritative for any economy/progression/irreversible outcome. Treat
  every client write as hostile. Never reuse a seed across scopes.
- Resource cleanup is a contract: document who owns a returned resource and how
  to release it; never rely on GC for renderer/audio/DOM resources.
- No `Date.now()` / `performance.now()` / `requestAnimationFrame` inside core
  logic (test doubles + fake clocks instead).

## Patterns
- **State/render separation:** gameplay owns plain state; visuals sync from it;
  the scene graph can be destroyed and rebuilt without losing simulation.
- **Layer dependency rule:** dependencies point inward — `core/` never imports
  scenes/UI; UI consumes read-only projections/events, never mutates gameplay.
  Boundary reversal is an escalation trigger, not a refactor.
- **Scene lifecycle:** stack-managed `enter()`/`update(dt)`/`exit()`; `exit()`
  destroys children, unsubscribes listeners, stops scene-owned audio.
- **Single update loop:** one top-level ticker callback (input → scenes → audio →
  diagnostics); fixed-step accumulation only for determinism-critical
  subsystems, isolated behind core timing.
- **Faucets/sinks & snapshots:** map economy flows; archive history as immutable
  snapshots, never references to live rows.

## Anti-patterns
- Mirroring logic client+server ("not a real single source of truth").
- Saving by scene-graph traversal; storing state on render objects.
- Client-authoritative settlement; trusting `origin`/client-supplied values.
- Vibe-coded RNG (seed reuse across scopes) — the classic invisible bug.

## Checklist
- [ ] State is plain data; render objects contain no gameplay.
- [ ] One pure core; fixed timestep; deterministic test exists.
- [ ] Authority boundary decided in writing BEFORE UI.
- [ ] Cleanup contracts documented; scene `exit()` releases everything.
- [ ] No RNG/`Date.now` leaks outside the core.

## References
`docs/ARCHITECTURE.md` · `src/state/core.ts` · `tests/state.test.ts`

## Escalation
- Authority conflicts → orchestrator + ADR (irreversible).
- Performance of hot paths → pull `pixijs-lab` pack.
- Testing questions → pull `qa-evidence` pack.
