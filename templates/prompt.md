# Prompt template — spec → execute

Use this chain. The `.md` file is the inter-agent protocol.

## 1. Spec (write in docs/SPEC.md)

> Build: [one concrete thing].
> Architecture: fit it into [system], following [pattern], respecting
> [constraint]. Never touch [files outside ownership].
> Feel: the player should feel [emotion].
> Numbers: [parameter table].
> Anti-goals: [explicitly NOT doing].
> Verify: [acceptance tests] + `npm run test && npm run typecheck && npm run build`
> and the smoke scene must pass.

## 2. Question-shaped prompts (better than demands)

- "How does X currently work? Can we trace it?"
- "Based on how it works, is it safe and effective to do Y?"
- (Not: "make me X".)

## 3. Diagnose, then prompt

Vague feel complaint → nothing. Precise symptom → one-pass fix:
- Bad: "melee feels dead."
- Good: "the enemy has no visible reaction and hitstop only fires on kills."

## 4. Session opener (for every fresh chat)

> Read PROJECT_NOTES.md and AGENTS.md before doing anything. Today: [one task].
> This is what I want: [spec]. Confirm your plan before writing code. If
> something has broken twice or hasn't fixed in two tries, stop and think before
> retrying. After finishing, update PROJECT_NOTES.md with what changed.
