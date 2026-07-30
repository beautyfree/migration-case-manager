# Case format v2

This is the canonical contract for a Migration OS case. Markdown source files are authoritative. `99-dashboard.md`, exported JSON, and future HTML are derived outputs and may be deleted and regenerated.

## Compatibility and migration

- New cases use `schema_version: 2` in `00-case.md`.
- v1 cases remain readable. Do not rename, delete, or overwrite a v1 case in place.
- A future `migrate_case.py` creates a separate v2 destination and writes a migration report. It preserves all existing `PERSON-*`, `SRC-*`, `REQ-*`, `DOC-*`, `ACT-*`, and `DEC-*` IDs.
- A v2 tool must fail clearly when a case has an unknown schema version rather than guessing its meaning.

## Case files and ownership

| File | Owner | Authoritative purpose | v1 mapping |
| --- | --- | --- | --- |
| `00-case.md` | orchestrator | case identity, phase, route summary, current blocker | unchanged |
| `10-people.md` | intake | participants and eligibility-relevant facts | `10-profile.md` |
| `20-route-options.md` | route advisor | route alternatives and user choice | new |
| `30-requirements.md` | research | official sources and requirement graph | `20-requirements.md` |
| `40-documents.md` | documents | document inventory and transformations | `30-documents.md` |
| `50-actions.md` | actions | executable work, consent and receipts | `40-actions.md` |
| `60-timeline.md` | orchestrator | dated commitments and critical path | `50-timeline.md` |
| `65-appointments.md` | actions | provider appointment lifecycle and receipts | new |
| `70-finance-logistics.md` | landing | non-sensitive budget/logistics work | new |
| `80-decisions.md` | person + orchestrator | choices, scoped consent, exceptions | `60-decisions.md` |
| `90-evidence-index.md` | documents | safe evidence references and checks | `70-evidence-index.md` |
| `95-readiness-report.md` | readiness | dated readiness gate | `90-readiness-report.md` |
| `99-dashboard.md` | renderer | generated summary, never edit | unchanged |

Keep originals in a user-controlled encrypted location outside this folder or in ignored `evidence/`. No case Markdown may contain a password, recovery code, one-time code, passport/document number, payment-card data, full account data, biometric data, or raw document image.

## Document shape

Every source file begins with YAML frontmatter. Use simple scalar YAML in the frontmatter so host-neutral scripts can read it without a third-party parser.

`00-case.md` must include:

```yaml
---
case_id: CASE-001
schema_version: 2
case_status: active
phase: prepare
last_verified: 2026-07-30
move_date: unknown
---
```

All other source files must include at least:

```yaml
---
case_id: CASE-001
schema_version: 2
---
```

Use dates as `YYYY-MM-DD`; use `unknown` only where a fact has not been established. Never encode a relative date such as “next Tuesday” as case data.

`move_date` is required in `00-case.md` and is either an exact date or `unknown`. It drives only the landing-workflow lane; it does not infer an immigration deadline.

## Stable identifiers and record headings

Use immutable identifiers with three or more digits: `PERSON-001`, `ROUTE-001`, `SRC-001`, `REQ-001`, `DOC-001`, `ACT-001`, `DEC-001`, `EVD-001`, and `MILESTONE-001`. Do not reuse or renumber an ID after it has been referenced.

Define a record exactly once under a level-two heading:

```md
## REQ-001 — Passport validity

- Source: SRC-001
- Applies to: PERSON-001
- Status: needs_evidence
- Evidence: DOC-001
- Actions: ACT-001
```

Use the exact field labels specified below. Link fields contain a comma-separated list of IDs or `none`; do not use an empty field. The heading title is human-readable only; automation must use the ID.

## Allowed states

| Entity | Allowed values |
| --- | --- |
| Case `case_status` | `draft`, `active`, `paused`, `completed`, `archived` |
| Case `phase` | `explore`, `choose_route`, `prepare`, `apply`, `move`, `land`, `stabilize` |
| Requirement `Status` | `unknown`, `researching`, `needs_evidence`, `in_progress`, `ready`, `submitted`, `blocked`, `not_applicable` |
| Document `Status` | `unknown`, `missing`, `requested`, `received`, `needs_transformation`, `ready`, `expired`, `rejected`, `not_applicable` |
| Action `Status` | `not_started`, `in_progress`, `waiting_on_user`, `scheduled`, `submitted`, `completed`, `cancelled`, `blocked` |
| Decision `Status` | `proposed`, `accepted`, `superseded`, `expired`, `rejected` |
| Source `Status` | `current`, `needs_recheck`, `conflicting`, `unavailable`, `superseded` |
| Readiness `Status` | `not_assessed`, `not_ready`, `ready_with_risks`, `ready` |

