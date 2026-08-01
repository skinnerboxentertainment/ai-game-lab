# Consort Model — Lab Operating Model

Adapted from the AutoMagically "Lean Consort Model"
(https://github.com/skinnerboxentertainment/automagically-refactored, MIT).
Design locked. Consensus between the human (lead) and the coding agent.

Three tiers of operating structure, not three tiers of agents.

```
TIER 0: ACTORS
  Lead (Orchestrator)      Agent (Builder)
  - Architecture           - Implementation
  - Workflow/integration   - Verification/tests
  - Final review           - Debugging, art generation
  - Decision log

TIER 1: RHYTHM
  7-Beat rhythm: Explore → Frame → Expand → Attack → Commit → Build → Prove
  Coordinated via production/active.md

TIER 2: KNOWLEDGE
  Knowledge packs in docs/packs/ — loaded by path trigger, never automatically
```

## Tier 0: The consort

| Role | Actor | Domain | Authority |
| --- | --- | --- | --- |
| **Orchestrator** | Human / lead session | Architecture, workflow, integration, final review | Owns the decision log + integration. Decides architecture, scope, repo governance |
| **Builder** | Coding agent | Implementation, verification, testing, debugging | Decides locally on implementation mechanics inside an approved design |

### Escalation ladder (when they disagree)

1. **Clarify** the disputed claim (design taste? feasibility? risk? scope?)
2. **Ask what evidence** would decide it (prototype? test? benchmark? user approval?)
3. **Prefer reversible** decisions when evidence is weak
4. **Require an ADR** for irreversible or architecture-shaping decisions
5. **User decides** on product goals, taste, scope, acceptable tradeoffs
6. **Orchestrator decides** on integration, architecture, repo governance
7. **Builder decides locally** on implementation mechanics inside an approved design

> Orchestrator owns the decision log — it does not win every argument.

## Tier 1: The 7-beat rhythm

| Beat | What happens | Leads | Artifact |
| --- | --- | --- | --- |
| Explore | Discover current reality | Orchestrator | Findings summary |
| Frame | Define desired outcome | Orchestrator | Goal + acceptance criteria |
| Expand | Generate approaches | Both | Trade-off notes |
| Attack | Stress-test leading approach | Builder | Risk list, blockers |
| Commit | Decide path + design contract | Orchestrator | Decision record + spec |
| Build | Implement + verify | Builder | Code, tests, verification results |
| Prove | Review, integrate, log | Orchestrator | Summary, event log, checkpoint |

### Coordination contract — `production/active.md`

```markdown
# Active Session
## Current Beat       (Explore | Frame | Expand | Attack | Commit | Build | Prove)
## Current Objective  one concrete outcome
## Active Packs       pack-name: why loaded
## Open Decisions     decision, owner, context
## Next Action        the next concrete thing
## Blockers           only real blockers
```

## Tier 2: Knowledge packs

Packs live in `docs/packs/`. Loaded by path-trigger match, NEVER automatically:

```
Touched: src/ecs/**
Suggested packs:
  - state-authority
  - pixijs-lab
Load one? Or continue without?
```

Pack format (frontmatter + sections, in order):

```yaml
---
name: pack-name
when: "one-sentence scope"
triggers: "path globs / file types that should pull this pack in"
---
# <Pack Title>
## When to use     — load EARLY (Frame/Commit), not after building
## Constraints     — hard rules, boundaries (6-12 bullets)
## Patterns        — named approaches, each **Bold**: description
## Anti-patterns   — named failure modes (mirror of constraints)
## Checklist       — binary pass/fail the agent can literally run
## References      — source docs/skills + related packs
## Escalation      — which conflicts go up, which sibling packs to pull
```

Pack composition rule: each pack names its sibling packs in `Escalation`.

## Project brain (durable memory)

Three files, one job each, zero ceremony:

| File | Purpose | Format |
| --- | --- | --- |
| `production/active.md` | Current operational state | ~20-line structured checkpoint, rewritten each milestone |
| `production/events.md` | Chronological log | Dated append-only entries |
| `docs/architecture/adr/` | Durable decisions | Numbered ADRs (`0001-title.md`) |

ADR format (context, decision, rationale, consequences, rejected alternatives,
**and validation criteria** — how you'll know the decision worked):

```markdown
# ADR-0001: Title
**Date:** YYYY-MM-DD
**Status:** Accepted | Proposed | Superseded
## Context / ## Decision / ## Rationale / ## Consequences
## Rejected Alternatives   — and why each was rejected
## Validation              — how we'll know this worked
```

`active.md` is read first after any disruption (new session, context loss).
`events.md` makes progress reconstructable. ADRs are the only file with a template.

## Collaboration protocol

- **User-driven, not autonomous execution.** Agents propose; the user decides.
- Propose **2-4 options with trade-offs** and a recommendation; user chooses.
- Multi-file / architecture changes require approval of the full changeset.
- **No commits without explicit user instruction.**
- Reversible choices for weak evidence; ADR only for irreversible decisions.

## Why this model (vs. a fleet of agents)

| Aspect | 36-agent studio | Lean consort |
| --- | --- | --- |
| Agent count | 36 named agents | 2 actors |
| Knowledge | Bound to personas | Structured packs, composable |
| Coordination | Director gates | `active.md` |
| Memory | Session state file | `active.md` + ADRs + events |
| Loading | Everything always available | Packs loaded on demand |

Source for the full design: the AutoMagically repo (MIT). The deprecated
36-agent/77-command scaffolding was deliberately not ported.
