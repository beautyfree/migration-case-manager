#!/usr/bin/env python3
"""Show the current landing workflow lane from a case move_date."""

from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path

from render_case import arrival_lane, meta


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case_directory", type=Path)
    parser.add_argument("--as-of", type=date.fromisoformat, default=date.today())
    args = parser.parse_args()
    path = args.case_directory.expanduser().resolve() / "00-case.md"
    if not path.is_file():
        parser.error(f"missing case file: {path}")
    move_date = meta(path.read_text(encoding="utf-8")).get("move_date", "unknown")
    print(f"Landing lane as of {args.as_of.isoformat()}: {arrival_lane(move_date, args.as_of)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
