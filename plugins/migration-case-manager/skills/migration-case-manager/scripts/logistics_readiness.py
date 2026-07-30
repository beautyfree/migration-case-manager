#!/usr/bin/env python3
"""Summarize non-sensitive landing logistics recorded in a Migration OS case."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


HEADING = re.compile(r"^##\s+(LOG-\d{3,})\s+—\s+(.+)$", re.MULTILINE)
FIELD = re.compile(r"^- ([^:]+):\s*(.+)$", re.MULTILINE)
CORE_AREAS = ("housing", "insurance", "connectivity", "transport", "cash", "banking")


def records(text: str) -> list[tuple[str, str, dict[str, str]]]:
    matches = list(HEADING.finditer(text))
    result = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        result.append((match.group(1), match.group(2), {key.strip(): value.strip() for key, value in FIELD.findall(text[match.end():end])}))
    return result


def report(case: Path) -> list[str]:
    path = case / "70-finance-logistics.md"
    if not path.is_file():
        raise ValueError(f"missing finance/logistics file: {path}")
    entries = records(path.read_text(encoding="utf-8"))
    present = {fields.get("Area") for _, _, fields in entries}
    lines = [f"missing core area: {area}" for area in CORE_AREAS if area not in present]
    for identifier, title, fields in entries:
        lines.append(f"{identifier}: {fields.get('Area', 'unknown')}; {fields.get('Status', 'unknown')} — {title}")
    return lines


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case_directory", type=Path)
    args = parser.parse_args()
    try:
        lines = report(args.case_directory.expanduser().resolve())
    except (ValueError, OSError) as error:
        print(f"ERROR: {error}")
        return 1
    print("Landing logistics report")
    for line in lines:
        print(f"- {line}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