## Record contracts

### People

`PERSON-*` records live in `10-people.md`.

- `Role`: `primary_applicant`, `dependent`, `traveller`, `representative`, or `other`.
- `Citizenship`, `Current lawful location`, and `Participation` are required.
- Do not add identity numbers, birth dates, or address history. Link to a `DOC-*` record if their existence matters.

### Route options

`ROUTE-*` records live in `20-route-options.md`.

- Required fields: `Destination`, `Legal basis`, `Country of application`, `Applies to`, `Status`, `Sources`, `Decision`.
- `Status`: `candidate`, `researching`, `viable`, `not_viable`, `selected`, or `rejected`.
- A selected route must have one accepted `DEC-*` record; do not silently select a route from agent inference.

### Sources

`SRC-*` records live in `30-requirements.md`.

- Required fields: `Publisher`, `Official URL`, `Retrieved`, `Updated`, `Applies to`, `Rule summary`, `Fresh until`, `Status`.
- `Official URL` must be an authority, consulate, officially appointed application operator, or issuing authority URL. An unofficial source may be recorded only as a discovery lead and must not satisfy a requirement.
- `Updated` may be `unknown`; in that case `Fresh until` must be conservative and the status must become `needs_recheck` on or before that date.

### Requirements

`REQ-*` records live in `30-requirements.md`.

- Required fields: `Source`, `Applies to`, `Condition`, `Status`, `Evidence`, `Actions`, `Dependencies`, `Conflict`, `Review needed`.
- `Source` must name at least one `SRC-*`; a ready or submitted requirement cannot depend only on an unofficial source.
- `Condition` is `always`, a specific condition, or `unknown`; never hide a condition in prose.
- `Conflict` is `none` or `needs_reconciliation`. If any linked source is `conflicting`, the requirement must be `blocked`, its conflict must be `needs_reconciliation`, and `Review needed` must be `legal` or `human`.
- `Review needed` is `none`, `legal`, `tax`, or `human`.

### Documents

`DOC-*` records live in `40-documents.md`.

- Required fields: `Owner`, `Type`, `Status`, `Required by`, `Evidence`, `Issued`, `Expires`, `Needed by`, `Lead time days`, `Maximum age days`, `Transformations`, `All pages`, `Legibility`, `Name consistency`, `Language`, `Legalization check`, `Actions`.
- `Transformations` lists the required chain using only `original`, `copy`, `notarized_copy`, `apostille`, `legalization`, `translation`, `certified_translation`, and `upload`.
- A non-empty chain begins with `original`; `upload`, if required, is last; never combine `apostille` and `legalization`; and place an apostille before any translation that covers it. `none` is allowed only when the transformation requirement is genuinely not yet known.
- `Needed by` is the submission/appointment date for this document, or `unknown`. `Lead time days` is the time needed to obtain and transform it; `Maximum age days` is the issuer/authority window counted back from `Needed by`. Use non-negative integers or `unknown`. `document_dates.py` derives the earliest safe issue date and latest safe order date; it does not alter source Markdown.
- Quality fields use `unknown`, `pass`, `fail`, or `not_applicable`. They record a human/agent review result only; never paste document contents or sensitive filenames. A document may be marked `ready` only when all applicable quality fields are `pass` or `not_applicable`.
- `Evidence` points to `EVD-*` records or `none`; never include a direct sensitive pathname in a document record.

### Actions and receipts

`ACT-*` records live in `50-actions.md`.

- Required fields: `Purpose`, `Requirements`, `Dependencies`, `Status`, `Class`, `Owner`, `Target`, `Deadline`, `Expected receipt`, `Receipt`, `Decision`.
- `Class` is exactly `autonomous`, `confirmation_required`, or `human_only`.
- `Target` is an official URL, selected provider, or `unknown`; a non-official provider target must link to evidence explaining selection.
- `confirmation_required` and `human_only` actions cannot become `completed` without an accepted `DEC-*` record or an explicit user statement recorded in `80-decisions.md`.
- A completed action requires an `EVD-*` receipt or `Receipt: none` plus a concrete `No receipt reason`.

