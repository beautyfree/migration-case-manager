#!/usr/bin/env python3
"""Validate a Migration OS v2 case without reading its evidence files."""

from __future__ import annotations

import argparse
import re
from datetime import date
from pathlib import Path

REQUIRED_FILES = (
    "00-case.md", "10-people.md", "20-route-options.md", "30-requirements.md",
    "40-documents.md", "50-actions.md", "60-timeline.md", "70-finance-logistics.md",
    "80-decisions.md", "90-evidence-index.md", "95-readiness-report.md",
)
OWNER_FILE = {
    "PERSON": "10-people.md", "ROUTE": "20-route-options.md", "SRC": "30-requirements.md",
    "REQ": "30-requirements.md", "DOC": "40-documents.md", "ACT": "50-actions.md",
    "MILESTONE": "60-timeline.md", "LOG": "70-finance-logistics.md", "DEC": "80-decisions.md",
    "EVD": "90-evidence-index.md",
}
REQUIRED_FIELDS = {
    "PERSON": {"Role", "Citizenship", "Current lawful location", "Participation"},
    "ROUTE": {"Destination", "Legal basis", "Country of application", "Applies to", "Status", "Sources", "Decision"},
    "SRC": {"Publisher", "Official URL", "Retrieved", "Updated", "Applies to", "Rule summary", "Fresh until", "Status"},
    "REQ": {"Source", "Applies to", "Condition", "Status", "Evidence", "Actions", "Dependencies", "Conflict", "Review needed"},
    "DOC": {"Owner", "Type", "Status", "Required by", "Evidence", "Issued", "Expires", "Transformations", "Actions"},
    "ACT": {"Purpose", "Requirements", "Dependencies", "Status", "Class", "Owner", "Target", "Deadline", "Expected receipt", "Receipt", "Decision"},
    "MILESTONE": {"Date", "Kind", "Status", "Depends on", "Linked records", "Consequence if missed"},
    "LOG": {"Area", "Status", "Applies to", "Actions", "Decision", "Notes"},
    "DEC": {"Decision maker", "Status", "Scope", "Options considered", "Chosen option", "Decided", "Expires", "Linked records"},
    "EVD": {"Kind", "Owner", "Storage reference", "Verified", "Status", "Supports"},
}
STATUS = {
    "REQ": {"unknown", "researching", "needs_evidence", "in_progress", "ready", "submitted", "blocked", "not_applicable"},
    "DOC": {"unknown", "missing", "requested", "received", "needs_transformation", "ready", "expired", "rejected", "not_applicable"},
    "ACT": {"not_started", "in_progress", "waiting_on_user", "scheduled", "submitted", "completed", "cancelled", "blocked"},
    "DEC": {"proposed", "accepted", "superseded", "expired", "rejected"},
    "SRC": {"current", "needs_recheck", "conflicting", "unavailable", "superseded"},
    "ROUTE": {"candidate", "researching", "viable", "not_viable", "selected", "rejected"},
}
DATE_FIELDS = {"Retrieved", "Updated", "Fresh until", "Issued", "Expires", "Deadline", "Date", "Decided", "Expires"}
SENSITIVE = re.compile(r"(?i)(password|passcode|one.time.code|passport[_ -]?number|card[_ -]?number|recovery[_ -]?code)\s*[:=]")
HEADING = re.compile(r"^##\s+((PERSON|ROUTE|SRC|REQ|DOC|ACT|MILESTONE|LOG|DEC|EVD)-\d{3,})\b.*$", re.MULTILINE)
ID_REF = re.compile(r"\b(?:PERSON|ROUTE|SRC|REQ|DOC|ACT|MILESTONE|LOG|DEC|EVD)-\d{3,}\b")
FIELD = re.compile(r"^- ([^:]+):\s*(.+)$", re.MULTILINE)
FRONTMATTER = re.compile(r"^---\n(.*?)\n---\n?", re.DOTALL)
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TRANSFORMATIONS = {"original", "copy", "notarized_copy", "apostille", "legalization", "translation", "certified_translation", "upload"}


def frontmatter(text: str) -> dict[str, str] | None:
    match = FRONTMATTER.match(text)
    if not match:
        return None
    result: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if not line or line.startswith(" ") or ":" not in line:
            continue
        key, value = line.split(":", 1)
        result[key.strip()] = value.strip()
    return result


def records(text: str) -> list[tuple[str, str, dict[str, str]]]:
    matches = list(HEADING.finditer(text))
    result = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        body = text[match.end():end]
        fields = {key.strip(): value.strip() for key, value in FIELD.findall(body)}
        result.append((match.group(1), match.group(2), fields))
    return result


def valid_date(value: str) -> bool:
    if value == "unknown":
        return True
    if not DATE.fullmatch(value):
        return False
    try:
        date.fromisoformat(value)
    except ValueError:
        return False
    return True


