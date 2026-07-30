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
| Product phase | R8 — Portable native runtime |
| Current item | R8-04 — deterministic Python-operation parity |
| Current status | `ready` |
| Next concrete outcome | Port case creation, validation, rendering, migration and deterministic reports to `migration-os`, with fixture parity before removing Python from normal skill flows. |
| Primary blocker | None for architecture and core migration. Signing/notarization credentials are required only before the non-developer public-release gate. |
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

## Release R6 — Local visual renderer

**Outcome:** a local UI makes the case easier to inspect without becoming a second database.

| ID | Status | Work | Acceptance criteria | Depends on |
| --- | --- | --- | --- | --- |
| `R6-01` | `done` | Gather 3–5 sanitized case retrospectives. | User authorized scenario coverage. Four source-linked, sanitized scenarios cover family telework, student, partner, and temporary-work routes; they converge on dependency, timeline, eligibility, and landing views. `retrospective_readiness.py` reports 4/3 eligible. | User decision |
| `R6-02` | `done` | Specify read-only renderer contract. | Contract derives four views from the scenario findings (readiness, timeline, route graph, landing board) and forbids editing, network fetch, authentication, evidence viewing, and secret-bearing state. | `R6-01` |
| `R6-03` | `done` | Build static HTML/local renderer. | `render_html.py` produces an ignored, static, no-network/no-edit HTML file with readiness/consent queue, route graph, documents, timeline, appointments, and landing board. Automated test and Georgia reference-case render passed. | `R6-02` |
| `R6-04` | `done` | Evaluate bidirectional editing. | Decision: do not add editing. Scenario evidence supports inspection only; conflict handling, auditability, consent-aware mutations, and Markdown round-trip are unproven. The renderer contract preserves Markdown-only edits pending a separate future proposal. | `R6-03` |

## Release R7 — Local React web application

**Outcome:** a user installs the plugin, asks an agent to open a private case, and works in a localhost browser UI without a mandatory cloud service.

| ID | Status | Work | Acceptance criteria | Depends on |
| --- | --- | --- | --- | --- |
| `R7-01` | `done` | Define local-app contract and package boundary. | `local-app-contract.md` defines loopback/session rules, Markdown authority, safe API/events, consent boundaries, and packaging. Existing contract suite stayed green. | `R6` |
| `R7-02` | `done` | Package React app and local server launcher. | Prebuilt React/Vite assets are packaged in the plugin; Bun-native CLI `serve` binds `127.0.0.1` on an ephemeral port, boots a 256-bit token session, uses HttpOnly SameSite cookie bootstrap, and writes ignored local runtime state. It can compile to a standalone executable; no Python or Node runtime is needed by the user. | `R7-01` |
| `R7-03` | `done` | Implement read-only case API and live React views. | Token-protected `/api/data` exposes only parsed case metadata/records; React shows routes/source freshness, documents, consent actions, timeline, appointments, and landing records. Live Georgia check proved 403 without cookie and data access after token bootstrap. | `R7-02` |
| `R7-04` | `done` | Add agent request bridge. | UI POST creates a bounded local request in ignored JSONL; Bun CLI lists/claims/completes it and event log preserves handoff. Live Georgia test queued and retrieved a provider-research request without external effect. | `R7-03` |
| `R7-05` | `done` | Add consent-safe mutations. | UI exposes only acceptance of an existing proposed `DEC-*` after displaying its exact scope and browser confirmation. Bun updates that decision and appends an event; it never executes an external action. Bundle, standalone compile, and contract suite pass. | `R7-04` |
| `R7-06` | `done` | Run Georgia end-to-end local UI verification. | Isolated Georgia case passed validation and live source dry-run; Bun UI token bootstrap returned 302 and API returned 200; provider-research request was persisted, claimed, completed, and produced comparison artifact. Flow stopped before booking, payment, submission, or disclosure. | `R7-02`–`R7-05` |

### R7 release gate

