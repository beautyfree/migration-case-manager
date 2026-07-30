# Case format

Use this contract for every migration case. Markdown is authoritative; all generated material is disposable.

## Files and ownership

| File | Owner | Purpose |
| --- | --- | --- |
| `00-case.md` | orchestrator | route, scope, current status |
| `10-profile.md` | intake | facts, participants, protected unknowns |
| `20-requirements.md` | research | source-backed requirement graph |
| `30-documents.md` | documents | document inventory and evidence links |
| `40-actions.md` | actions | executable tasks and consent boundary |
| `50-timeline.md` | orchestrator | critical path and due dates |
| `60-decisions.md` | person + orchestrator | choices, confirmations, exceptions |
| `70-evidence-index.md` | documents | pointers and verification checks, never secrets |
| `90-readiness-report.md` | orchestrator | dated final gate report |
| `99-dashboard.md` | renderer | generated, never edit manually |

## IDs and links

Use stable IDs: `PERSON-001`, `SRC-001`, `REQ-001`, `DOC-001`, `ACT-001`, and `DEC-001`. Link by ID in prose. Do not renumber an existing ID.

Every requirement needs: `source_id`, `applies_to`, `status`, `evidence`, and `actions`. Valid statuses are `unknown`, `researching`, `needs_evidence`, `in_progress`, `ready`, `submitted`, `blocked`, and `not_applicable`.

Every source needs an official URL, publisher, retrieval date, rule summary, and freshness date. Use `needs_recheck` if a source has no stated update date or has reached its freshness date.

Every action needs a class: `autonomous`, `confirmation_required`, or `human_only`. A completed action needs a receipt reference or an explicit `no_receipt_reason`.

Use clear records under headings; for example:

```md
## REQ-001 — Passport validity

- Source: SRC-001
- Applies to: PERSON-001
- Status: needs_evidence
- Evidence: DOC-001
- Actions: ACT-001
```

## Sensitive data

Record only file references, document type, expiry, and verification state in Markdown. Keep originals in a user-controlled encrypted location. Do not record passport numbers, bank balances, account passwords, cookies, recovery codes, or biometrics.
