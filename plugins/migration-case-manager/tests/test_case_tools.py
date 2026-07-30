#!/usr/bin/env python3
"""Contract tests for the portable Migration OS case tools."""

from __future__ import annotations

import hashlib
import subprocess
import tempfile
import unittest
from pathlib import Path


PLUGIN_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = PLUGIN_ROOT / "skills" / "migration-case-manager" / "scripts"


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


if __name__ == "__main__":
    unittest.main()
