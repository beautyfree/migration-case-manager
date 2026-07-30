# Migration OS roadmap

> Canonical execution plan for `migration-case-manager`.
>
> **Operating rule:** Before starting work, read this file. Work only on the next unblocked item. In the same change set, update its status, verification evidence, blockers, and `Now`. Do not mark an item complete from implementation alone: record the command, fixture, live check, or explicit limitation that proves it.

## Product boundary

Migration OS is a portable, Markdown-first operating system for an individual's or family's international move. It is not a legal service and does not promise a visa outcome. Its source of truth is a case folder; Codex and Claude Code are interchangeable execution hosts; a future UI only renders the same case model.

### Non-negotiable principles

- **Official-source-first:** no requirement is ready without a primary source, applicability, retrieval date, and recheck date.
- **Case graph, not checklist:** requirements, people, evidence, decisions, and actions link through stable IDs.
- **Consent-aware execution:** research and drafting may be autonomous; irreversible actions require a current, scoped confirmation; identity proofing and legal signatures remain human-only.
- **No secrets in the case:** Markdown holds metadata and references, never credentials, one-time codes, document numbers, biometrics, or raw evidence.
- **Portable core:** one `skills/` tree and one Markdown case contract; `.codex-plugin` and `.claude-plugin` are host adapters only.
- **Evidence before completion:** a container, script, or generated file is not proof that a person can complete the real next action.

## Status legend

| Status | Meaning |
| --- | --- |
| `done` | Implemented and verified with the evidence recorded below. |
| `in_progress` | The only active implementation item. |
| `ready` | Can start now; dependencies are complete. |
| `blocked` | Needs a named human decision or external change. |
| `planned` | Deliberately not ready yet. |
| `not_started` | Defined but not queued. |

## Current control panel

| Field | Value |
| --- | --- |
| Product phase | R6 — Local visual renderer discovery |
| Current item | `R6-01` / `DEC-PROD-003` |
| Current status | `blocked` |
| Next concrete outcome | Collect 3–5 sanitized real case retrospectives before choosing a local visual renderer. |
| Primary blocker | No real sanitized case retrospectives exist yet; a UI without these would be a second guessed product, not a renderer of proven case needs. |
| Canonical case data | Markdown case folder outside the plugin and outside Git. |
| Current repository | `https://github.com/beautyfree/migration-case-manager` |

## Completed foundation

| ID | Status | Delivered | Verification evidence |
| --- | --- | --- | --- |
| `FND-01` | `done` | Cross-agent plugin structure with a shared `skills/` tree. | Claude plugin validator passed; Codex plugin validator passed. |
| `FND-02` | `done` | Initial skills: case manager, official research, consent-aware actions. | Each `SKILL.md` passed `quick_validate.py`. |
| `FND-03` | `done` | Markdown case v1 templates, `create_case.py`, `validate_case.py`, and `render_case.py`. | Fresh fixture case created, validated, and rendered successfully. |
| `FND-04` | `done` | Codex marketplace manifest, Claude plugin manifest, installation README. | Repository manifest and Claude manifest validation passed. |
| `FND-05` | `done` | Public GitHub repository. | `main` pushed to `beautyfree/migration-case-manager`; README and Claude manifest fetched from GitHub API. |

## Release R1 — Case Kernel v2

**Outcome:** a case remains understandable and safely actionable after a month, a different agent, or a different host.

| ID | Status | Work | Acceptance criteria | Depends on |
| --- | --- | --- | --- | --- |
| `R1-01` | `done` | Define schema v2 and migration rules. | `case-format.md` specifies fields, IDs, ownership, allowed states, and backwards-compatible migration from v1. | `FND-03` |
| `R1-02` | `done` | Upgrade case templates to v2. | New case contains route options, requirements, documents, actions, timeline, finance/logistics, decisions, evidence, and readiness files. | `R1-01` |
| `R1-03` | `done` | Add `migrate_case.py`. | A v1 fixture migrates non-destructively to v2, then passes validation. | `R1-01`, `R1-02` |
| `R1-04` | `done` | Strengthen `validate_case.py`. | Detect missing/duplicate record definitions, invalid state, unresolved source, unsafe sensitive fields, broken links, completed action without receipt, and stale readiness report. | `R1-01` |
| `R1-05` | `done` | Build critical-path renderer. | Dashboard identifies blockers, dated commitments, source freshness, and actions needing human involvement from a v2 fixture. | `R1-02`, `R1-04` |
| `R1-06` | `done` | Add synthetic fixtures and contract tests. | Happy path, blocked path, and deliberately invalid path exercise creation, migration, validation, and rendering. No personal data is committed. | `R1-03`–`R1-05` |

### R1 release gate

- `R1-01` through `R1-06` are `done`.
- A new agent can open the fixture dashboard and name the next safe action without prior chat history.
- No source case file contains restricted evidence or secrets.

## Release R2 — Official rules and source engine

**Outcome:** the system creates dated, route-specific requirements instead of repeating generic web advice.

