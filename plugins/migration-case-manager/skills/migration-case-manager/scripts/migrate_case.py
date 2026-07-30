#!/usr/bin/env python3
"""Migrate a v1 Markdown case into a separate v2 directory without touching its source."""

from __future__ import annotations

import argparse
import re
from datetime import date
from pathlib import Path


V1_TO_V2 = {
    "00-case.md": "00-case.md",
    "10-profile.md": "10-people.md",
    "20-requirements.md": "30-requirements.md",
    "30-documents.md": "40-documents.md",
    "40-actions.md": "50-actions.md",
    "50-timeline.md": "60-timeline.md",
    "60-decisions.md": "80-decisions.md",
    "70-evidence-index.md": "90-evidence-index.md",
    "90-readiness-report.md": "95-readiness-report.md",
}
FRONTMATTER = re.compile(r"^---\n(.*?)\n---\n?", re.DOTALL)


def split_frontmatter(text: str) -> tuple[dict[str, str], str]:
    match = FRONTMATTER.match(text)
    if not match:
        return {}, text
    fields: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if not line or line.startswith(" ") or ":" not in line:
            continue
        key, value = line.split(":", 1)
        fields[key.strip()] = value.strip()
    return fields, text[match.end():]


def v2_frontmatter(case_id: str, filename: str, old_fields: dict[str, str]) -> str:
    if filename == "00-case.md":
        old_status = old_fields.get("status", "")
        if old_status in {"discovery", "draft"}:
            case_status, phase = "draft", "explore"
        elif old_status in {"preparation", "in_progress", "active"}:
            case_status, phase = "active", "prepare"
        else:
            case_status, phase = "draft", "explore"
        return (
            "---\n"
            f"case_id: {case_id}\n"
            "schema_version: 2\n"
            f"case_status: {case_status}\n"
            f"phase: {phase}\n"
            f"last_verified: {old_fields.get('last_verified', 'unknown')}\n"
            "move_date: unknown\n"
            "---\n\n"
        )
    if filename == "95-readiness-report.md":
        return (
            "---\n"
            f"case_id: {case_id}\n"
            "schema_version: 2\n"
            "assessed_at: unknown\n"
            "status: not_assessed\n"
            "---\n\n"
        )
    return f"---\ncase_id: {case_id}\nschema_version: 2\n---\n\n"


def write_migrated(path: Path, case_id: str, filename: str, source: Path) -> None:
    fields, body = split_frontmatter(source.read_text(encoding="utf-8"))
    legacy_note = (
        "\n\n## Migrated notes\n\n"
        f"- Migrated from v1 file: `{source.name}`.\n"
        "- Review fields against the v2 contract before treating them as ready.\n"
    )
    migrated = v2_frontmatter(case_id, filename, fields) + body.rstrip() + legacy_note
    if filename == "10-people.md" and not re.search(r"^##\s+PERSON-\d{3,}\b", migrated, re.MULTILINE):
        person_id = re.search(r"\bid:\s*(PERSON-\d{3,})\b", source.read_text(encoding="utf-8"))
        migrated += (
            f"\n## {(person_id.group(1) if person_id else 'PERSON-001')} — Migrated participant\n\n"
            "- Role: primary_applicant\n"
            "- Citizenship: unknown\n"
            "- Current lawful location: unknown\n"
            "- Participation: unknown\n"
            "- Relevant facts: See migrated notes.\n"
            "- Documents: none\n"
        )
    path.write_text(migrated, encoding="utf-8")


def copy_template(template: Path, target: Path, case_id: str) -> None:
    _, body = split_frontmatter(template.read_text(encoding="utf-8"))
    target.write_text(f"---\ncase_id: {case_id}\nschema_version: 2\n---\n\n" + body, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="existing v1 case directory")
    parser.add_argument("destination", type=Path, help="new empty v2 case directory")
    args = parser.parse_args()
    source = args.source.expanduser().resolve()
    destination = args.destination.expanduser().resolve()
    if not source.is_dir():
        parser.error(f"source is not a directory: {source}")
    if destination.exists() and any(destination.iterdir()):
        parser.error(f"refusing to write into non-empty destination: {destination}")
    missing = [filename for filename in V1_TO_V2 if not (source / filename).is_file()]
    if missing:
        parser.error("source does not match v1 case layout; missing: " + ", ".join(missing))
    source_fields, _ = split_frontmatter((source / "00-case.md").read_text(encoding="utf-8"))
    if source_fields.get("schema_version") not in {"1", "1.0"}:
        parser.error("source is not a recognized v1 case (00-case.md schema_version must be 1)")
    case_id = source_fields.get("case_id", "CASE-001")
    warnings = ["Evidence files were not copied; preserve them in their user-controlled encrypted location."]
    destination.mkdir(parents=True, exist_ok=True)
    for old_name, new_name in V1_TO_V2.items():
        write_migrated(destination / new_name, case_id, new_name, source / old_name)
    templates = Path(__file__).resolve().parents[3] / "templates" / "case"
    for filename in ("20-route-options.md", "65-appointments.md", "70-finance-logistics.md"):
        copy_template(templates / filename, destination / filename, case_id)
    (destination / "evidence").mkdir(exist_ok=True)
    (destination / ".gitignore").write_text("evidence/\n99-dashboard.md\n.migration-os/\n", encoding="utf-8")
    report = [
        "---",
        f"case_id: {case_id}",
        "schema_version: 2",
        f"migrated_at: {date.today().isoformat()}",
        "---",
        "",
        "# Migration report",
        "",
        f"Source: `{source}`",
        "",
        "## File mapping",
        "",
    ]
    report.extend(f"- `{old}` → `{new}`" for old, new in V1_TO_V2.items())
    report.extend(["", "## Warnings", ""])
    report.extend(f"- {warning}" for warning in warnings)
    report.extend(["", "## Required follow-up", "", "- Review every migrated record against `case-format.md` before marking it ready or completed.", ""])
    (destination / "98-migration-report.md").write_text("\n".join(report), encoding="utf-8")
    print(f"Migrated v1 case to: {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
