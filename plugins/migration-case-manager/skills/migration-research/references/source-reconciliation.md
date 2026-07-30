# Source reconciliation

Use this procedure whenever two primary official sources appear to prescribe different outcomes for the same applicant and route.

1. Record each page as its own `SRC-*` record. Preserve publisher, URL, retrieval date, update date, exact applicability, and a short paraphrase; do not overwrite one with the other.
2. Test whether the apparent conflict is caused by route, nationality, country of application, date, document issuer, or applicant role. If the facts distinguish the pages, record the condition in the relevant `REQ-*` and keep both sources current.
3. If the facts do not resolve it, set every contested source `Status: conflicting`. Set the linked requirement `Status: blocked`, `Conflict: needs_reconciliation`, and `Review needed: legal` or `human`.
4. Create an action requesting clarification from the destination authority, actual consulate, or a qualified professional. Mark it `confirmation_required` if it will send personal data or communication.
5. Do not mark the requirement ready until the contradiction is resolved by a newer or more-specific authoritative source, or by a dated written clarification. Preserve superseded sources and explain why they no longer control.

Never resolve a conflict by search ranking, commercial visa advice, forum consensus, or an agent's general knowledge.