| ID | Status | Work | Acceptance criteria | Depends on |
| --- | --- | --- | --- | --- |
| `R2-01` | `done` | Choose a real reference corridor and legal basis. | User confirmed: Russian citizens applying from Russia, temporary move to Georgia, intended individual-entrepreneur registration, spouse, and a five-month-old child. Target city, period, business activity, tax status, and selected residence route stay explicit open decisions. | User decision |
| `R2-02` | `done` | Add source records and freshness policy to schema. | Every `SRC-*` includes publisher, official URL, retrieved date, update date if known, applicability, and recheck date. | `R1` |
| `R2-03` | `done` | Build route research workflow and source-conflict handling. | Conflicting official pages preserve both claims and mark the requirement blocked; no silent choice. | `R2-02` |
| `R2-04` | `done` | Create first route pack from live primary sources. | The sanitized Russia → Georgia family/IE reference case has five linked route requirements, six official-source records, retrieval/freshness dates, explicit conditions, and a rendered dashboard. `validate_case.py` passed with 0 warnings on 2026-07-30. | `R2-01`, `R2-03` |
| `R2-05` | `done` | Add source refresh diff. | `refresh_sources.py` stores only public URL/hash/retrieval metadata in ignored case state and reports `new`, `changed`, `unavailable`, and `stale`; deterministic test covers all states and a live dry run read all six Georgia sources on 2026-07-30. | `R2-02`, `R2-04` |

### R2 release gate

- A person can inspect each mandatory item through its official source link.
- The system explicitly labels conditional and unknown requirements.
- Live verification date and recheck schedule are visible in the dashboard.

## Release R3 — Document operations

**Outcome:** documents are prepared in the right form and at the right time.

| ID | Status | Work | Acceptance criteria | Depends on |
| --- | --- | --- | --- | --- |
| `R3-01` | `done` | Model document transformations. | Document chains are now validated: known transforms only, original first, upload last, no duplicated transform or apostille/legalization combination, and apostille precedes translation. A negative fixture verifies rejection without storing raw documents. | `R1`, `R2-04` |
| `R3-02` | `done` | Add document validity and latest-safe-date computation. | `document_dates.py` derives earliest-safe-issue and latest-safe-order dates from explicit case data and reports early-issued or late-ordering risk. A deterministic fixture proves both detections; unknown data remains explicitly insufficient. | `R3-01` |
| `R3-03` | `done` | Add document quality gate. | `document_quality.py` reports all-pages, legibility, name consistency, language, and legalization checks without opening evidence; validator prevents `ready` with failed or unknown applicable checks. Deterministic failed-legibility fixture passes. | `R3-01` |
| `R3-03` | `planned` | Add document quality gate. | Checks all-pages, legibility, name consistency, language, and required legalization state as explicit results. | `R3-01` |
| `R3-04` | `done` | Add provider research runbook. | `provider-research.md` mandates source-linked comparison and explicit consent boundaries; `create_provider_comparison.py` creates a non-destructive two-candidate Markdown shell. Contract test verifies creation and overwrite refusal. | `R2-04` |

## Release R4 — Action runner

**Outcome:** an agent turns verified requirements into observable, consent-safe progress.

| ID | Status | Work | Acceptance criteria | Depends on |
| --- | --- | --- | --- | --- |
| `R4-01` | `done` | Define executable action and receipt schema. | Actions encode dependencies, scope, consent class, official URL/provider, expected receipt, state, owner, and deadline. | `R1` |
| `R4-02` | `done` | Add browser runbook protocol. | The Georgia reference case binds each browser target to an official source domain and action class; the runbook blocks data entry on a domain mismatch and requires current scoped consent before submission, booking, payment, messaging, or disclosure. | `R4-01`, `R2-04` |
| `R4-03` | `done` | Add appointment/provider workflow. | Added `APPT-*` records and lifecycle validation. Confirmed/completed appointments require scoped consent plus an evidence receipt; reschedules reference the predecessor and cancellations require a reason. Contract test and v1 migration test pass. | `R3-04`, `R4-02` |
| `R4-04` | `done` | Add action status and receipt verification. | A page opening cannot close an action; a receipt or reason is required. | `R4-01` |

## Release R5 — Landing OS

**Outcome:** the case supports life after approval and arrival, not only the application.

| ID | Status | Work | Acceptance criteria | Depends on |
| --- | --- | --- | --- | --- |
| `R5-01` | `done` | Add finance and logistics lane. | `LOG-*` records now validate areas and statuses; `logistics_readiness.py` surfaces missing core areas. Georgia reference case covers housing, insurance, connectivity, transport, cash, and banking without sensitive financial data. Test verifies omission reporting and secret guard. | `R1`, `R2-04` |
| `R5-02` | `done` | Add 72-hour, 30-day, and 90-day landing workflows. | Required `move_date` and `arrival_phase.py` select pre-move, 72-hour, 30-day, 90-day, or stabilize lane; dashboard exposes the lane. Tests verify transition and unknown dates stay explicit. | `R5-01`, `R4` |
| `R5-03` | `done` | Add family and resilience branches. | `create_resilience_branch.py` creates non-destructive `dependent`, `school`, `pet`, `lost_document`, and `urgent_abroad` work queues; the action skill defines human-only and emergency boundaries. Contract test verifies safe branch creation and overwrite refusal. | `R3`, `R5-02` |
| `R5-03` | `planned` | Add family and resilience branches. | Dependants, pets, school, lost documents, and urgent “already abroad” recovery are explicit case branches. | `R3`, `R5-02` |

