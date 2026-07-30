#!/usr/bin/env python3
"""Create a non-destructive Markdown shell for comparing local migration providers."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


ACTION = re.compile(r"^ACT-\d{3,}$")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case_directory", type=Path)
    parser.add_argument("action_id")
    parser.add_argument("--service", required=True, help="e.g. certified translator or notary")
    parser.add_argument("--city", required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if not ACTION.fullmatch(args.action_id):
        parser.error("action_id must look like ACT-001")
    case = args.case_directory.expanduser().resolve()
    if not case.is_dir():
        parser.error(f"not a case directory: {case}")
    output = (args.output or case / "provider-comparisons" / f"{args.action_id}.md").expanduser().resolve()
    if output.exists():
        parser.error(f"refusing to overwrite existing comparison: {output}")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(f"""# Provider comparison — {args.service}\n\n- Linked action: {args.action_id}\n- City/service area: {args.city}\n- Retrieved: unknown\n- Decision: none\n\n## Candidate 1 — unknown\n\n- URL: unknown\n- Address/service area: unknown\n- Authorization evidence: unknown\n- Availability: unknown\n- Price: unknown\n- Turnaround: unknown\n- Cancellation terms: unknown\n- Language/format capability: unknown\n- Meets linked document chain: unknown\n- Excluded: no\n- Notes: unknown\n\n## Candidate 2 — unknown\n\n- URL: unknown\n- Address/service area: unknown\n- Authorization evidence: unknown\n- Availability: unknown\n- Price: unknown\n- Turnaround: unknown\n- Cancellation terms: unknown\n- Language/format capability: unknown\n- Meets linked document chain: unknown\n- Excluded: no\n- Notes: unknown\n\n## Proposal\n\n- Recommended candidate: unknown\n- Reason: unknown\n- Requires user confirmation before: booking, payment, document disclosure, or message sending\n""", encoding="utf-8")
    print(f"Created provider comparison: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
