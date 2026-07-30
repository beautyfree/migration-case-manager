---
case_id: CASE-001
schema_version: 2
---

# Requirements

## Source register

## SRC-001 — Georgia visa-free country list

- Publisher: Legislative Herald of Georgia (Matsne)
- Official URL: https://matsne.gov.ge/en/document/view/2867361?publication=4
- Retrieved: 2026-07-30
- Updated: 2026-02-25
- Applies to: PERSON-001, PERSON-002, PERSON-003
- Rule summary: The consolidated ordinance lists the Russian Federation and says citizens of listed countries may enter and stay without a visa for one full year.
- Fresh until: 2026-08-29
- Status: current

## SRC-002 — IE registration fees and terms

- Publisher: National Agency of Public Registry (NAPR)
- Official URL: https://napr.gov.ge/en/page/fees-and-terms
- Retrieved: 2026-07-30
- Updated: unknown
- Applies to: PERSON-001
- Rule summary: NAPR lists individual-entrepreneur registration fees and turnaround options; current page must be checked before payment.
- Fresh until: 2026-08-06
- Status: current

## SRC-003 — Individual entrepreneur legal form

- Publisher: National Agency of Public Registry (NAPR)
- Official URL: https://www.napr.gov.ge/EN/page/frequently-asked-questions/business-registration-faq
- Retrieved: 2026-07-30
- Updated: unknown
- Applies to: PERSON-001
- Rule summary: An individual entrepreneur is a natural person, not a legal entity, and bears obligations with personal property.
- Fresh until: 2026-08-29
- Status: current

## SRC-004 — Work residence permit

- Publisher: State Services Development Agency (SDA)
- Official URL: https://sda.gov.ge/en/products/migration-residence-permits/
- Retrieved: 2026-07-30
- Updated: unknown
- Applies to: PERSON-001
- Rule summary: SDA describes a work residence permit for an alien performing entrepreneurial activity, including lawful-stay, income, and enterprise-turnover evidence requirements.
- Fresh until: 2026-08-06
- Status: current

## SRC-005 — Family reunification residence permit

- Publisher: State Services Development Agency (SDA)
- Official URL: https://sda.gov.ge/en/products/migration-residence-permits/
- Retrieved: 2026-07-30
- Updated: unknown
- Applies to: PERSON-002, PERSON-003
- Rule summary: SDA describes family reunification for family members of an alien holding a residence permit, with lawful-stay, kinship, and income or bank-evidence requirements.
- Fresh until: 2026-08-06
- Status: current

## SRC-006 — Small-business status application

- Publisher: Revenue Service of Georgia
- Official URL: https://eservices.rs.ge/ServiceRequestNew.aspx?p=331
- Retrieved: 2026-07-30
- Updated: unknown
- Applies to: PERSON-001
- Rule summary: The official form is for a person seeking small-business status; it requires declaring that the activity is not prohibited under the cited special-taxation rules.
- Fresh until: 2026-08-06
- Status: current

## Requirement graph

## REQ-001 — Lawful entry and temporary stay

- Source: SRC-001
- Applies to: PERSON-001, PERSON-002, PERSON-003
- Condition: each traveller holds a qualifying Russian travel document and remains within the applicable lawful-stay period
- Status: needs_evidence
- Evidence: DOC-001, DOC-002, DOC-003
- Actions: ACT-001
- Dependencies: none
- Conflict: none
- Review needed: human

## REQ-002 — Register individual entrepreneur

- Source: SRC-002, SRC-003
- Applies to: PERSON-001
- Condition: after confirming the intended activity, registration method, current NAPR rules, fee, and liability implications
- Status: researching
- Evidence: none
- Actions: ACT-002
- Dependencies: REQ-001
- Conflict: none
- Review needed: human

## REQ-003 — Decide and qualify for a tax status

- Source: SRC-006
- Applies to: PERSON-001
- Condition: planned activity is eligible for the chosen status; no tax status is assumed from IE registration alone
- Status: researching
- Evidence: none
- Actions: ACT-003
- Dependencies: REQ-002
- Conflict: none
- Review needed: tax

## REQ-004 — Work residence permit viability

- Source: SRC-004
- Applies to: PERSON-001
- Condition: primary applicant meets the then-current SDA requirements for entrepreneurial activity, lawful stay, income, turnover, and supporting evidence
- Status: researching
- Evidence: none
- Actions: ACT-004
- Dependencies: REQ-001, REQ-002
- Conflict: none
- Review needed: legal

## REQ-005 — Family reunification route

- Source: SRC-005
- Applies to: PERSON-002, PERSON-003
- Condition: primary applicant holds a qualifying Georgian residence permit and family can prove kinship, lawful stay, and then-current financial requirements
- Status: researching
- Evidence: DOC-004, DOC-005
- Actions: ACT-005
- Dependencies: REQ-004
- Conflict: none
- Review needed: legal
