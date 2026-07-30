# Migration OS npx launcher

This package is a consent-first launcher, not a JavaScript reimplementation of Migration OS. It downloads the matching standalone native binary from a versioned GitHub release, verifies its SHA-256 from that release, runs `doctor` before activation, then forwards arguments to the binary.

```bash
npx @beautyfree/migration-os --release v0.1.0 --yes-download doctor
npx @beautyfree/migration-os --release v0.1.0 init ~/migration-cases/example
```

The first command must include `--yes-download`; without it the launcher only previews the exact URL, SHA-256, and local destination. Node.js 20 or newer is required for this optional launcher. If Node is unavailable, use the native plugin bootstrapper instead.
