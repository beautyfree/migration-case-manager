#!/usr/bin/env python3
"""Report document issue/order timing risks without changing a Migration OS case."""

from __future__ import annotations

import argparse
import re
from datetime import date, timedelta
from pathlib import Path


HEADING = re.compile(r"^##\s+(DOC-\d{3,})\s+—\s+(.+)$", re.MULTILINE)
FIELD = re.compile(r"^- ([^:]+):\s*(.+)$", re.MULTILINE)


def records(text: str) -> list[tuple[str, str, dict[str, str]]]:
    matches = list(HEADING.finditer(text))
    result = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        result.append((match.group(1), match.group(2), {key.strip(): value.strip() for key, value in FIELD.findall(text[match.end():end])}))
    return result


def parse_date(value: str) -> date | None:
    return None if value == "unknown" else date.fromisoformat(value)


def report(case: Path, as_of: date) -> list[str]:
    path = case / "40-documents.md"
    if not path.is_file():
        raise ValueError(f"missing documents file: {path}")
    lines: list[str] = []
    for identifier, title, fields in records(path.read_text(encoding="utf-8")):
        needed = parse_date(fields.get("Needed by", "unknown"))
        lead = fields.get("Lead time days", "unknown")
        maximum_age = fields.get("Maximum age days", "unknown")
        if needed is None or lead == "unknown" or maximum_age == "unknown":
            lines.append(f"{identifier}: insufficient timing data — {title}")
            continue
        latest_order = needed - timedelta(days=int(lead))
        earliest_issue = needed - timedelta(days=int(maximum_age))
        issued = parse_date(fields.get("Issued", "unknown"))
        flags: list[str] = []
        if issued and issued < earliest_issue:
            flags.append("issued_too_early")
        if issued and issued > needed:
            flags.append("issued_after_needed_by")
        if fields.get("Status") not in {"received", "ready"} and as_of > latest_order:
            flags.append("order_too_late")
        state = ", ".join(flags) if flags else "timing_ok"
        lines.append(f"{identifier}: {state}; earliest_issue {earliest_issue}; latest_order {latest_order} — {title}")
    return lines


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case_directory", type=Path)
    parser.add_argument("--as-of", type=date.fromisoformat, default=date.today())
    args = parser.parse_args()
    case = args.case_directory.expanduser().resolve()
    try:
        lines = report(case, args.as_of)
    except (ValueError, OSError) as error:
        print(f"ERROR: {error}")
        return 1
    print(f"Document timing report as of {args.as_of.isoformat()}")
    for line in lines:
        print(f"- {line}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
