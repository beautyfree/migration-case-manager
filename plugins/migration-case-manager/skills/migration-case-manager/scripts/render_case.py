#!/usr/bin/env python3
"""Render a Markdown dashboard from a Migration OS v2 case without editing its source."""

from __future__ import annotations

import argparse
import re
from datetime import date
from pathlib import Path

HEADING = re.compile(r"^##\s+((?:PERSON|ROUTE|SRC|REQ|DOC|ACT|MILESTONE|LOG|DEC|EVD)-\d{3,})\s+—\s+(.+)$", re.MULTILINE)
FIELD = re.compile(r"^- ([^:]+):\s*(.+)$", re.MULTILINE)
FRONTMATTER = re.compile(r"^---\n(.*?)\n---\n?", re.DOTALL)


def meta(text: str) -> dict[str, str]:
    match = FRONTMATTER.match(text)
    if not match:
        return {}
    return {
        key.strip(): value.strip()
        for line in match.group(1).splitlines()
        if ":" in line and not line.startswith(" ")
        for key, value in [line.split(":", 1)]
    }


def records(text: str) -> list[dict[str, object]]:
    matches = list(HEADING.finditer(text))
    result: list[dict[str, object]] = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        fields = {key.strip(): value.strip() for key, value in FIELD.findall(text[match.end():end])}
        result.append({"id": match.group(1), "title": match.group(2), "fields": fields})
    return result


def line(record: dict[str, object], detail: str) -> str:
    return f"- `{record['id']}` — {record['title']}: {detail}"


def render_section(lines: list[str], heading: str, entries: list[str], empty: str) -> None:
    lines.extend([f"## {heading}", ""])
    lines.extend(entries or [f"- {empty}"])
    lines.append("")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case_directory", type=Path)
    args = parser.parse_args()
    case = args.case_directory.expanduser().resolve()
    if not case.is_dir():
        parser.error(f"not a case directory: {case}")
    files = {
        "30-requirements.md": "Requirements",
        "40-documents.md": "Documents",
        "50-actions.md": "Actions",
        "60-timeline.md": "Milestones",
        "80-decisions.md": "Decisions",
    }
    contents = {filename: (case / filename).read_text(encoding="utf-8") for filename in files if (case / filename).is_file()}
    case_meta = meta((case / "00-case.md").read_text(encoding="utf-8")) if (case / "00-case.md").is_file() else {}
    grouped = {label: records(contents.get(filename, "")) for filename, label in files.items()}
    counts = {label: len(items) for label, items in grouped.items()}
    blocked = [line(item, str(item["fields"].get("Status", "unknown"))) for item in grouped["Requirements"] if item["fields"].get("Status") == "blocked"]
    source_records = [item for item in grouped["Requirements"] if str(item["id"]).startswith("SRC-")]
    stale_sources: list[str] = []
    for item in source_records:
        fields = item["fields"]
        fresh = str(fields.get("Fresh until", "unknown"))
        status = str(fields.get("Status", "unknown"))
        if status != "current" or (fresh != "unknown" and fresh < date.today().isoformat()):
            stale_sources.append(line(item, f"{status}; fresh until {fresh}"))
    human_actions: list[str] = []
    critical_actions: list[tuple[str, str]] = []
    for item in grouped["Actions"]:
        fields = item["fields"]
        status = str(fields.get("Status", "unknown"))
        action_class = str(fields.get("Class", "unknown"))
        deadline = str(fields.get("Deadline", "unknown"))
        if action_class in {"confirmation_required", "human_only"} and status not in {"completed", "cancelled"}:
            human_actions.append(line(item, f"{action_class}; {status}; deadline {deadline}"))
        if status not in {"completed", "cancelled"} and deadline != "unknown":
            critical_actions.append((deadline, line(item, f"{status}; deadline {deadline}")))
    milestones: list[tuple[str, str]] = []
    for item in grouped["Milestones"]:
        fields = item["fields"]
        milestone_date = str(fields.get("Date", "unknown"))
        if milestone_date != "unknown":
            milestones.append((milestone_date, line(item, f"{fields.get('Kind', 'unknown')}; {fields.get('Status', 'unknown')}")))
    lines = [
        "---",
        f"case_id: {case_meta.get('case_id', 'unknown')}",
        "schema_version: 2",
        f"generated_at: {date.today().isoformat()}",
        "source: Markdown case files",
        "---",
        "",
        "# Migration OS dashboard",
        "",
        f"Case: `{case_meta.get('case_id', 'unknown')}` · {case_meta.get('case_status', 'unknown')} · {case_meta.get('phase', 'unknown')}",
        "",
        "| Area | Records |",
        "| --- | ---: |",
    ]
    lines.extend(f"| {label} | {count} |" for label, count in counts.items())
    lines.append("")
    render_section(lines, "Blockers", blocked, "No blocked requirements recorded.")
    render_section(lines, "Actions needing a person", human_actions, "No active confirmation-required or human-only actions.")
    render_section(lines, "Source freshness", stale_sources, "No stale or non-current source records.")
    render_section(lines, "Critical-path actions", [entry for _, entry in sorted(critical_actions)], "No incomplete actions with a deadline.")
    render_section(lines, "Upcoming milestones", [entry for _, entry in sorted(milestones)], "No dated milestones recorded.")
    lines.extend(["This dashboard is generated. Update numbered source files, validate the case, then render again.", ""])
    output = case / "99-dashboard.md"
    output.write_text("\n".join(lines), encoding="utf-8")
    print(f"Rendered dashboard: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
