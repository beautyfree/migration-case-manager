---
case_id: CASE-001
schema_version: 2
---

# Action queue

## ACT-001 — Verify travel-document and entry readiness for all travellers

- Purpose: check each traveller's current travel document and confirm that the primary-source entry rule still applies on the intended departure date
- Requirements: REQ-001
- Dependencies: none
- Status: not_started
- Class: human_only
- Owner: PERSON-001
- Target: https://matsne.gov.ge/en/document/view/2867361?publication=4
- Deadline: unknown
- Expected receipt: none
- Receipt: none
- Decision: DEC-001

## ACT-002 — Confirm IE registration path before submitting or paying

- Purpose: compare current NAPR registration method, fee, timing, and personal-liability implications against the planned activity
- Requirements: REQ-002
- Dependencies: ACT-001
- Status: not_started
- Class: confirmation_required
- Owner: agent
- Target: https://napr.gov.ge/en/page/fees-and-terms
- Deadline: unknown
- Expected receipt: EVD-001
- Receipt: none
- Decision: DEC-004

## ACT-003 — Check small-business tax-status eligibility

- Purpose: map the actual activity to Revenue Service eligibility rules before submitting a small-business-status request
- Requirements: REQ-003
- Dependencies: ACT-002
- Status: not_started
- Class: confirmation_required
- Owner: agent
- Target: https://eservices.rs.ge/ServiceRequestNew.aspx?p=331
- Deadline: unknown
- Expected receipt: EVD-002
- Receipt: none
- Decision: DEC-005

## ACT-004 — Obtain a route-specific work-residence assessment

- Purpose: verify the business, income, turnover, and evidence facts against current SDA requirements; do not submit an application
- Requirements: REQ-004
- Dependencies: ACT-002
- Status: not_started
- Class: autonomous
- Owner: agent
- Target: https://sda.gov.ge/en/products/migration-residence-permits/
- Deadline: unknown
- Expected receipt: EVD-003
- Receipt: none
- Decision: none

## ACT-005 — Prepare family-reunification document plan only after residence-path decision

- Purpose: check current family-document, translation, and financial-evidence requirements for spouse and child
- Requirements: REQ-005
- Dependencies: ACT-004
- Status: not_started
- Class: autonomous
- Owner: agent
- Target: https://sda.gov.ge/en/products/migration-residence-permits/
- Deadline: unknown
- Expected receipt: EVD-004
- Receipt: none
- Decision: none
