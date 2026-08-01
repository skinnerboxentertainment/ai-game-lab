# Skill: balance (tuning that fights AI's "fair and smooth" default)

AI's default balance instinct is flat fairness — which reads as dead. You must
inject risk curves, decay, and imperfection.

## Steps
1. Define every feature's use cases + edge cases BEFORE prompting, and hand the
   AI a **parameter table** (success chance by level, cost/rarity curves) —
   never "build an enchant system".
2. Reject flat curves by default. If the genre runs on spikes, say so explicitly.
3. Iterate on FEEL, not bugs: play it, write down what felt wrong *emotionally*,
   and prompt with emotional intent ("the player should feel a moment of panic
   when enemies spawn"), not numbers.
4. Instrument from day one (telemetry events + remote-config A/B) so balance
   becomes data, not vibes.
5. Gate: run headless playouts / seed-based simulations before shipping balance
   changes; a sim that plays 100k games finds broken combos a human never sees.

## Watch-outs
- "AI is terrible at anything that's based on 'taste' rather than logic."
- Difficulty should come from "director" constraints (target-repeat limits,
   forgiving early turns, escalating pressure) — not random numbers.
- "Visual feedback > visual effects, otherwise it'll flood your screen with
   horseshit." Hit-freeze, time-dilation, trails, not explosions.
