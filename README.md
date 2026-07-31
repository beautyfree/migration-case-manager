# Migration Case Manager

A portable, Markdown-first plugin for planning and executing an international move. It creates a source-backed case folder rather than giving a generic checklist: requirements, documents, deadlines, decisions, action receipts, and handoffs stay linked by stable IDs.

The core is shared by Codex and Claude Code. The platform-specific manifests only make the same `skills/` directory installable in each host.

> [!IMPORTANT]
> This plugin is an operational assistant, not an immigration lawyer. It researches official sources, prepares work, and tracks evidence; it does not guarantee eligibility, a visa outcome, admission, or legal advice.

## What it includes

- `migration-case-manager` — creates, coordinates, validates, and renders a case folder.
- `migration-research` — verifies route-specific requirements from primary official sources.
- `migration-actions` — turns verified work into browser and real-world actions with explicit consent boundaries.
- Markdown case templates plus a native, local-only `migration-os` runtime.
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

To update an already installed copy, refresh the marketplace snapshot, reinstall the plugin, and start a **new** Codex task. This matters because a task keeps the skills it had when it started:

```bash
codex plugin marketplace upgrade migration-case-manager
codex plugin remove migration-case-manager@migration-case-manager
codex plugin add migration-case-manager@migration-case-manager
```

After the new task starts, ask it to use `migration-case-manager` explicitly if the request is ambiguous. The skill uses the bundled local Migration OS UI; it must not create a replacement UI.

## Install in Claude Code

Add the marketplace and install the plugin once for your user account:

```bash
claude plugin marketplace add beautyfree/migration-case-manager
claude plugin install migration-case-manager@migration-case-manager
```

Run `/reload-plugins` in an existing Claude Code session (or start a new session). Claude exposes the skills under the `migration-case-manager` namespace. Test with:

```text
/migration-case-manager:migration-case-manager
```

For one-off local development, the direct path remains available:

```bash
claude --plugin-dir ./plugins/migration-case-manager
```

## Use a case

On its first use, the skill previews the platform-matched, version-pinned native download (release URL, SHA-256, and destination) and waits for consent. It then verifies the artifact and its `doctor` result before activation; Python, Node, Bun, and npm are not user runtime requirements.

### Optional `npx` shortcut

After a matching GitHub Release and npm package version are published, users who already have Node.js 20+ may use the small launcher instead of invoking the platform bootstrap script manually. The first public build is deliberately a preview:

```bash
npx migration-os@0.1.0-preview.2 --release v0.1.0-preview.2 --yes-download doctor
npx migration-os@0.1.0-preview.2 --release v0.1.0-preview.2 init ~/migration-cases/example
```

The launcher is not a second JavaScript runtime. It downloads the same platform-matched native binary, checks its release SHA-256, runs `doctor` before activation, and forwards the remaining command. Without `--yes-download`, it only previews the exact download and checksum. It is optional: a machine without Node continues to use the native plugin bootstrap path.

Create a case folder outside the plugin and outside version control containing sensitive evidence:

```bash
migration-os init ~/migration-cases/brazil-dnv-2026
migration-os validate ~/migration-cases/brazil-dnv-2026
migration-os render ~/migration-cases/brazil-dnv-2026
migration-os sources refresh ~/migration-cases/brazil-dnv-2026
migration-os document dates ~/migration-cases/brazil-dnv-2026
migration-os document quality ~/migration-cases/brazil-dnv-2026
migration-os provider comparison ~/migration-cases/brazil-dnv-2026 ACT-001 --service "certified translator" --city Tbilisi
migration-os logistics readiness ~/migration-cases/brazil-dnv-2026
migration-os arrival phase ~/migration-cases/brazil-dnv-2026
migration-os branch create ~/migration-cases/brazil-dnv-2026 dependent --owner PERSON-003
migration-os serve ~/migration-cases/brazil-dnv-2026
```

The generated case contains numbered Markdown source files. `99-dashboard.md` is derived output; update the source files and render again rather than editing it.

The future local UI is governed by a [read-only renderer contract](plugins/migration-case-manager/skills/migration-case-manager/references/renderer-contract.md): it is disposable output from the Markdown case, never a second database.

The bundled reference case is deliberately incomplete where a legal conclusion depends on personal facts. It shows the operational distinction between entry/stay, IE registration, tax status, a work residence permit, and family reunification; copy records into a private case rather than editing the example.

`migration-os sources refresh` records only public URLs, retrieval dates, and content hashes in the ignored `.migration-os/source-state.json`. Its first run reports sources as `new`; subsequent runs detect changed pages, fetch failures, and source records past `Fresh until`.

## Safety model

| Action class | Agent behaviour |
| --- | --- |
| `autonomous` | Research, compare providers, download a blank form, draft. |
| `confirmation_required` | Stop before submission, booking, payment, sending a message, or disclosing data. |
| `human_only` | Leave biometrics, notarization, legal signatures, 2FA, identity checks, and medical examinations to the person. |

Do not put originals, passwords, one-time codes, passport numbers, bank details, or biometrics in the case Markdown. Keep evidence in a user-controlled encrypted location.

## Development checks

```bash
bun --cwd plugins/migration-case-manager/apps/migration-os-ui run test
bun --cwd plugins/migration-case-manager/apps/migration-os-ui run compile
node --test packages/migration-os/test/*.test.mjs
npm pack --dry-run ./packages/migration-os
```

For Claude Code development, test the same plugin with:

```bash
claude --plugin-dir ./plugins/migration-case-manager
```
