# Provider research runbook

Use this for a translator, notary, apostille service, visa centre, courier, insurer, or temporary-housing provider. It is discovery and comparison work, never authorization to book or pay.

1. Read the linked `DOC-*`, `REQ-*`, `ACT-*`, target city, deadline, and transformation chain. Stop if the service type or location is unknown.
2. Search official registers and the issuing authority first. For a commercial provider, retain its own published URL plus independent confirmation of any claimed authorization.
3. Create a comparison with at least two feasible candidates where the market permits it. For each candidate record: URL, address/service area, earliest availability, quoted price and currency, turnaround, cancellation terms, language/format capability, authorization evidence, and retrieval date. Mark unknown facts `unknown`; do not infer them.
4. Exclude a candidate when the target domain is unverified, its format cannot satisfy the linked `DOC-*`, its timing misses the latest-safe date, or its price/terms are not visible. Preserve the reason.
5. Present the comparison and recommendation as a proposal. Booking, payment, sending a document, or revealing personal details is `confirmation_required`; notarization, identity checks, signatures, and in-person handover are `human_only`.
6. After a person chooses, create a scoped `DEC-*` decision naming the exact candidate, price/currency, appointment (if any), and linked action. Record a safe receipt reference only after completion.

Use `migration-os provider comparison <case-directory> <action-id> --service <service> --city <city>` to create the Markdown comparison shell. It contains no personal data and refuses to overwrite an existing comparison.
