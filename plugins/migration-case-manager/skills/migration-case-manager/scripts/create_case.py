#!/usr/bin/env python3
"""Create a non-destructive Markdown case folder from the packaged template."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case_directory", type=Path)
    args = parser.parse_args()
    target = args.case_directory.expanduser().resolve()
    template = Path(__file__).resolve().parents[3] / "templates" / "case"
    if target.exists() and any(target.iterdir()):
        parser.error(f"refusing to write into non-empty directory: {target}")
    target.mkdir(parents=True, exist_ok=True)
    for source in template.glob("*.md"):
        shutil.copy2(source, target / source.name)
    (target / "evidence").mkdir(exist_ok=True)
    gitignore = target / ".gitignore"
    gitignore.write_text("evidence/\n99-dashboard.md\n", encoding="utf-8")
    print(f"Created case: {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