- The plugin starts a local app without a hosted account or central database.
- Server binds only to loopback and requires a session token.
- Markdown case files remain the authority and the UI can be stopped/deleted without data loss.
- No UI path bypasses the existing consent and human-only controls.

## Release R8 — Portable native runtime

**Outcome:** a non-developer on macOS, Windows, or Linux can install the agent plugin, ask it to create or open a case, and receive the local Migration OS UI without manually installing Bun, Node, npm, Python, or project dependencies. The Markdown case remains local and authoritative.

**Architecture decision:** TypeScript and Bun remain build-time technologies. The end-user interface is a platform-specific, self-contained `migration-os` executable. `npx` is allowed only as an optional developer convenience: it is not a supported user installation path because it requires Node/npm. The plugin downloads only the matching binary from a version-pinned release, verifies its SHA-256 checksum, then invokes it from a user-owned application-data directory. It must never silently update the binary, upload a case, or expose the local server beyond loopback.

| ID | Status | Work | Acceptance criteria | Depends on |
| --- | --- | --- | --- | --- |
| `R8-01` | `done` | Write the runtime ADR and machine-readable CLI contract. | `docs/portable-runtime-architecture.md`, `contracts/cli-contract.json`, and `contracts/cli-response.schema.json` define supported targets, command tree, JSON envelope, errors, storage/network policy, and upgrades. `bun run check:contract` passed with 14 commands on 2026-07-30. | `R7` |
| `R8-02` | `done` | Make `migration-os serve` truly standalone. | Vite now emits stable UI assets which the CLI imports with Bun `type:file`; `bun run compile` embeds HTML/JS/CSS in `bin/migration-os`. In an isolated directory containing only the binary and copied Georgia fixture, bootstrap returned 302, unauthenticated API returned 403, and authenticated HTML/React script returned 200 on 2026-07-30. | `R8-01` |
| `R8-03` | `done` | Extract a TypeScript case-core library. | `src/case-core.ts` now owns frontmatter/typed-record parsing, case paths, runtime JSONL, allowlisted case writes, and sensitive-field guards; UI CLI uses it. `bun run test` passed parser and safe-write fixture coverage on 2026-07-30. | `R8-01` |
| `R8-04` | `in_progress` | Port deterministic Python case operations. | `init`, `validate`, `render`, migration, document dates/quality, logistics readiness, arrival lane, resilience branches, and provider-comparison shell run through `migration-os`; golden fixtures and negative tests match the current Python behaviour before Python is removed from the skills. Native validation now covers the source, conflict, document, action, appointment, and readiness safety gates. The legacy retrospective-readiness and static read-only HTML renderer now also have TypeScript implementations and regression coverage; their Python entrypoints remain compatibility-only until removal/audit. | `R8-03` |
| `R8-05` | `in_progress` | Port the source-refresh engine with explicit network policy. | `migration-os sources refresh` records only public URL/hash/date state, has timeout/redirect/domain controls, supports `--dry-run`, and preserves `new`, `changed`, `unavailable`, and `stale` semantics. Live runs remain agent-initiated and never transmit case data. Native engine is implemented and embedded; live source and negative-network fixtures remain. | `R8-03` |
| `R8-06` | `in_progress` | Build reproducible multi-platform artifacts in CI. | Release workflow produces checksummed binaries for macOS arm64/x64, Windows x64/arm64, Linux x64 glibc/musl, and Linux arm64 glibc/musl; x64 baseline variants are used where needed for older CPUs. GitHub Actions run `30588893930` built the complete checked artifact set and on 2026-07-31 executed `doctor` → `init` → `validate` → token-protected loopback `serve` against standalone macOS arm64, Linux x64, and Windows x64 binaries. Cross-architecture clean-machine verification remains. | `R8-02`, `R8-05` |
| `R8-07` | `in_progress` | Add a safe plugin bootstrapper. | On first use, the installed Codex/Claude skill detects OS/architecture, presents the exact release/version/download, downloads only the matching artifact after user consent, verifies SHA-256, stores it outside the plugin cache, runs `doctor`, and reports a recovery command. Existing binary remains usable if an upgrade fails. POSIX and PowerShell bootstrappers now reject non-versioned/non-HTTPS release inputs, retrieve and display the exact checksum before consent, verify the download, run `doctor` before atomic activation, and preserve the existing binary on failure; the POSIX flow has an offline regression smoke in CI. The repository now contains a strict-valid Claude marketplace manifest and a dependency-free optional `migration-os` npx launcher that performs the same version-pinned native download/verification rather than running a second JavaScript runtime. Signed GitHub/NPM publication and installed-binary verification remain. | `R8-06` |
| `R8-08` | `in_progress` | Sign and publish user-facing releases. | The macOS arm64 candidate is Developer-ID signed and Apple notarization was accepted on 2026-07-31 (submission `121e0391-383f-486d-a879-2adeb3efc199`). Windows Authenticode signing, the complete artifact matrix, and immutable public release publication remain before the non-developer release gate can close. | `R8-06` |
| `R8-09` | `in_progress` | Switch skills, README, and agent bridge to the native CLI. | No user-facing `python3`, `bun`, `node`, or `npx` command remains in the normal flow. Skills invoke `migration-os` and explicitly use the bundled UI rather than creating a replacement. The primary case/research/action skills, templates, Georgia example, README, and local-app contract now name the native commands; both Codex and Claude have persistent marketplace installation paths. Only the installed-binary bridge remains. | `R8-04`, `R8-05`, `R8-07` |
| `R8-10` | `planned` | Verify the real installation and safety journeys. | Clean-user tests on supported macOS, Windows, and Linux: install plugin → bootstrap binary → create a synthetic private case → open UI → queue/claim a safe request → validate → stop → uninstall. Negative tests prove checksum failure, unsupported platform, missing browser, bad Markdown, and irreversible-action consent boundaries fail safely. | `R8-08`, `R8-09` |

