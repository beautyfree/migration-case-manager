#!/usr/bin/env python3
"""Fetch official case sources and report new, changed, unavailable, and stale records.

The state file stores only source URL, retrieval time, and a content hash. It never
stores page text, personal data, cookies, or credentials.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen


HEADING = re.compile(r"^##\s+(SRC-\d{3,})\b.*$", re.MULTILINE)
FIELD = re.compile(r"^- ([^:]+):\s*(.+)$", re.MULTILINE)


def source_records(text: str) -> list[dict[str, str]]:
    matches = list(HEADING.finditer(text))
    records: list[dict[str, str]] = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        fields = {key.strip(): value.strip() for key, value in FIELD.findall(text[match.end():end])}
        records.append({"id": match.group(1), "url": fields.get("Official URL", ""), "fresh_until": fields.get("Fresh until", "unknown")})
    return records


def normalize(content: bytes) -> bytes:
    return b" ".join(content.split())


def fetch_url(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": "MigrationCaseManager/1.0 source-refresh"})
    with urlopen(request, timeout=20) as response:
        return response.read(2_000_000)


def load_state(path: Path) -> dict[str, object]:
    if not path.is_file():
        return {"schema_version": 1, "sources": {}}
    try:
        state = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"invalid source state file {path}: {error}") from error
    if state.get("schema_version") != 1 or not isinstance(state.get("sources"), dict):
        raise ValueError(f"unsupported source state file: {path}")
    return state


def refresh(case: Path, state_path: Path, today: str, fetcher=fetch_url, dry_run: bool = False) -> list[str]:
    requirements = case / "30-requirements.md"
    if not requirements.is_file():
        raise ValueError(f"missing required source register: {requirements}")
    state = load_state(state_path)
    previous = state["sources"]
    assert isinstance(previous, dict)
    current: dict[str, dict[str, str]] = {}
    report: list[str] = []
    for record in source_records(requirements.read_text(encoding="utf-8")):
        identifier, url, fresh_until = record["id"], record["url"], record["fresh_until"]
        flags: list[str] = []
        old = previous.get(identifier)
        if not url.startswith("https://"):
            flags.append("unavailable (invalid official URL)")
        else:
            try:
                digest = hashlib.sha256(normalize(fetcher(url))).hexdigest()
                if not isinstance(old, dict):
                    flags.append("new")
                elif old.get("url") != url or old.get("content_sha256") != digest:
                    flags.append("changed")
                else:
                    flags.append("unchanged")
                current[identifier] = {"url": url, "retrieved": today, "content_sha256": digest}
            except (OSError, URLError, ValueError) as error:
                flags.append(f"unavailable ({type(error).__name__})")
                if isinstance(old, dict):
                    current[identifier] = old
        if fresh_until != "unknown" and fresh_until < today:
            flags.append("stale")
        report.append(f"{identifier}: {', '.join(flags)} — {url}")
    if not dry_run:
        state_path.parent.mkdir(parents=True, exist_ok=True)
        state_path.write_text(
            json.dumps({"schema_version": 1, "last_checked": today, "sources": current}, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case_directory", type=Path)
    parser.add_argument("--state-file", type=Path)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    case = args.case_directory.expanduser().resolve()
    if not case.is_dir():
        parser.error(f"not a case directory: {case}")
    state_path = (args.state_file or case / ".migration-os" / "source-state.json").expanduser().resolve()
    try:
        report = refresh(case, state_path, date.today().isoformat(), dry_run=args.dry_run)
    except ValueError as error:
        print(f"ERROR: {error}")
        return 1
    print("Source refresh report")
    for line in report:
        print(f"- {line}")
    print(f"State: {'not written (dry run)' if args.dry_run else state_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
