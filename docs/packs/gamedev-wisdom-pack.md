---
name: gamedev-wisdom
when: "Any gameplay mechanic, system, or AI/enemy-behavior design decision — before inventing a pattern from scratch."
triggers: "docs/SPEC.md, src/state/**, src/ecs/**, src/scenes/**, game design decisions"
---

# Gamedev Wisdom Pack

## When to use
Load at Frame/Expand, before committing to a mechanic or system shape. This is
**external prior art** distilled from a large Unity-tutorial corpus (Code
Monkey, ~855 videos, curated for portability) — not this lab's own rules. It
never overrides `state-authority-pack.md` or `pixijs-lab-pack.md`; it informs
design choices those packs don't cover. Use `skills/gamedev-wisdom/query.mjs`
for anything more specific than what's below — this pack is the top slice of
~1,700 core units, not the whole corpus.

## Patterns
- **Illusion over simulation.** Convincing AI/game feel beats accurate
  simulation — Half-Life 2's soldiers "predict" players via invisible priority
  targets, not real tactics. Perfectly accurate AI is often *less* fun to
  fight. Design the show, not the math.
- **Interfaces decouple interaction from object type.** One `Open/Close/Toggle`
  interface serves doors, buttons, levers, pressure plates — any togglable
  object drives the same interaction code. Generalize before duplicating.
- **Events decouple systems from their UI.** A health/ability/inventory system
  exposes change events (or a normalized read-only projection); UI subscribes
  and re-renders. The system never knows the UI exists.
- **State machines are the default for enemy/NPC behavior.** Idle → patrol →
  chase → attack (extend with sub-states for bosses). Keep logic per-state
  rather than one branching update function.
- **Rate-limit expensive per-frame queries.** Distance checks, overlap queries,
  targeting scans — run on a ~10Hz timer, not every frame. Cheap correctness
  loss, large perf win.
- **A\* costs are G (from start) + H (heuristic to goal) = F.** Use a binary
  heap for the open-list minimum, not a linear scan, once the grid is nontrivial.
- **Server-authoritative by default; pick the model per-feature.** Client-side
  prediction/authority is an explicit opt-in for feel-critical movement, never
  the default for anything that affects economy or other players.
- **Merge tightly-coupled entities into one prefab/object** (e.g. player +
  vehicle) rather than two linked objects — far easier to keep in sync,
  especially under multiplayer.
- **A polished small demo beats a large mediocre one.** Treat a ~30-minute
  vertical slice as a polish target in itself, not a preview of a bigger thing.

## Anti-patterns
- **Retrofitting multiplayer onto a finished single-player codebase.** Cost
  ranges from trivial to near-impossible depending on how coupled the original
  code is — this is a Frame-time decision (`state-authority-pack.md`), not a
  later one.
- **Coupling gameplay logic directly to input or UI.** If a system can't be
  driven by a test harness without touching input devices or DOM, it's not
  decoupled yet.
- **Trusting client-supplied values for anything irreversible** (economy,
  progression, competitive outcomes) — matches this lab's own server-authority
  rule exactly; the corpus independently arrived at the same conclusion.
- **Adding systems/polish beyond what the current scope needs.** The corpus's
  own framing: invest in solid core architecture early, but don't build for
  hypothetical future features — the same "no premature abstraction" instinct
  this lab already runs on.

## Checklist
- [ ] Checked `skills/gamedev-wisdom/query.mjs` for prior art before designing
      a nontrivial mechanic from scratch.
- [ ] Any pattern pulled from here cross-checked against this lab's own
      `AGENTS.md` rules — those win on conflict, always.
- [ ] AI/enemy behavior framed as "does this read as intentional to the
      player," not just "is this technically correct."

## References
`skills/gamedev-wisdom/` (query tool + full catalog) · source project's
`validation_report.md` (curation methodology + known limitations)

## Escalation
- Design taste calls (is this fun, is this the right mechanic) → user, never
  inferred from the corpus alone.
- Pattern conflicts with this lab's own architecture rules →
  `state-authority-pack.md`/`pixijs-lab-pack.md` win.
