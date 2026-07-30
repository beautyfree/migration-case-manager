# Native release signing runbook

This runbook is for maintainers only. Never commit certificates, private keys, notarization passwords, API keys, signing logs containing secrets, or downloaded user cases.

## Preconditions

- A clean tagged commit has passed the native-artifact workflow.
- `checksums.txt` is generated from the exact candidate binaries.
- macOS signing identity, Apple notarization credentials, and a Windows Authenticode certificate are supplied through the release environment's secret store.
- The release is withheld if any required signature or notarization result is missing.

## macOS

1. Sign each Darwin artifact with the Developer ID Application identity and hardened runtime settings appropriate for the standalone executable.
2. Verify with `codesign --verify --deep --strict --verbose=2 <artifact>` and inspect the signing identity.
3. Submit each artifact to Apple notarization and wait for an `Accepted` result. Stapling is supported for app bundles, DMGs, and PKGs; a bare executable has no staple target and Gatekeeper obtains its ticket online.
4. Re-run `codesign` verification and perform the downloaded-binary launch journey on a clean macOS account. `spctl --assess --type execute` may reject a valid bare executable because it is not an app bundle, so it is diagnostic evidence rather than the release decision for this artifact shape.

## Windows

1. Sign each `.exe` using the Authenticode certificate held by the protected signing service; timestamp the signature.
2. Verify it using `Get-AuthenticodeSignature` on a clean Windows machine.
3. Do not publish a Windows binary whose status is not `Valid`.

## Publish and rollback

1. Attach only verified binaries, `checksums.txt`, and `checksums.json` to the immutable GitHub release tag.
2. State supported targets, signing/notarization status, checksum verification command, no-telemetry declaration, local-data policy, and rollback version in release notes.
3. Bootstrap is version-pinned and requires consent; it must never overwrite the previous verified binary before the new one passes checksum and `doctor`.
4. If a release is withdrawn, mark it as revoked in release notes. Do not replace files at an existing release URL; publish a new fixed version and instruct users to select it explicitly.
