# Migration Case Manager

A portable, Markdown-first plugin for planning and executing an international move. It creates a source-backed case folder rather than giving a generic checklist: requirements, documents, deadlines, decisions, action receipts, and handoffs stay linked by stable IDs.

The core is shared by Codex and Claude Code. The platform-specific manifests only make the same `skills/` directory installable in each host.

> [!IMPORTANT]
> This plugin is an operational assistant, not an immigration lawyer. It researches official sources, prepares work, and tracks evidence; it does not guarantee eligibility, a visa outcome, admission, or legal advice.

## What it includes

- `migration-case-manager` — creates, coordinates, validates, and renders a case folder.
- `migration-research` — verifies route-specific requirements from primary official sources.
- `migration-actions` — turns verified work into browser and real-world actions with explicit consent boundaries.
- Markdown case templates plus local `create_case.py`, `validate_case.py`, and `render_case.py` tools.
- A sanitized, source-linked reference case for a Russian family temporarily moving to Georgia and considering an individual entrepreneur path: [`examples/georgia-russia-ie-family`](plugins/migration-case-manager/examples/georgia-russia-ie-family/README.md).

When official sources conflict, preserve both `SRC-*` records, mark the source `conflicting`, and block the linked `REQ-*`; do not select whichever answer looks easier.

## Install in Codex

Add this repository as a plugin marketplace, then install the plugin:

```bash
codex plugin marketplace add beautyfree/migration-case-manager
codex plugin add migration-case-manager@migration-case-manager
```

Start a new Codex task after installation so the new skills are available. Then ask, for example:

```text
Create a migration case for a family moving from the Netherlands to Brazil.
```

To update later, use the Codex plugin manager or remove and re-add the marketplace snapshot before reinstalling.

## Install in Claude Code

Clone the repository and load the plugin root directly:

```bash
git clone https://github.com/beautyfree/migration-case-manager.git
cd migration-case-manager
claude --plugin-dir ./plugins/migration-case-manager
```

Claude exposes the skills under the `migration-case-manager` namespace. Test with:

```text
/migration-case-manager:migration-case-manager
```

For a persistent marketplace installation, add this repository to a Claude Code marketplace once a Claude marketplace manifest is published. The local `--plugin-dir` path above is the supported, reproducible installation path today.

## Use a case

Create a case folder outside the plugin and outside version control containing sensitive evidence:

```bash
python3 plugins/migration-case-manager/skills/migration-case-manager/scripts/create_case.py ~/migration-cases/brazil-dnv-2026
python3 plugins/migration-case-manager/skills/migration-case-manager/scripts/validate_case.py ~/migration-cases/brazil-dnv-2026
python3 plugins/migration-case-manager/skills/migration-case-manager/scripts/render_case.py ~/migration-cases/brazil-dnv-2026
python3 plugins/migration-case-manager/skills/migration-case-manager/scripts/refresh_sources.py ~/migration-cases/brazil-dnv-2026
python3 plugins/migration-case-manager/skills/migration-case-manager/scripts/document_dates.py ~/migration-cases/brazil-dnv-2026
python3 plugins/migration-case-manager/skills/migration-case-manager/scripts/document_quality.py ~/migration-cases/brazil-dnv-2026
python3 plugins/migration-case-manager/skills/migration-case-manager/scripts/create_provider_comparison.py ~/migration-cases/brazil-dnv-2026 ACT-001 --service "certified translator" --city Tbilisi
python3 plugins/migration-case-manager/skills/migration-case-manager/scripts/logistics_readiness.py ~/migration-cases/brazil-dnv-2026
python3 plugins/migration-case-manager/skills/migration-case-manager/scripts/arrival_phase.py ~/migration-cases/brazil-dnv-2026
python3 plugins/migration-case-manager/skills/migration-case-manager/scripts/create_resilience_branch.py ~/migration-cases/brazil-dnv-2026 dependent --owner PERSON-003
```

The generated case contains numbered Markdown source files. `99-dashboard.md` is derived output; update the source files and render again rather than editing it.

The bundled reference case is deliberately incomplete where a legal conclusion depends on personal facts. It shows the operational distinction between entry/stay, IE registration, tax status, a work residence permit, and family reunification; copy records into a private case rather than editing the example.

`refresh_sources.py` records only public URLs, retrieval dates, and content hashes in the ignored `.migration-os/source-state.json`. Its first run reports sources as `new`; subsequent runs detect changed pages, fetch failures, and source records past `Fresh until`.

## Safety model

| Action class | Agent behaviour |
| --- | --- |
| `autonomous` | Research, compare providers, download a blank form, draft. |
| `confirmation_required` | Stop before submission, booking, payment, sending a message, or disclosing data. |
| `human_only` | Leave biometrics, notarization, legal signatures, 2FA, identity checks, and medical examinations to the person. |

Do not put originals, passwords, one-time codes, passport numbers, bank details, or biometrics in the case Markdown. Keep evidence in a user-controlled encrypted location.

## Development checks

```bash
python3 plugins/migration-case-manager/skills/migration-case-manager/scripts/validate_case.py <case-directory>
python3 plugins/migration-case-manager/skills/migration-case-manager/scripts/render_case.py <case-directory>
```

For Claude Code development, test the same plugin with:

```bash
claude --plugin-dir ./plugins/migration-case-manager
```
