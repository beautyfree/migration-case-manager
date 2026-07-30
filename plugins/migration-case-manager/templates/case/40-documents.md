---
case_id: CASE-001
schema_version: 2
---

# Documents

Track document metadata and transformations only. Store originals in a user-controlled encrypted location.

For each document record, use `Needed by: unknown`, `Lead time days: unknown`, and `Maximum age days: unknown` until the applicable authority gives a dated requirement. Use `document_dates.py` to surface early/late ordering risk. Record `All pages`, `Legibility`, `Name consistency`, `Language`, and `Legalization check` as `unknown`, `pass`, `fail`, or `not_applicable`; `document_quality.py` reports the gate without reading evidence.
