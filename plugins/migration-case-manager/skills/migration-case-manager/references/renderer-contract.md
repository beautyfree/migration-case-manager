# Read-only renderer contract

The renderer consumes a v2 case folder and derived reports. Markdown remains authoritative; deleting the renderer output must lose no case data.

## Inputs

- Numbered case Markdown files, excluding `evidence/`, `.migration-os/`, and raw provider/resilience private material unless explicitly selected by the user.
- Derived `99-dashboard.md` may be regenerated, never edited as source.

## Required views

1. **Readiness**: blockers, actions needing a person, source freshness, and document quality/timing gaps.
2. **Timeline**: deadlines, milestones, appointments, and landing lane from `move_date`.
3. **Route graph**: `ROUTE-*` → `REQ-*` → `DOC-*` / `ACT-*` / `DEC-*` links, including conflicts and unknown conditions.
4. **Landing board**: housing, insurance, connectivity, transport, cash, banking, and resilience branches.

## Invariants

- No edit controls, authentication, network fetch, evidence viewer, or secret-bearing state.
- Use IDs as keys and preserve links to their source file/heading.
- Unknown stays visible; never use a visual default as a legal conclusion.
- Renderer output is disposable and must be reproducible from the same case folder.

## Bidirectional editing evaluation

**Decision: do not implement it in this plugin.** The current evidence establishes read-only inspection needs, not a safe editor. Markdown round-trip, concurrent-edit conflict handling, auditable mutations, and consent-aware changes have not been proven. A future editor needs a separate proposal and tests for all four; until then, edits stay in the numbered Markdown source files.
