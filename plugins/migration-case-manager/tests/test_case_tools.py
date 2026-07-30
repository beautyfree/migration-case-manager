#!/usr/bin/env python3
"""Contract tests for the portable Migration OS case tools."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from urllib.error import URLError


PLUGIN_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = PLUGIN_ROOT / "skills" / "migration-case-manager" / "scripts"

REFRESH_SPEC = importlib.util.spec_from_file_location("refresh_sources", SCRIPTS / "refresh_sources.py")
assert REFRESH_SPEC and REFRESH_SPEC.loader
REFRESH = importlib.util.module_from_spec(REFRESH_SPEC)
REFRESH_SPEC.loader.exec_module(REFRESH)
DATES_SPEC = importlib.util.spec_from_file_location("document_dates", SCRIPTS / "document_dates.py")
assert DATES_SPEC and DATES_SPEC.loader
DATES = importlib.util.module_from_spec(DATES_SPEC)
DATES_SPEC.loader.exec_module(DATES)
QUALITY_SPEC = importlib.util.spec_from_file_location("document_quality", SCRIPTS / "document_quality.py")
assert QUALITY_SPEC and QUALITY_SPEC.loader
QUALITY = importlib.util.module_from_spec(QUALITY_SPEC)
QUALITY_SPEC.loader.exec_module(QUALITY)
LOGISTICS_SPEC = importlib.util.spec_from_file_location("logistics_readiness", SCRIPTS / "logistics_readiness.py")
assert LOGISTICS_SPEC and LOGISTICS_SPEC.loader
LOGISTICS = importlib.util.module_from_spec(LOGISTICS_SPEC)
LOGISTICS_SPEC.loader.exec_module(LOGISTICS)


def run(script: str, *args: Path, expected: int = 0) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        ["python3", str(SCRIPTS / script), *(str(arg) for arg in args)],
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != expected:
        raise AssertionError(f"{script} exited {result.returncode}\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}")
    return result


def append(path: Path, content: str) -> None:
    path.write_text(path.read_text(encoding="utf-8") + content, encoding="utf-8")


def populate_happy_case(case: Path) -> None:
    append(case / "30-requirements.md", """
## SRC-001 — Official source

- Publisher: Example migration authority
- Official URL: https://authority.example/route
- Retrieved: 2026-07-30
- Updated: unknown
- Applies to: ROUTE-001
- Rule summary: Synthetic test source.
- Fresh until: 2026-07-29
- Status: needs_recheck

## REQ-001 — Synthetic blocked requirement

- Source: SRC-001
- Applies to: PERSON-001
- Condition: always
- Status: blocked
- Evidence: EVD-001
- Actions: ACT-001
- Dependencies: none
- Conflict: none
- Review needed: human
""")
    append(case / "50-actions.md", """
## ACT-001 — Attend appointment

- Purpose: Synthetic action for dashboard test.
- Requirements: REQ-001
- Dependencies: none
- Status: waiting_on_user
- Class: human_only
- Owner: PERSON-001
- Target: unknown
- Deadline: 2099-01-02
- Expected receipt: EVD-001
- Receipt: none
- Decision: none
""")
    append(case / "60-timeline.md", """
## MILESTONE-001 — Appointment date

- Date: 2099-01-01
- Kind: appointment
- Status: scheduled
- Depends on: ACT-001
- Linked records: ACT-001
- Consequence if missed: Synthetic test only.
""")
    append(case / "90-evidence-index.md", """
## EVD-001 — Synthetic receipt placeholder

- Kind: receipt
- Owner: PERSON-001
- Storage reference: synthetic-receipt
- Verified: unknown
- Status: pending
- Supports: REQ-001, ACT-001
""")


def make_v1_case(destination: Path) -> None:
    files = {
        "00-case.md": "---\ncase_id: CASE-901\nschema_version: 1\nstatus: discovery\nlast_verified: unknown\n---\n\n# Old case\n",
        "10-profile.md": "---\nparticipants:\n- id: PERSON-001\n---\n\n# Old profile\n",
        "20-requirements.md": "---\nsources: []\n---\n\n# Old requirements\n",
        "30-documents.md": "---\ndocuments: []\n---\n\n# Old documents\n",
        "40-actions.md": "---\nactions: []\n---\n\n# Old actions\n",
        "50-timeline.md": "---\ntimeline: []\n---\n\n# Old timeline\n",
        "60-decisions.md": "---\ndecisions: []\n---\n\n# Old decisions\n",
        "70-evidence-index.md": "---\nevidence: []\n---\n\n# Old evidence\n",
        "90-readiness-report.md": "---\ngenerated_at: unknown\nstatus: not_assessed\n---\n\n# Old readiness\n",
    }
    destination.mkdir()
    for name, content in files.items():
        (destination / name).write_text(content, encoding="utf-8")


class CaseToolsTest(unittest.TestCase):
    def test_happy_case_validates_and_renders_operational_signals(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            case = Path(temp) / "case"
            run("create_case.py", case)
            populate_happy_case(case)
            run("validate_case.py", case)
            run("render_case.py", case)
            dashboard = (case / "99-dashboard.md").read_text(encoding="utf-8")
            self.assertIn("Synthetic blocked requirement", dashboard)
            self.assertIn("Attend appointment", dashboard)
            self.assertIn("needs_recheck", dashboard)
            self.assertIn("Appointment date", dashboard)

    def test_validator_rejects_sensitive_case_content(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            case = Path(temp) / "case"
            run("create_case.py", case)
            append(case / "10-people.md", "\n- Password: must-not-appear\n")
            result = run("validate_case.py", case, expected=1)
            self.assertIn("possible sensitive value", result.stdout)

    def test_logistics_readiness_reports_missing_core_areas_without_financial_data(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            case = Path(temp) / "case"
            run("create_case.py", case)
            append(case / "70-finance-logistics.md", """