def document_chain_error(value: str) -> str | None:
    if value == "none":
        return None
    chain = [item.strip() for item in value.split(",")]
    if not chain or any(item not in TRANSFORMATIONS for item in chain):
        return "contains an unsupported transformation"
    if len(set(chain)) != len(chain):
        return "repeats a transformation"
    if chain[0] != "original":
        return "must begin with original"
    if "apostille" in chain and "legalization" in chain:
        return "cannot require both apostille and legalization"
    if "upload" in chain and chain[-1] != "upload":
        return "must end with upload when upload is required"
    if "translation" in chain and "apostille" in chain and chain.index("translation") < chain.index("apostille"):
        return "must place translation after apostille"
    if "certified_translation" in chain and "apostille" in chain and chain.index("certified_translation") < chain.index("apostille"):
        return "must place certified_translation after apostille"
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case_directory", type=Path)
    args = parser.parse_args()
    case = args.case_directory.expanduser().resolve()
    if not case.is_dir():
        parser.error(f"not a case directory: {case}")
    errors: list[str] = []
    warnings: list[str] = []
    all_text: dict[str, str] = {}
    headers: dict[str, tuple[str, str, dict[str, str]]] = {}
    case_id: str | None = None
    for filename in REQUIRED_FILES:
        path = case / filename
        if not path.is_file():
            errors.append(f"missing required file: {filename}")
            continue
        text = path.read_text(encoding="utf-8")
        all_text[filename] = text
        meta = frontmatter(text)
        if meta is None:
            errors.append(f"missing valid frontmatter: {filename}")
            continue
        if meta.get("schema_version") != "2":
            errors.append(f"{filename} must use schema_version: 2")
        if not meta.get("case_id"):
            errors.append(f"{filename} is missing case_id")
        elif case_id is None:
            case_id = meta["case_id"]
        elif meta["case_id"] != case_id:
            errors.append(f"{filename} case_id does not match {case_id}")
        if SENSITIVE.search(text):
            errors.append(f"possible sensitive value in Markdown: {filename}")
        for identifier, prefix, fields in records(text):
            if OWNER_FILE[prefix] != filename:
                errors.append(f"{identifier} belongs in {OWNER_FILE[prefix]}, not {filename}")
            if identifier in headers:
                errors.append(f"duplicate record definition: {identifier}")
            headers[identifier] = (filename, prefix, fields)
            missing = REQUIRED_FIELDS[prefix] - fields.keys()
            if missing:
                errors.append(f"{identifier} missing fields: {', '.join(sorted(missing))}")
            status = fields.get("Status")
            if prefix in STATUS and status not in STATUS[prefix]:
                errors.append(f"{identifier} has invalid Status: {status}")
            for field_name in DATE_FIELDS & fields.keys():
                if not valid_date(fields[field_name]):
                    errors.append(f"{identifier} has invalid {field_name}: {fields[field_name]}")
    case_meta = frontmatter(all_text.get("00-case.md", "")) or {}
    if case_meta.get("case_status") not in {"draft", "active", "paused", "completed", "archived"}:
        errors.append("00-case.md has invalid case_status")
    if case_meta.get("phase") not in {"explore", "choose_route", "prepare", "apply", "move", "land", "stabilize"}:
        errors.append("00-case.md has invalid phase")
    for filename, text in all_text.items():
        for identifier in ID_REF.findall(text):
            if identifier not in headers:
                errors.append(f"undefined reference {identifier} in {filename}")
    for identifier, (_, prefix, fields) in headers.items():
        if prefix == "SRC":
            url = fields.get("Official URL", "")
            if not url.startswith("https://"):
                errors.append(f"{identifier} Official URL must use https://")
            fresh = fields.get("Fresh until", "unknown")
            if valid_date(fresh) and fresh != "unknown" and date.fromisoformat(fresh) < date.today() and fields.get("Status") == "current":
                errors.append(f"{identifier} is past Fresh until but marked current")
        if prefix == "REQ" and fields.get("Status") in {"ready", "submitted"}:
            source_ids = ID_REF.findall(fields.get("Source", ""))
            if not source_ids or any(headers.get(source_id, ("", "", {}))[2].get("Status") != "current" for source_id in source_ids):
                errors.append(f"{identifier} is {fields['Status']} without a current source")
        if prefix == "DOC":
            chain_error = document_chain_error(fields.get("Transformations", ""))
            if chain_error:
                errors.append(f"{identifier} Transformations {chain_error}")
        if prefix == "REQ":
            conflict = fields.get("Conflict")
            if conflict not in {"none", "needs_reconciliation"}:
                errors.append(f"{identifier} has invalid Conflict: {conflict}")
            source_ids = ID_REF.findall(fields.get("Source", ""))
            has_conflict = any(headers.get(source_id, ("", "", {}))[2].get("Status") == "conflicting" for source_id in source_ids)
            if has_conflict and (fields.get("Status") != "blocked" or conflict != "needs_reconciliation" or fields.get("Review needed") not in {"legal", "human"}):
                errors.append(f"{identifier} must block and escalate conflicting official sources")
        if prefix == "ACT":
            if fields.get("Class") not in {"autonomous", "confirmation_required", "human_only"}:
                errors.append(f"{identifier} has invalid Class")
            if fields.get("Status") == "completed":
                receipt = fields.get("Receipt", "")
                if receipt == "none" and not fields.get("No receipt reason"):
                    errors.append(f"{identifier} completed without receipt or No receipt reason")
                if receipt != "none" and not ID_REF.findall(receipt):
                    errors.append(f"{identifier} completed receipt must reference EVD-*")
                if fields.get("Class") in {"confirmation_required", "human_only"}:
                    decision_ids = ID_REF.findall(fields.get("Decision", ""))
                    if not decision_ids or not any(headers.get(item, ("", "", {}))[2].get("Status") == "accepted" for item in decision_ids):
                        errors.append(f"{identifier} completed without accepted decision")
    readiness = frontmatter(all_text.get("95-readiness-report.md", "")) or {}
    readiness_status = readiness.get("status")
    assessed_at = readiness.get("assessed_at", "unknown")
    if readiness_status not in {"not_assessed", "not_ready", "ready_with_risks", "ready"}:
        errors.append("95-readiness-report.md has invalid status")
    if readiness_status != "not_assessed":
        if not valid_date(assessed_at) or assessed_at == "unknown":
            errors.append("readiness report must have assessed_at date")
        elif (date.today() - date.fromisoformat(assessed_at)).days > 7:
            errors.append("readiness report is older than seven days")
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
