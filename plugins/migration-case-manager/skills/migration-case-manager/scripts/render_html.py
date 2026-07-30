#!/usr/bin/env python3
"""Render a disposable, read-only local HTML view from a Migration OS v2 case."""

from __future__ import annotations

import argparse
from html import escape
from pathlib import Path

from render_case import meta, records


FILES = {
    "30-requirements.md": "Route graph",
    "40-documents.md": "Documents",
    "50-actions.md": "Actions",
    "60-timeline.md": "Timeline",
    "65-appointments.md": "Appointments",
    "70-finance-logistics.md": "Landing board",
}


def card(identifier: str, title: str, fields: dict[str, object]) -> str:
    rows = "".join(f"<dt>{escape(str(key))}</dt><dd>{escape(str(value))}</dd>" for key, value in fields.items())
    return f"<article><h3>{escape(identifier)} · {escape(title)}</h3><dl>{rows}</dl></article>"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case_directory", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    case = args.case_directory.expanduser().resolve()
    if not case.is_dir():
        parser.error(f"not a case directory: {case}")
    case_file = case / "00-case.md"
    if not case_file.is_file():
        parser.error(f"missing case file: {case_file}")
    case_meta = meta(case_file.read_text(encoding="utf-8"))
    sections = []
    all_items: dict[str, list[dict[str, object]]] = {}
    for filename, label in FILES.items():
        path = case / filename
        items = records(path.read_text(encoding="utf-8")) if path.is_file() else []
        all_items[label] = items
        cards = "".join(card(str(item["id"]), str(item["title"]), item["fields"]) for item in items)
        sections.append(f"<section id='{escape(label.lower().replace(' ', '-'))}'><h2>{escape(label)}</h2>{cards or '<p>No records.</p>'}</section>")
    attention = []
    for item in all_items["Route graph"]:
        fields = item["fields"]
        if fields.get("Status") in {"blocked", "needs_recheck", "conflicting", "unavailable"}:
            attention.append(card(str(item["id"]), str(item["title"]), fields))
    for item in all_items["Actions"]:
        fields = item["fields"]
        if fields.get("Class") in {"confirmation_required", "human_only"} and fields.get("Status") not in {"completed", "cancelled"}:
            attention.append(card(str(item["id"]), str(item["title"]), fields))
    sections.insert(0, f"<section id='readiness'><h2>Readiness and consent queue</h2>{''.join(attention) or '<p>No blocked source/requirement or active consent action.</p>'}</section>")
    output = (args.output or case / "99-dashboard.html").expanduser().resolve()
    html = f"""<!doctype html>
<html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Migration OS · {escape(case_meta.get('case_id', 'unknown'))}</title>
<style>body{{font:16px system-ui,sans-serif;max-width:1100px;margin:32px auto;padding:0 18px;color:#172033;background:#f6f8fb}}header,section{{background:#fff;border:1px solid #dce3ec;border-radius:12px;padding:20px;margin:16px 0}}h1,h2,h3{{margin-top:0}}section{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}}section h2{{grid-column:1/-1}}article{{border-left:4px solid #3a6ea5;padding:12px;background:#f9fbfd}}dl{{display:grid;grid-template-columns:max-content 1fr;gap:6px 12px;margin:0}}dt{{font-weight:600}}dd{{margin:0;overflow-wrap:anywhere}}footer{{color:#52606d;font-size:.9em}}</style></head>
<body><header><h1>Migration OS</h1><p>Case <strong>{escape(case_meta.get('case_id', 'unknown'))}</strong> · {escape(case_meta.get('case_status', 'unknown'))} · {escape(case_meta.get('phase', 'unknown'))}</p><p>Read-only derived output. Markdown remains authoritative; this file may be deleted and regenerated.</p></header>{''.join(sections)}<footer>No network, forms, authentication, evidence files, or edit controls are included.</footer></body></html>"""
    output.write_text(html, encoding="utf-8")
    print(f"Rendered HTML: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