## LOG-001 — Synthetic housing work

- Area: housing
- Status: researching
- Applies to: PERSON-001
- Actions: none
- Decision: none
- Notes: compare lease terms after city selection.
""")
            lines = LOGISTICS.report(case)
            self.assertIn("missing core area: insurance", lines)
            self.assertTrue(any("LOG-001: housing; researching" in line for line in lines))
            append(case / "70-finance-logistics.md", "\n- Balance: must-not-appear\n")
            result = run("validate_case.py", case, expected=1)
            self.assertIn("possible sensitive value", result.stdout)

    def test_validator_rejects_silent_official_source_conflict(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            case = Path(temp) / "case"
            run("create_case.py", case)
            append(case / "30-requirements.md", """
## SRC-001 — First official page

- Publisher: Example authority
- Official URL: https://authority.example/a
- Retrieved: 2026-07-30
- Updated: unknown
- Applies to: ROUTE-001
- Rule summary: Synthetic conflict.
- Fresh until: 2099-01-01
- Status: conflicting

## REQ-001 — Incorrectly ready requirement

- Source: SRC-001
- Applies to: PERSON-001
- Condition: always
- Status: ready
- Evidence: none
- Actions: none
- Dependencies: none
- Conflict: none
- Review needed: none
""")
            result = run("validate_case.py", case, expected=1)
            self.assertIn("must block and escalate conflicting official sources", result.stdout)

    def test_validator_rejects_unsafe_document_transformation_chain(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            case = Path(temp) / "case"
            run("create_case.py", case)
            append(case / "40-documents.md", """
## DOC-001 — Synthetic civil-status document

- Owner: PERSON-001
- Type: civil-status document
- Status: needs_transformation
- Required by: none
- Evidence: none
- Issued: unknown
- Expires: unknown
- Transformations: translation, apostille, original, upload
- Actions: none
""")
            result = run("validate_case.py", case, expected=1)
            self.assertIn("must begin with original", result.stdout)

    def test_v1_migration_is_non_destructive_and_valid(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            v1, v2 = root / "v1", root / "v2"
            make_v1_case(v1)
            before = {path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in v1.glob("*.md")}
            run("migrate_case.py", v1, v2)
            after = {path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in v1.glob("*.md")}
            self.assertEqual(before, after)
            self.assertTrue((v2 / "98-migration-report.md").is_file())
            run("validate_case.py", v2)

    def test_source_refresh_detects_new_changed_unavailable_and_stale(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            case = Path(temp) / "case"
            run("create_case.py", case)
            append(case / "30-requirements.md", """
## SRC-001 — Available source

- Publisher: Example authority
- Official URL: https://authority.example/available
- Retrieved: 2026-07-30
- Updated: unknown
- Applies to: ROUTE-001
- Rule summary: Synthetic source.
- Fresh until: 2099-01-01
- Status: current

## SRC-002 — Unavailable source

- Publisher: Example authority
- Official URL: https://authority.example/unavailable
- Retrieved: 2026-07-30
- Updated: unknown
- Applies to: ROUTE-001
- Rule summary: Synthetic source.
- Fresh until: 2026-07-29
- Status: needs_recheck
""")
            state = case / ".migration-os" / "source-state.json"
            def first_fetch(url: str) -> bytes:
                if url.endswith("unavailable"):
                    raise URLError("offline fixture")
                return b"first public page"
            first = REFRESH.refresh(case, state, "2026-07-30", fetcher=first_fetch)
            self.assertIn("SRC-001: new", first[0])
            self.assertIn("SRC-002: unavailable", first[1])
            stored = json.loads(state.read_text(encoding="utf-8"))
            self.assertIn("SRC-001", stored["sources"])
            self.assertNotIn("SRC-002", stored["sources"])
            second = REFRESH.refresh(case, state, "2026-07-31", fetcher=lambda _url: b"changed public page")
            self.assertIn("SRC-001: changed", second[0])
            self.assertIn("SRC-002: new, stale", second[1])

    def test_document_timing_reports_early_and_late_documents(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            case = Path(temp) / "case"
            run("create_case.py", case)
            append(case / "40-documents.md", """
