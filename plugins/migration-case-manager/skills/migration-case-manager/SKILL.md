---
name: migration-case-manager
description: Create, update, validate, and hand off a portable Markdown-first migration or relocation case. Use when a person or family is considering, preparing, or executing an international move and needs a source-backed plan, document matrix, deadline graph, action queue, or readiness review.
---

# Migration Case Manager

Maintain one case folder as the source of truth. Do not substitute generic relocation advice for route-specific, verified requirements.

## Create or open a case

1. Ask only for the minimum route facts: citizenship(s), current lawful location, destination, legal basis, family members, target date, and existing documents. Mark unknown facts as `unknown`; do not invent them.
2. For a new case, run `scripts/create_case.py <case-directory>`. Keep evidence outside Git and never copy credentials, one-time codes, or raw identity documents into chat logs.
3. Read `references/case-format.md` before editing a case. Preserve IDs, file ownership, consent scope, and the case schema version.
4. Start with `00-case.md`, `10-people.md`, and `20-route-options.md`; then delegate rule discovery to `$migration-research` and executable work to `$migration-actions`.

## Operate the case

Treat `30-requirements.md` as a graph, not a generic checklist. Every requirement must have a source ID, a specific affected person, evidence IDs, and actions. Keep the route, departure logistics, and home-country affairs as separate requirement groups.

Update only the designated source documents. Do not edit generated `99-dashboard.md` manually.

Before saying a case is ready, run:

```bash
python3 scripts/validate_case.py <case-directory>
python3 scripts/render_case.py <case-directory>
```

To move a v1 case to v2, preserve the source and run:

```bash
python3 scripts/migrate_case.py <v1-case-directory> <new-v2-case-directory>
```

Report missing evidence, stale sources, unresolved decisions, and actions requiring the person's confirmation. Never call a visa outcome, entry, or legal eligibility guaranteed.

## Required safety boundaries

- Research and drafting are autonomous.
- Pause before submitting a form, booking a paid service, making a payment, sending a communication, or disclosing personal data to a third party.
- Mark identity proofing, biometrics, notarization, legal signatures, and two-factor authentication `human_only`.
- Escalate to a licensed professional for refusals, removals, criminal history, overstays, asylum/humanitarian claims, tax residency disputes, or conflicting official rules.
