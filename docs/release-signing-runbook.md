# Native release signing runbook

This runbook is for maintainers only. Never commit certificates, private keys, notarization passwords, API keys, signing logs containing secrets, or downloaded user cases.

## Preconditions

- A clean tagged commit has passed the native-artifact workflow.
- `checksums.txt` is generated from the exact candidate binaries.
- macOS signing identity, Apple notarization credentials, and a Windows Authenticode certificate are supplied through the release environment's secret store.
- A stable release is withheld if any required signature or notarization result is missing. An explicitly labelled GitHub **preview** may distribute unsigned binaries for technical evaluation only; its release notes must say so prominently and it must never be presented as a non-developer-ready release.

## macOS

1. Sign each Darwin artifact with the Developer ID Application identity and hardened runtime settings appropriate for the standalone executable.
2. Verify with `codesign --verify --deep --strict --verbose=2 <artifact>` and inspect the signing identity.
3. Submit each artifact to Apple notarization and wait for an `Accepted` result. Stapling is supported for app bundles, DMGs, and PKGs; a bare executable has no staple target and Gatekeeper obtains its ticket online.
4. Re-run `codesign` verification and perform the downloaded-binary launch journey on a clean macOS account. `spctl --assess --type execute` may reject a valid bare executable because it is not an app bundle, so it is diagnostic evidence rather than the release decision for this artifact shape.

## Windows

1. Sign each `.exe` using the Authenticode certificate held by the protected signing service; timestamp the signature.
2. Verify it using `Get-AuthenticodeSignature` on a clean Windows machine.
3. Do not publish a Windows binary whose status is not `Valid` in a stable release. An unsigned Windows binary is allowed only in an explicitly labelled preview and must carry the warning in the release notes.

## Publish and rollback

1. Attach only verified binaries, `checksums.txt`, and `checksums.json` to the immutable GitHub release tag. The tag-driven workflow refuses to replace an existing release.
2. State supported targets, signing/notarization status, checksum verification command, no-telemetry declaration, local-data policy, and rollback version in release notes.
3. Bootstrap is version-pinned and requires consent; it must never overwrite the previous verified binary before the new one passes checksum and `doctor`.
4. If a release is withdrawn, mark it as revoked in release notes. Do not replace files at an existing release URL; publish a new fixed version and instruct users to select it explicitly.

## GitHub Actions and npm OIDC

Preview tags named `vX.Y.Z-preview.N` run `.github/workflows/native-artifacts.yml`. After the full standalone matrix passes, it creates a prerelease and publishes the matching `@beautyfree/migration-os` package to npm's `next` dist-tag using GitHub Actions OIDC. The workflow contains no npm token.

Before the first OIDC publication, an npm owner must create the package once and configure its trusted publisher for GitHub repository `beautyfree/migration-case-manager`, workflow file `native-artifacts.yml`, and the `npm publish` action. This bootstrap is required because npm cannot attach a trusted publisher to a package that does not yet exist.
