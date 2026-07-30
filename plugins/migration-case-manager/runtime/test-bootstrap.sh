#!/bin/sh
# Offline regression test for consent preview, checksum verification, and atomic activation.
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
work=$(mktemp -d "${TMPDIR:-/tmp}/migration-os-bootstrap.XXXXXX")
trap 'rm -rf "$work"' EXIT HUP INT TERM
fakebin="$work/fake-bin"
home="$work/home"
mkdir -p "$fakebin"
payload='#!/bin/sh
[ "${1:-}" = doctor ]
'
checksum=$(printf '%s' "$payload" | shasum -a 256 | awk '{print $1}')
printf '%s\n' '#!/bin/sh' 'out=' 'while [ "$#" -gt 0 ]; do' '  if [ "$1" = "-o" ]; then out=$2; shift 2; else shift; fi' 'done' 'if [ -n "$out" ]; then' "  printf '%s' '$payload' > \"\$out\"" 'else' "  for artifact in migration-os-darwin-arm64 migration-os-darwin-x64 migration-os-linux-x64 migration-os-linux-x64-musl migration-os-linux-arm64 migration-os-linux-arm64-musl; do printf '%s  %s\\n' '$checksum' \"\$artifact\"; done" 'fi' > "$fakebin/curl"
chmod 700 "$fakebin/curl"

preview="$work/preview.txt"
set +e
PATH="$fakebin:$PATH" MIGRATION_OS_VERSION=v1.2.3 MIGRATION_OS_HOME="$home" sh "$root/bootstrap.sh" > "$preview" 2>&1
status=$?
set -e
[ "$status" = 3 ]
grep -q 'SHA-256' "$preview"
[ ! -d "$home" ]

PATH="$fakebin:$PATH" MIGRATION_OS_VERSION=v1.2.3 MIGRATION_OS_HOME="$home" sh "$root/bootstrap.sh" --yes-download > "$work/install.txt" 2>&1
installed=$(ls "$home")
"$home/$installed" doctor
printf '%s\n' 'bootstrap smoke: pass'
