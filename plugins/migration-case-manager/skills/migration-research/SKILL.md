---
name: migration-research
description: Research and verify country-specific migration, visa, residency, document, legalization, and pre-departure requirements from official sources. Use when a migration case needs current rules, a document checklist, official links, source conflict resolution, or a recheck of previously collected requirements.
---

# Migration Research

Use this skill only inside an existing case folder or create one with `$migration-case-manager` first. Read `../migration-case-manager/references/case-format.md` before writing.

## Research protocol

1. Read `00-case.md` and `10-profile.md`. State any missing fact that changes eligibility; do not infer it from nationality, name, or travel history.
2. Find requirements in this order: destination immigration authority, destination consulate for the actual country of application, officially appointed application operator, then issuing authority for every required document.
3. Use unofficial sources only to discover a question or operational friction. Never use them as the sole evidence for a requirement.
4. Verify that the page applies to this route, applicant, and point in time. Record its publication/update date when present.
5. Add each claim to `20-requirements.md` and its source to the source register there. Use one requirement per evidence obligation, not one requirement per webpage.

## Source record

For every `SRC-*`, write: official URL, publisher, retrieved date, any page update date, short paraphrased rule, applicable route/person, and `freshness_date`. Mark a conflict rather than selecting a convenient answer. Request legal review if authoritative sources cannot reconcile it.

## Quality gate

Before returning research:

- Map every document claim to a requirement and source.
- Distinguish mandatory, conditional, recommended, and unknown items.
- Identify expiring documents and upstream prerequisites.
- Add actions only as proposals; `$migration-actions` owns execution state.
- Tell the user what was verified today and what must be rechecked later.