### R8 delivery sequence and non-goals

1. Build the standalone binary first (`R8-01`–`R8-02`); do not port every Python helper before proving that a binary works alone.
2. Migrate pure, deterministic Python functions with golden fixtures (`R8-03`–`R8-04`), then source refresh (`R8-05`). Python stays available only as an internal compatibility fallback until parity passes.
3. Produce release artifacts and a consented bootstrap path (`R8-06`–`R8-07`). Do not package every platform binary inside the agent plugin; that would make every plugin install unnecessarily large.
4. Complete signing and clean-machine verification before claiming ordinary-user support (`R8-08`–`R8-10`).

Out of scope for R8: a central case server, cloud sync, accounts, background agent wake-ups from the browser queue, automatic external submissions, booking, payment, or document storage. Those would need a separate privacy and consent proposal.

### R8 release gate

- A clean supported desktop needs only Codex or Claude plus the plugin; no manual runtime installation is required.
- The agent can state which binary/version it will use and obtain explicit first-download consent.
- The binary is checksum-verified, platform-matched, signed where the OS requires it, and never auto-updates.
- A copied case directory works offline for `init`, `validate`, `render`, and UI inspection; source refresh is the only networked command and is explicit.
- All legacy Python operations have parity tests; no normal skill path calls Python, Bun, Node, or npm.
- The UI still binds only to `127.0.0.1`, serves no evidence/credentials, and preserves all existing human-confirmation boundaries.

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
| 2026-07-30 | Prepared R6 intake without fabricating cases: added a sanitized retrospective template and readiness checker. R6-01 remains blocked until at least three real completed, sanitized retrospectives are collected. |
| 2026-07-30 | User authorized scenario cases in place of waiting for personal retrospectives. Completed `R6-01` with four source-linked, sanitized route scenarios; started read-only renderer specification. |
| 2026-07-30 | Completed `R6-02`: defined a disposable, read-only renderer contract from the four scenario findings. Started `R6-03`. |
| 2026-07-30 | Completed `R6-03`: added and exercised a static local HTML renderer. Started R6-04 evaluation. |
| 2026-07-30 | Completed `R6-04` and the planned Migration OS roadmap: bidirectional editing is explicitly deferred because its safety invariants are unproven. The plugin remains Markdown-first and read-only in its renderer. |
| 2026-07-30 | Started R7 by user request: package a localhost React web application into the plugin, with no mandatory central server. |
| 2026-07-30 | Completed `R7-01`: recorded local-app authority, security, lifecycle, API, bridge, and consent contract. Started `R7-02`. |
| 2026-07-30 | Completed `R7-02`: packaged prebuilt React assets and a token-protected loopback launcher, manually started against the Georgia case. Started `R7-03`. |
| 2026-07-30 | Completed `R7-03`: live case API and React records views are token-protected and manually exercised on the Georgia case. Started `R7-04`. |
| 2026-07-30 | Architecture correction by user: replaced Python local-app runtime with Bun CLI/daemon and standalone compilation path. |
| 2026-07-30 | Completed `R7-04`: live local UI request was persisted and read by Bun agent CLI with no external action. Started `R7-05`. |
| 2026-07-30 | Completed `R7-05`: scoped decision acceptance is the only browser mutation; no external action is wired to it. Started `R7-06`. |
| 2026-07-30 | Completed R7 release gate: isolated Georgia end-to-end run proved loopback UI, source refresh, agent bridge, provider artifact, validation, and stop-before-irreversible-action behavior. |
| 2026-07-30 | Added R8 portable-native-runtime plan: self-contained binary distribution, TypeScript migration away from Python, verified bootstrap, signing, and clean-machine release gate. R8-01 is the next ready item. |
| 2026-07-30 | Completed `R8-01`: added the portable-runtime ADR and checked machine-readable native CLI/response contracts. Started `R8-02`. |
| 2026-07-30 | Completed `R8-02`: `migration-os` now embeds its Vite UI through explicit Bun file imports; isolated binary test proved loopback authentication and asset serving without neighbouring project files. Started `R8-03`. |
| 2026-07-30 | Completed `R8-03`: extracted the shared TypeScript case core and verified typed fixture parsing plus safe-write guards. Started `R8-04`. |
| 2026-07-30 | Advanced `R8-04`: TypeScript validation now matches the deterministic Python safety gates for source freshness/conflicts, document chains and quality, action receipts/decisions, appointments, and readiness age. Native negative-fixture tests and contract checks pass. `migration-os migrate` now creates a separately validated v2 case without changing its v1 source. Native document date/quality, logistics, arrival-lane reports, resilience branches, and provider-comparison shells now run locally with JSON output; generator smoke tests prove non-destructive creation. Golden parity coverage and renderer output alignment remain before the stage can close. |
| 2026-07-30 | Started `R8-05`: `migration-os sources refresh` now stores only public URL, retrieval date, and normalized SHA-256; it enforces HTTPS/public-address/port limits, same-domain redirect limits, timeout and size bounds, supports dry run, and is embedded in the native binary. Native tests prove hash-only state and dry-run preservation; live and negative-network fixtures remain. |
| 2026-07-30 | Started `R8-06`: standalone builder now accepts every planned target and a release builder emits checksums. A Linux x64 cross-compile completed locally, and CI is configured to test, build all target artifacts, run the native Linux `doctor` smoke, and retain the artifact bundle. Hosted CI and the full clean-machine matrix are not yet evidenced. |
| 2026-07-30 | Started `R8-07`: added consent-first POSIX and PowerShell bootstrappers. They select only supported target artifacts, show the exact version-pinned release URL/checksum/destination before download, enforce HTTPS and SHA-256 before atomic activation, preserve the prior binary on failed download, and run `doctor`. The no-consent preview was exercised; a signed published release and agent-skill bridge remain. |
| 2026-07-30 | Started `R8-09`: primary Codex/Claude shared case skill, research skill, and README normal flow now invoke `migration-os`; Python and Bun are confined to contributor build/test instructions. UI worktree changes owned elsewhere were left untouched. |
| 2026-07-30 | Started `R8-08`: documented reproducible macOS code-sign/notarization, Windows Authenticode, verification, publish, and rollback steps without storing credentials. A clean macOS arm64 artifact was Developer-ID signed, passed `codesign --verify` and native `doctor`; Gatekeeper correctly reported `Unnotarized Developer ID`. Actual notarization, Windows signing, and publication await the corresponding protected credentials. |
| 2026-07-31 | Advanced `R8-08`: Apple app-specific credentials were validated and stored only in the system Keychain under `migration-os`; the clean Developer-ID-signed macOS arm64 candidate was accepted by Apple notarization (submission `121e0391-383f-486d-a879-2adeb3efc199`). The app-specific value was not written to the repository or logs. `spctl --type execute` does not assess a bare executable as an app bundle; distribution verification therefore still requires the clean-machine downloaded-binary journey. Windows signing credentials and the full release matrix remain open. |
| 2026-07-31 | Advanced `R8-06`: GitHub Actions run `30588460321` completed successfully on `main`; it installed Bun from lockfile, passed native tests and CLI contract checks, built the embedded UI, emitted all eight checksummed native target artifacts, passed Linux native `doctor`, and uploaded the bundle. Clean-machine cross-platform journeys remain for R8-10. |
| 2026-07-31 | Advanced `R8-06`: GitHub Actions run `30588893930` passed standalone end-to-end smoke journeys on hosted macOS arm64, Linux x64, and Windows x64 runners. The Windows run exposed CRLF-only parsing in case Markdown; the parser and case initialization now normalize line endings, the regression is covered locally, and the re-run passed all three hosts. |
| 2026-07-31 | Advanced `R8-09`: replaced every user-facing Markdown reference to a legacy Python helper with its matching `migration-os` command; normal plugin instructions now leave no runtime dependency on Python, Node, Bun, or npm. |
| 2026-07-31 | Advanced `R8-07`: bootstrap consent preview now retrieves the platform artifact's exact SHA-256 before asking for download consent; both platform scripts validate a versioned HTTPS release address and run `doctor` on the temporary verified binary before replacing the active binary. An offline POSIX smoke proves preview, checksum verification, doctor, and activation without contacting a release host; GitHub Actions run `30589358056` passed that regression, complete artifact build, and macOS/Linux/Windows native smoke matrix. |
| 2026-07-31 | Advanced `R8-04`: ported the two remaining legacy report helpers—retrospective readiness and disposable static HTML rendering—to TypeScript. Native regression tests cover sanitization/completion eligibility, CRLF input, escaped case rendering, consent queue content, and the no-network/no-edit invariant; `bun test` passed 9 tests. GitHub Actions run `30589584182` passed the complete artifact build and macOS/Linux/Windows standalone matrix with the new modules present. Python entrypoints remain only as compatibility code pending removal audit. |
| 2026-07-31 | Advanced `R8-07`/`R8-09`: added `.claude-plugin/marketplace.json` so Claude Code can add this public repository as a persistent marketplace and install `migration-case-manager@migration-case-manager`; the plugin manifest passes `claude plugin validate --strict`. README now documents the persistent path and keeps direct `--plugin-dir` only for development. |
| 2026-07-31 | Advanced `R8-07`: added the dependency-free `migration-os` npm launcher. It maps Node platform/architecture (including glibc versus musl) to the existing native release artifact, rejects mutable/non-HTTPS releases, previews exact checksum before consent, verifies the downloaded binary, runs `doctor` before activation, and forwards native CLI arguments. GitHub Actions run `30590379518` passed Node launcher tests, `npm pack --dry-run`, existing bootstrap safety checks, complete artifact build, and the macOS/Linux/Windows standalone matrix. GitHub/NPM release publication remains deliberately pending. |
