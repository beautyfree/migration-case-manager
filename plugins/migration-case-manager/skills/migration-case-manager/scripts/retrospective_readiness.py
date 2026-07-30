#!/usr/bin/env python3
"""Check whether sanitized retrospectives are sufficient to start renderer design."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


FRONTMATTER = re.compile(r"^---\n(.*?)\n---", re.DOTALL)


def metadata(path: Path) -> dict[str, str]:
    match = FRONTMATTER.match(path.read_text(encoding="utf-8"))
    if not match:
        return {}
    return {key.strip(): value.strip() for line in match.group(1).splitlines() if ":" in line for key, value in [line.split(":", 1)]}


def report(directory: Path) -> tuple[int, list[str]]:
    files = sorted(directory.glob("*.md")) if directory.is_dir() else []
    eligible = []
    lines = []
    for path in files:
        meta = metadata(path)
        if meta.get("sanitized") == "yes" and meta.get("completed_at") not in {None, "unknown"}:
            eligible.append(path)
            lines.append(f"eligible: {path.name}")
        else:
            lines.append(f"not eligible: {path.name} (sanitized=yes and completed_at required)")
    return len(eligible), lines


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("retrospectives_directory", type=Path)
    args = parser.parse_args()
    count, lines = report(args.retrospectives_directory.expanduser().resolve())
    print(f"Eligible retrospectives: {count}/3 minimum")
    for line in lines:
        print(f"- {line}")
    if count < 3:
        print("Renderer discovery remains blocked: collect 3–5 sanitized real case retrospectives.")
        return 1
    print("Renderer discovery can begin. Review the evidence before selecting views.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