## DOC-001 — Synthetic time-sensitive certificate

- Owner: PERSON-001
- Type: certificate
- Status: requested
- Required by: none
- Evidence: none
- Issued: 2026-01-01
- Expires: unknown
- Needed by: 2026-08-01
- Lead time days: 14
- Maximum age days: 30
- Transformations: original
- All pages: pass
- Legibility: pass
- Name consistency: pass
- Language: pass
- Legalization check: not_applicable
- Actions: none
""")
            lines = DATES.report(case, DATES.date.fromisoformat("2026-07-20"))
            self.assertIn("issued_too_early, order_too_late", lines[0])
            self.assertIn("earliest_issue 2026-07-02", lines[0])
            self.assertIn("latest_order 2026-07-18", lines[0])

    def test_document_quality_blocks_ready_document_with_failed_check(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            case = Path(temp) / "case"
            run("create_case.py", case)
            append(case / "40-documents.md", """
## DOC-001 — Synthetic scanned document

- Owner: PERSON-001
- Type: certificate
- Status: ready
- Required by: none
- Evidence: none
- Issued: unknown
- Expires: unknown
- Needed by: unknown
- Lead time days: unknown
- Maximum age days: unknown
- Transformations: original
- All pages: pass
- Legibility: fail
- Name consistency: pass
- Language: not_applicable
- Legalization check: not_applicable
- Actions: none
""")
            result = run("validate_case.py", case, expected=1)
            self.assertIn("ready without a passed document quality gate", result.stdout)
            self.assertIn("DOC-001: fail (Legibility)", QUALITY.report(case)[0])

    def test_provider_comparison_shell_is_non_destructive(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            case = Path(temp) / "case"
            run("create_case.py", case)
            first = run("create_provider_comparison.py", case, Path("ACT-001"), Path("--service"), Path("translator"), Path("--city"), Path("Tbilisi"), expected=0)
            self.assertIn("Created provider comparison", first.stdout)
            comparison = case / "provider-comparisons" / "ACT-001.md"
            self.assertIn("Requires user confirmation", comparison.read_text(encoding="utf-8"))
            second = run("create_provider_comparison.py", case, Path("ACT-001"), Path("--service"), Path("translator"), Path("--city"), Path("Tbilisi"), expected=2)
            self.assertIn("refusing to overwrite", second.stderr)

    def test_validator_requires_decision_and_receipt_for_confirmed_appointment(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            case = Path(temp) / "case"
            run("create_case.py", case)
            append(case / "65-appointments.md", """
## APPT-001 — Synthetic notary appointment

- Service: notary
- Provider comparison: provider-comparisons/ACT-001.md
- Selected provider: Example Notary
- Participants: PERSON-001
- Scheduled for: 2026-08-10
- Status: confirmed
- Action: ACT-001
- Decision: none
- Receipt: none
- Rescheduled from: none
- Cancellation reason: none
""")
            append(case / "50-actions.md", """
## ACT-001 — Attend synthetic appointment

- Purpose: test appointment lifecycle.
- Requirements: none
- Dependencies: none
- Status: scheduled
- Class: human_only
- Owner: PERSON-001
- Target: unknown
- Deadline: 2026-08-10
- Expected receipt: EVD-001
- Receipt: none
- Decision: none
""")
            result = run("validate_case.py", case, expected=1)
            self.assertIn("confirmed without accepted decision", result.stdout)
            self.assertIn("confirmed without EVD receipt", result.stdout)

    def test_arrival_phase_changes_from_move_date(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            case = Path(temp) / "case"
            run("create_case.py", case)
            case_file = case / "00-case.md"
            case_file.write_text(case_file.read_text(encoding="utf-8").replace("move_date: unknown", "move_date: 2026-07-01"), encoding="utf-8")
            result = run("arrival_phase.py", case, Path("--as-of"), Path("2026-07-03"))
            self.assertIn("arrival_72h", result.stdout)
            result = run("arrival_phase.py", case, Path("--as-of"), Path("2026-07-20"))
            self.assertIn("arrival_30d", result.stdout)

    def test_resilience_branch_is_safe_and_non_destructive(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            case = Path(temp) / "case"
            run("create_case.py", case)
            first = run("create_resilience_branch.py", case, Path("dependent"), Path("--owner"), Path("PERSON-003"))
            self.assertIn("Created resilience branch", first.stdout)
            branch = case / "resilience" / "dependent.md"
            self.assertIn("family-evidence", branch.read_text(encoding="utf-8"))
            second = run("create_resilience_branch.py", case, Path("dependent"), expected=2)
            self.assertIn("refusing to overwrite", second.stderr)


if __name__ == "__main__":
    unittest.main()
