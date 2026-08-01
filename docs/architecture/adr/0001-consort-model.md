# ADR-0001: Adopt the Consort Model

**Date:** 2026-08-01
**Status:** Accepted

## Context
The lab was a single-agent scaffold. As it grows, we need a repeatable operating
rhythm and durable memory across sessions, plus a way to apply distilled domain
knowledge without re-explaining it. The AutoMagically "Lean Consort Model"
provides a proven, minimal version of all three.

## Decision
Adopt the two-actor consort (orchestrator + builder), the 7-beat rhythm
(Explore → Frame → Expand → Attack → Commit → Build → Prove), the project brain
(`production/active.md`, `production/events.md`, `docs/architecture/adr/`), and
path-triggered knowledge packs (`docs/packs/`). See `docs/CONSORT_MODEL.md`.

## Rationale
- Two actors + explicit escalation beats a fleet of personas (the 36-agent model
  was deprecated upstream for routing overhead and premature specialization).
- The three-file brain is lower ceremony than machine-readable session tracking.
- Pack format (constraints/patterns/anti-patterns/checklist) matches how we
  already run the lab: rules + named failure modes + binary checklists.

## Consequences
- Enables: durable continuity across sessions; knowledge reused via path-trigger
  loading; decisions recorded with validation criteria.
- Constrains: multi-file changes require approval; no commits without user
  instruction; packs are never auto-loaded.

## Rejected Alternatives
- **Single mega-AGENTS.md:** the whole knowledge base inline — too much context,
  no path-triggered relevance.
- **Port the 36-agent hierarchy / 77-command surface:** process scaffolding for a
  tool we don't run; the domain knowledge is preserved in the packs instead.

## Validation
- We will know this worked when: (1) two consecutive sessions resume from
  `active.md` with no re-explanation; (2) at least one game is produced end-to-end
  through the 7-beat rhythm with an event log entry per beat; (3) the qa-evidence
  pack's verification gate is enforced (no "done" without passing the gate).
