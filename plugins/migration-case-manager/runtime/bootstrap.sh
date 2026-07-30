#!/bin/sh
# Downloads one explicitly selected, checksummed Migration OS release. No auto-update.
set -eu
version=${MIGRATION_OS_VERSION:?Set MIGRATION_OS_VERSION to the release tag, for example v0.1.0.}
base=${MIGRATION_OS_RELEASE_BASE:-https://github.com/beautyfree/migration-case-manager/releases/download}
confirm=${1:-}
os=$(uname -s); arch=$(uname -m)
case "$os/$arch" in
  Darwin/arm64) artifact=migration-os-darwin-arm64 ;;
  Darwin/x86_64) artifact=migration-os-darwin-x64 ;;
  Linux/x86_64) if ldd --version 2>&1 | grep -qi musl; then artifact=migration-os-linux-x64-musl; else artifact=migration-os-linux-x64; fi ;;
  Linux/aarch64|Linux/arm64) if ldd --version 2>&1 | grep -qi musl; then artifact=migration-os-linux-arm64-musl; else artifact=migration-os-linux-arm64; fi ;;
  *) printf '%s\n' "BINARY_UNSUPPORTED_PLATFORM: $os/$arch" >&2; exit 2 ;;
esac
dest=${MIGRATION_OS_HOME:-"$HOME/.local/share/migration-os"}
url="$base/$version/$artifact"
checksums="$base/$version/checksums.txt"
if [ "$confirm" != "--yes-download" ]; then
  printf '%s\n' "Consent required. Would download $url, verify against $checksums, then install to $dest/$artifact. Re-run with --yes-download after user approval."
  exit 3
fi
mkdir -p "$dest"
tmp=$(mktemp "$dest/.${artifact}.XXXXXX")
trap 'rm -f "$tmp"' EXIT HUP INT TERM
curl --fail --location --proto '=https' --tlsv1.2 --connect-timeout 20 --max-time 120 -o "$tmp" "$url"
expected=$(curl --fail --location --proto '=https' --tlsv1.2 --connect-timeout 20 --max-time 30 "$checksums" | awk -v file="$artifact" '$2 == file {print $1}')
[ -n "$expected" ] || { printf '%s\n' "BINARY_CHECKSUM_MISMATCH: artifact is absent from checksums.txt" >&2; exit 1; }
if command -v shasum >/dev/null 2>&1; then actual=$(shasum -a 256 "$tmp" | awk '{print $1}'); else actual=$(sha256sum "$tmp" | awk '{print $1}'); fi
[ "$actual" = "$expected" ] || { printf '%s\n' "BINARY_CHECKSUM_MISMATCH: downloaded file was not installed" >&2; exit 1; }
chmod 700 "$tmp"
mv -f "$tmp" "$dest/$artifact"
trap - EXIT HUP INT TERM
"$dest/$artifact" doctor