## Release R6 — Local visual renderer

**Outcome:** a local UI makes the case easier to inspect without becoming a second database.

| ID | Status | Work | Acceptance criteria | Depends on |
| --- | --- | --- | --- | --- |
| `R6-01` | `blocked` | Gather 3–5 real, sanitized case retrospectives. | Retrospectives identify fields and views that Markdown alone makes hard to use. | Real usage |
| `R6-02` | `planned` | Specify read-only renderer contract. | Renderer consumes v2/v3 case data and its generated output can be deleted/recreated without loss. | `R6-01` |
| `R6-03` | `planned` | Build static HTML/local renderer. | Shows readiness, timeline, dependency graph, stale sources, and consent queue from fixture data. | `R6-02` |
| `R6-04` | `planned` | Evaluate bidirectional editing. | Only proceed if conflict handling, auditability, and Markdown round-trip are proven. | `R6-03` |

## Permanent operating loop

1. Read this roadmap and the current case dashboard.
2. Select the first `ready` or explicitly designated `in_progress` item.
3. Implement the smallest coherent vertical slice.
4. Run the relevant automated checks and, where applicable, a real user-path check.
5. Update this roadmap: status, evidence, new risks, and next item.
6. Commit the change with the roadmap update. Push only when the user has requested publication or normal repository delivery.

## Decisions required later

| ID | Needed for | Decision |
| --- | --- | --- |
| `DEC-PROD-001` | `R2-01` | First reference corridor, legal basis, applicant profile, and target period. |
| `DEC-PROD-002` | R3/R4 provider workflows | Countries/cities where local-service search should be made first-class. |
| `DEC-PROD-003` | R6 | Whether the renderer stays local-only or may become a hosted service. |

## Change log

| Date | Change |
| --- | --- |
| 2026-07-30 | Created roadmap; recorded completed plugin foundation; started `R1-01`. |
| 2026-07-30 | Completed `R1-01`: defined v2 contract, strict record fields, compatibility rules, and non-destructive v1 migration rules. Started `R1-02`. |
| 2026-07-30 | Completed `R1-02`–`R1-04`: v2 templates are now tracked; v1 migration preserves source checksums and passes v2 validation; validator rejects nine representative contract violations. Started `R1-05`. |
| 2026-07-30 | Completed R1 release gate: renderer and three contract tests cover happy, invalid, and non-destructive migration cases. Completed `R2-02` from the v2 source contract and freshness validator; started `R2-03`. |
| 2026-07-30 | Completed `R2-03`: conflict protocol now preserves each official source and validator rejects a requirement that silently proceeds despite a conflict. Started `R4-01`; R2 route-pack work remains blocked on the reference corridor. |
| 2026-07-30 | Completed `R4-01` and `R4-04` from the v2 action/receipt contract and validator; added generic browser runbook and started `R4-02`. |
| 2026-07-30 | Marked `R4-02` blocked: generic protocol is implemented, but its required live route/domain verification depends on `R2-04`, which cannot begin without `DEC-PROD-001`. |
| 2026-07-30 | Completed `R2-01`: the first reference corridor is Russia → Georgia for a family of three, with individual-entrepreneur registration as the intended economic step. Started `R2-04`; live primary-source research is in progress. |
| 2026-07-30 | Completed `R2-04` and `R4-02`: added a sanitized, validated, source-linked Georgia reference case and exercised its dashboard. Started `R2-05` to make source freshness observable over time. |
| 2026-07-30 | Completed `R2-05`: added source-refresh diff with safe hash-only state, deterministic coverage for new/changed/unavailable/stale states, and a successful live Georgia dry run. Started `R3-01`. |
| 2026-07-30 | Completed `R3-01`: transformation chains now have an enforceable order and safety contract. Started `R3-02`. |
| 2026-07-30 | Completed `R3-02`: added deterministic document issue/order timing analysis; unknown input remains a visible gap. Started `R3-03`. |
| 2026-07-30 | Completed `R3-03`: document readiness now has an explicit, evidence-free quality gate. Started `R3-04`. |
| 2026-07-30 | Completed `R3-04`: added consent-safe provider comparison runbook and non-destructive comparison generator. Started `R4-03`. |
| 2026-07-30 | Completed `R4-03`: added validated appointment lifecycle records and migration support. Started `R5-01`. |
| 2026-07-30 | Completed `R5-01`: added safe landing logistics records, readiness reporting, and financial-data guardrails. Started `R5-02`. |
| 2026-07-30 | Completed `R5-02`: landing lane is now date-driven and visible in the dashboard. Started `R5-03`. |
| 2026-07-30 | Completed `R5-03` and the R5 release: added explicit resilience branches for dependants and recovery scenarios. R6 remains blocked on real sanitized case retrospectives; do not invent a UI requirement before those exist. |
