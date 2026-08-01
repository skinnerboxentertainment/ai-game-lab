# SPEC — template

Fill this in BEFORE writing code. Empty your brain into it. Describe feelings,
not just mechanics ("the player should feel a moment of panic when enemies
spawn" beats "increase enemy spawn rate").

## Game / feature

- **Working title:** …
- **One sentence:** …
- **Core loop (feel):** prepare → risk → act → face consequences → adapt
- **Player emotion to hit:** …

## Scope (vertical slice first)

- Must-have (the slice): …
- Should-have: …
- Anti-goals (explicitly NOT doing): …

## Mechanics

| System | Behavior (feel-first) | Numbers/formulas (if known) |
| --- | --- | --- |
| … | … | … |

## State & authority

- One `GameState` object? Yes. Pure `(state, action, seededRng) -> newState`.
- What is run-scoped vs persistent?
- Any client/server authority boundary? Decide BEFORE the UI.

## Acceptance criteria (tests BEFORE implementation, in `tests/`)

- [ ] …
- [ ] Deterministic: same seed + same actions → identical outcome.
- [ ] `npm run test && npm run typecheck && npm run build` pass.

## Open questions

- … (things to ask the AI/community, not guess)
