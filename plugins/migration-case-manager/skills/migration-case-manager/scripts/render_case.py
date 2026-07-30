#!/usr/bin/env python3
"""Render a small Markdown dashboard from a case without modifying its source files."""

from __future__ import annotations

import argparse
import re
from datetime import date
from pathlib import Path

FILES = {
    "Requirements": ("20-requirements.md", "REQ"),
    "Documents": ("30-documents.md", "DOC"),
    "Actions": ("40-actions.md", "ACT"),
    "Decisions": ("60-decisions.md", "DEC"),
}


def count_ids(text: str, prefix: str) -> int:
    return len(set(re.findall(rf"\b{prefix}-\d{{3}}\b", text)))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case_directory", type=Path)
    args = parser.parse_args()
    case = args.case_directory.expanduser().resolve()
    if not case.is_dir():
        parser.error(f"not a case directory: {case}")
    lines = ["---", f"generated_at: {date.today().isoformat()}", "source: Markdown case files", "---", "", "# Case dashboard", "", "| Area | Items |", "| --- | ---: |"]
    for label, (filename, prefix) in FILES.items():
        path = case / filename
        count = count_ids(path.read_text(encoding="utf-8"), prefix) if path.exists() else 0
        lines.append(f"| {label} | {count} |")
    actions = (case / "40-actions.md").read_text(encoding="utf-8") if (case / "40-actions.md").exists() else ""
    action_count = count_ids(actions, "ACT")
    pending = len(re.findall(r"confirmation_required|human_only", actions)) if action_count else 0
    lines.extend(["", f"Actions requiring person involvement: {pending}", "", "This is generated. Update the numbered case files, then render again.", ""])
    output = case / "99-dashboard.md"
    output.write_text("\n".join(lines), encoding="utf-8")
    print(f"Rendered dashboard: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
