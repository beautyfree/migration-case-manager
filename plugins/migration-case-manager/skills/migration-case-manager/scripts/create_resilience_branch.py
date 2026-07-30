#!/usr/bin/env python3
"""Create a non-destructive family or recovery branch in a private Migration OS case."""

from __future__ import annotations

import argparse
from pathlib import Path


BRANCHES = {
    "dependent": "Confirm dependant route, care needs, travel-document readiness, and family-evidence questions. Source-link every immigration requirement.",
    "school": "Record child age range, city, language, timing, and the official enrollment authority before comparing schools.",
    "pet": "Record species, route, carrier constraints, and official veterinary/import authority. Keep veterinary evidence outside Markdown.",
    "lost_document": "Contact the relevant issuing authority/consulate and follow its current official recovery path. Identity verification, declarations, police reports, and signatures are human-only.",
    "urgent_abroad": "Prioritize immediate safety, emergency services where needed, lawful-stay status, accommodation, connectivity, and consular contact. Do not wait for research in an emergency.",
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case_directory", type=Path)
    parser.add_argument("branch", choices=sorted(BRANCHES))
    parser.add_argument("--owner", default="unknown", help="safe case identifier such as PERSON-003; never use a name or document number")
    args = parser.parse_args()
    case = args.case_directory.expanduser().resolve()
    if not case.is_dir():
        parser.error(f"not a case directory: {case}")
    output = case / "resilience" / f"{args.branch}.md"
    if output.exists():
        parser.error(f"refusing to overwrite existing branch: {output}")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(f"""# Resilience branch — {args.branch}\n\n- Owner: {args.owner}\n- Status: not_started\n- Trigger: unknown\n- Created: unknown\n\n## Immediate safe steps\n\n- [ ] {BRANCHES[args.branch]}\n- [ ] Add official sources as `SRC-*` and affected requirements as `REQ-*`.\n- [ ] Create consent-aware `ACT-*` records before any submission, booking, payment, or disclosure.\n- [ ] Store originals and receipts outside this Markdown file.\n\n## Current blocker\n\n- [ ] unknown\n""", encoding="utf-8")
    print(f"Created resilience branch: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
