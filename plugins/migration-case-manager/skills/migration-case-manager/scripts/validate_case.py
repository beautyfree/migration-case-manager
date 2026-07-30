#!/usr/bin/env python3
"""Validate the portable case contract without reading evidence files."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

REQUIRED = (
    "00-case.md", "10-profile.md", "20-requirements.md", "30-documents.md",
    "40-actions.md", "50-timeline.md", "60-decisions.md", "70-evidence-index.md",
    "90-readiness-report.md",
)
SENSITIVE = re.compile(r"(?i)(password|passcode|one.time.code|passport[_ -]?number|card[_ -]?number)\s*[:=]")
RECORD_HEADING = re.compile(r"^##\s+((?:SRC|REQ|DOC|ACT|DEC|PERSON)-\d{3})\b", re.MULTILINE)


def frontmatter_present(text: str) -> bool:
    return text.startswith("---\n") and "\n---\n" in text[4:]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case_directory", type=Path)
    args = parser.parse_args()
    case = args.case_directory.expanduser().resolve()
    errors: list[str] = []
    warnings: list[str] = []
    seen: dict[str, str] = {}
    if not case.is_dir():
        parser.error(f"not a case directory: {case}")
    for filename in REQUIRED:
        path = case / filename
        if not path.is_file():
            errors.append(f"missing required file: {filename}")
            continue
        text = path.read_text(encoding="utf-8")
        if not frontmatter_present(text):
            errors.append(f"missing YAML frontmatter: {filename}")
        if SENSITIVE.search(text):
            errors.append(f"possible sensitive value in Markdown: {filename}")
        for identifier in RECORD_HEADING.findall(text):
            if identifier in seen:
                warnings.append(f"repeated ID {identifier}: {seen[identifier]}, {filename}")
            else:
                seen[identifier] = filename
    requirements = (case / "20-requirements.md")
    actions = (case / "40-actions.md")
    if requirements.is_file():
        content = requirements.read_text(encoding="utf-8")
        if "REQ-" in content and "SRC-" not in content:
            errors.append("requirements exist without a source record")
    if actions.is_file():
        content = actions.read_text(encoding="utf-8")
        if "ACT-" in content and not re.search(r"\b(autonomous|confirmation_required|human_only)\b", content):
            errors.append("actions exist without an action class")
        if re.search(r"(?i)status:\s*(complete|completed)", content) and "receipt" not in content.lower():
            errors.append("completed action has no receipt reference")
    for message in warnings:
        print(f"WARNING: {message}")
    for message in errors:
        print(f"ERROR: {message}")
    if errors:
        print(f"Case validation failed: {len(errors)} error(s), {len(warnings)} warning(s).")
        return 1
    print(f"Case validation passed: {len(warnings)} warning(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
