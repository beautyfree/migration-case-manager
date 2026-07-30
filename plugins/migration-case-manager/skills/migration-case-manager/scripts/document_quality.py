#!/usr/bin/env python3
"""Report quality-gate results recorded for documents without accessing evidence files."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


HEADING = re.compile(r"^##\s+(DOC-\d{3,})\s+—\s+(.+)$", re.MULTILINE)
FIELD = re.compile(r"^- ([^:]+):\s*(.+)$", re.MULTILINE)
QUALITY_FIELDS = ("All pages", "Legibility", "Name consistency", "Language", "Legalization check")


def records(text: str) -> list[tuple[str, str, dict[str, str]]]:
    matches = list(HEADING.finditer(text))
    result = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        result.append((match.group(1), match.group(2), {key.strip(): value.strip() for key, value in FIELD.findall(text[match.end():end])}))
    return result


def report(case: Path) -> list[str]:
    path = case / "40-documents.md"
    if not path.is_file():
        raise ValueError(f"missing documents file: {path}")
    lines = []
    for identifier, title, fields in records(path.read_text(encoding="utf-8")):
        results = {field: fields.get(field, "unknown") for field in QUALITY_FIELDS}
        failures = [field for field, value in results.items() if value == "fail"]
        unknown = [field for field, value in results.items() if value == "unknown"]
        if failures:
            outcome = f"fail ({', '.join(failures)})"
        elif unknown:
            outcome = f"incomplete ({', '.join(unknown)})"
        else:
            outcome = "pass"
        lines.append(f"{identifier}: {outcome} — {title}")
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
    print("Document quality report")
    for line in lines:
        print(f"- {line}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