### Timeline and milestones

`MILESTONE-*` records live in `60-timeline.md`.

- Required fields: `Date`, `Kind`, `Status`, `Depends on`, `Linked records`, `Consequence if missed`.
- `Kind` is `deadline`, `appointment`, `expiry`, `target`, or `review`.
- A `Date` is an exact date or `unknown`; a calculated latest-safe date must include a note naming the upstream dependency.

### Appointments

`APPT-*` records live in `65-appointments.md`.

- Required fields: `Service`, `Provider comparison`, `Selected provider`, `Participants`, `Scheduled for`, `Status`, `Action`, `Decision`, `Receipt`, `Rescheduled from`, `Cancellation reason`.
- `Status` is exactly `researching`, `candidate_selected`, `booking_pending`, `confirmed`, `reschedule_requested`, `rescheduled`, `cancel_requested`, `cancelled`, or `completed`.
- `confirmed` and `completed` require an accepted scoped `DEC-*` record and an `EVD-*` receipt. `rescheduled` links its predecessor through `Rescheduled from`; `cancelled` names a non-sensitive reason. No appointment record contains an access code, booking reference, name, address, or document contents.

### Finance and logistics

Records in `70-finance-logistics.md` use `LOG-*` IDs.

- Required fields: `Area`, `Status`, `Applies to`, `Actions`, `Decision`, `Notes`.
- `Area` is `insurance`, `housing`, `connectivity`, `transport`, `cash`, `banking`, `school`, `pets`, or `other`.
- Record decisions and tasks, not balances, account numbers, wallet addresses, or investment advice.

### Decisions and consent

`DEC-*` records live in `80-decisions.md`.

- Required fields: `Decision maker`, `Status`, `Scope`, `Options considered`, `Chosen option`, `Decided`, `Expires`, `Linked records`.
- `Scope` must name the exact action or decision; broad standing permission is invalid for payments, submissions, and disclosure of personal data.
- A decision expires when its date is reached, the linked action changes materially, or a new decision supersedes it.

### Evidence index

`EVD-*` records live in `90-evidence-index.md`.

- Required fields: `Kind`, `Owner`, `Storage reference`, `Verified`, `Status`, `Supports`.
- `Storage reference` is an opaque handle or a safe relative reference, never a raw sensitive filename, share URL, or file contents.
- `Kind` is `document`, `receipt`, `source_snapshot`, `appointment`, `translation`, or `other`.

### Readiness report

`95-readiness-report.md` is generated or updated by the readiness workflow.

- It must include `assessed_at`, `status`, `case_id`, `schema_version`, blockers, risks, stale sources, and actions waiting on a person.
- It is stale after seven days or immediately after a requirement, document, action, decision, source, or timeline record changes.
- It never changes an underlying record status. It reports the current source data only.

## Migration rules v1 → v2

1. Create a new destination directory. Refuse an existing non-empty destination.
2. Copy case data; never alter the v1 source.
3. Set every copied source file’s `case_id` and `schema_version: 2` frontmatter. Retain the old `case_id` where present; otherwise create one and record it in the migration report.
4. Apply the file mapping in the ownership table. Add empty `20-route-options.md` and `70-finance-logistics.md` v2 templates.
5. Preserve all record headings and IDs. Preserve unrecognized prose under a `## Migrated notes` heading in the corresponding file.
6. Convert v1 action class/status text only when it maps exactly; otherwise set `Status: unknown`, record the ambiguity in the migration report, and do not infer consent.
7. Rename legacy readiness content to `95-readiness-report.md`; leave the report `not_assessed` unless it meets the v2 readiness contract.
8. Write `98-migration-report.md` with source path, timestamp, mappings, generated IDs, warnings, and manual follow-ups.
9. Run v2 validation. A migration with warnings may succeed; a migration with errors must leave the v1 source untouched.

## Validation invariants

- File frontmatter contains the same `case_id` and `schema_version: 2` across all source files.
- A record definition is unique; references may repeat freely.
- Every referenced ID has one definition of the expected type.
- Every `ready` or `submitted` requirement has an applicable current official source.
- Every completed action has its required consent and receipt invariant satisfied.
- No evidence is stored as raw sensitive data in Markdown.
- A readiness report must be refreshed when its source case data changes.
