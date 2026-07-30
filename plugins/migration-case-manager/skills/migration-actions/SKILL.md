---
name: migration-actions
description: Convert a verified migration case into safe, consent-aware browser and real-world actions, including document requests, appointments, translations, notarization, insurance research, and application preparation. Use when the user asks an agent to find, prepare, book, submit, or track concrete relocation tasks.
---

# Migration Actions

Read `00-case.md`, `30-requirements.md`, and `80-decisions.md`; then read `../migration-case-manager/references/case-format.md` and [browser-runbook.md](references/browser-runbook.md). Never execute an action based only on a generic checklist.

## Build the action queue

Create one `ACT-*` per externally observable outcome. Include purpose, linked requirements, official URL or selected provider, dependencies, class, expected receipt, deadline, and next owner.

Use these classes exactly:

- `autonomous`: research, compare providers, download a blank form, prepare a draft.
- `confirmation_required`: submit a form, reserve a slot, send a message, disclose data, or begin a payment. Stop at the final irreversible control and present the complete result.
- `human_only`: login challenge/2FA, biometric capture, notarization, identity verification, legal signature, medical examination, in-person handover, and any action the site requires from the person.

For a local provider, read [provider-research.md](references/provider-research.md) before searching. Present the source-linked comparison before selection; never turn a search result into an implied provider choice.

For a dependant, school, pet, lost-document, or already-abroad urgent path, read [resilience-branches.md](references/resilience-branches.md) and create the matching branch before researching. Emergency/safety handoff always takes priority over case bookkeeping.

## Execute safely

1. Verify the website domain and route against `SRC-*` before entering information.
2. Use only data explicitly present in the case or supplied in the current conversation. Ask rather than guess.
3. Before a `confirmation_required` action, show data to be disclosed, cost/currency, cancellation terms if visible, selected time/place, and the final button's effect.
4. After a completed action, write a receipt reference, timestamp, status, and resulting deadline. Never place raw confirmation emails, identity numbers, passwords, or screenshots containing secrets in Markdown.
5. If the requested action is legally risky, requires a declaration of truth, or changes the person’s legal position, mark it `human_only` and explain the exact handoff.

## Completion rule

An action is not complete merely because a page opened. Require the expected receipt, an explicit no-receipt reason, or a user-provided confirmation. Update `60-timeline.md` when an appointment or filing changes the critical path.
