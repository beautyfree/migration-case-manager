# Portable native runtime architecture

This document is the implementation companion to `ROADMAP.md` release R8. It decides how Migration OS becomes usable by a non-developer without turning the plugin into a cloud service.

## Decision

Ship a native `migration-os` executable per supported OS/architecture. Build it with TypeScript and Bun, but do not require Bun, Node, npm, or Python at runtime. The executable owns the local HTTP server, embedded UI, Markdown case operations, and ignored runtime state.

The agent plugin remains the host adapter and operational playbook. It locates or bootstraps the binary, then asks it to perform a bounded local operation. It is not an installer that blindly executes a network download.

`npx` may later be published as a contributor convenience, but it is not a user-facing installation path because it requires a working Node/npm environment.

## Supported artifacts

| Platform | Artifact |
| --- | --- |
| macOS Apple Silicon | `migration-os-darwin-arm64` |
| macOS Intel | `migration-os-darwin-x64` |
| Windows x64 | `migration-os-windows-x64.exe` |
| Windows ARM64 | `migration-os-windows-arm64.exe` |
| Linux x64 glibc | `migration-os-linux-x64` |
| Linux x64 musl | `migration-os-linux-x64-musl` |
| Linux ARM64 glibc | `migration-os-linux-arm64` |
| Linux ARM64 musl | `migration-os-linux-arm64-musl` |

The bootstrapper detects platform, architecture, and Linux libc before it chooses a release artifact. Unsupported platforms fail with a structured recovery message; they never receive a best-guess binary.

## First-use flow

1. User installs the Codex or Claude plugin.
2. User asks the agent to create/open a Migration OS case or visual interface.
3. The agent runs `migration-os doctor` if a verified local binary exists.
4. If it does not, the agent presents version, target, source URL, checksum, local destination, and the fact that it is a binary download. It waits for consent.
5. After consent it downloads the single matching release artifact, verifies SHA-256 before making it executable, and runs `doctor`.
6. The agent runs `init`, `validate`, or `serve`. `serve` opens a loopback URL in the default browser.

Downloads are version-pinned by the plugin release manifest. Updates are explicit; bootstrap never replaces a working binary without consent. A failed update leaves the last verified executable untouched.

## CLI contract

All commands emit a JSON envelope with `ok`, `command`, `result`, and contextual `next_actions`. Errors add a stable `error.code` and a human-readable `fix`. Output must not include raw evidence, browser cookies, credentials, document contents, or unbounded logs.

The initial command tree is:

```text
migration-os doctor
migration-os init <case-directory>
migration-os validate <case-directory>
migration-os render <case-directory>
migration-os serve <case-directory> [--no-browser]
migration-os status <case-directory>
migration-os stop <case-directory>
migration-os sources refresh <case-directory> [--dry-run]
migration-os requests list|claim|complete <case-directory> [request-id]
migration-os branch create <case-directory> <kind> [--owner <person-id>]
migration-os provider comparison <case-directory> <action-id> --service <service> --city <city>
migration-os migrate <v1-case-directory> <v2-case-directory>
```

Markdown is the durable authority. `.migration-os/` stays ignored, local, and disposable. The binary can write only defined case files and its local runtime state; it never stores evidence or secrets.

## Security boundary

- UI server binds only to `127.0.0.1` and creates a fresh token-protected session per run.
- Source refresh is the only networked command; it fetches public source URLs from `SRC-*`, records hashes and dates only, and never uploads case data.
- Research/drafting remains autonomous. Submission, booking, payment, disclosure, messages, signatures, 2FA, biometrics, and notarization retain their existing confirmation/human-only boundaries.
- Each release includes SHA-256 checksums. Public macOS builds require code-signing and notarization; public Windows builds require Authenticode signing.

## Migration away from Python

Port functionality in dependency order: parser/writer and validation first; then creation/rendering/migration; then date/quality/logistics reports and branches; finally source refresh and provider-comparison generation. For every port, retain fixture and negative tests and compare structured output to the Python implementation. Remove a Python entry point from skills only after its TypeScript counterpart reaches parity.

The standalone binary embeds the compiled HTML, JavaScript, and CSS through Bun `type:file` imports. Its release gate includes an isolated test in which only the binary and a copied case folder are present.
