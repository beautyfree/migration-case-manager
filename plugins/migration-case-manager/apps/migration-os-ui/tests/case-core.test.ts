import { afterEach, describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { assertSafeCaseWrite, loadCase, parseFrontmatter, parseRecords, writeCaseText } from "../src/case-core";
import { validateCase } from "../src/validate";

const cleanup: string[] = [];
function fixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "migration-os-core-"));
  cleanup.push(dir);
  cpSync(join(import.meta.dir, "../../../examples/georgia-russia-ie-family"), join(dir, "case"), { recursive: true });
  return join(dir, "case");
}
afterEach(() => { while (cleanup.length) rmSync(cleanup.pop()!, { recursive: true, force: true }); });

describe("case core", () => {
  test("parses fixture metadata and typed records", () => {
    const caseDir = fixture();
    const loaded = loadCase(caseDir);
    expect(loaded.case.case_id).toBe("CASE-001");
    expect(loaded.collections.requirements.some(item => item.id === "REQ-001" && item.kind === "REQ")).toBe(true);
    expect(parseFrontmatter("---\ncase_id: CASE-X\n---\n")).toEqual({ case_id: "CASE-X" });
    expect(parseRecords("## DOC-001 — Passport\n- Status: unknown\n")[0]).toMatchObject({ id: "DOC-001", kind: "DOC", title: "Passport" });
  });

  test("writes only named source files and rejects sensitive values", () => {
    const caseDir = fixture();
    const original = readFileSync(join(caseDir, "80-decisions.md"), "utf8");
    writeCaseText(caseDir, "decisions", original);
    expect(existsSync(join(caseDir, "80-decisions.md"))).toBe(true);
    expect(() => assertSafeCaseWrite(caseDir, "../escape.md", "safe")).toThrow("CASE_WRITE_REFUSED");
    expect(() => assertSafeCaseWrite(caseDir, "80-decisions.md", "password: secret")).toThrow("CASE_WRITE_REFUSED");
  });

  test("rejects unsafe Markdown and broken references", () => {
    const caseDir = fixture();
    const decisionPath = join(caseDir, "80-decisions.md");
    const original = readFileSync(decisionPath, "utf8");
    writeFileSync(decisionPath, `${original}\n<!-- passport number: 123 -->\n`, "utf8");
    const sensitive = validateCase(caseDir);
    expect(sensitive.ok).toBe(false);
    expect(sensitive.errors.some(error => error.includes("possible sensitive value"))).toBe(true);
  });

  test("matches deterministic Python safety gates for stale sources, documents, actions, and appointments", () => {
    const caseDir = fixture();
    const requirements = join(caseDir, "30-requirements.md");
    writeFileSync(requirements, `${readFileSync(requirements, "utf8")}
## SRC-901 — Conflicting stale official source

- Publisher: Example authority
- Official URL: https://authority.example/rule
- Retrieved: 2026-01-01
- Updated: unknown
- Applies to: ROUTE-001
- Rule summary: Fixture only.
- Fresh until: 2026-01-02
- Status: current

## SRC-902 — Conflicting official source

- Publisher: Example authority
- Official URL: https://authority.example/conflict
- Retrieved: 2026-07-30
- Updated: unknown
- Applies to: ROUTE-001
- Rule summary: Fixture only.
- Fresh until: 2099-01-01
- Status: conflicting

## REQ-901 — Unsafe requirement

- Source: SRC-901, SRC-902
- Applies to: PERSON-001
- Condition: Fixture only.
- Status: ready
- Evidence: none
- Actions: none
- Dependencies: none
- Conflict: none
- Review needed: none
`, "utf8");
    const documents = join(caseDir, "40-documents.md");
    writeFileSync(documents, `${readFileSync(documents, "utf8")}
## DOC-901 — Unsafe document chain

- Owner: PERSON-001
- Type: certificate
- Status: ready
- Required by: REQ-901
- Evidence: none
- Issued: unknown
- Expires: unknown
- Needed by: unknown
- Lead time days: invalid
- Maximum age days: unknown
- Transformations: translation, apostille
- All pages: pass
- Legibility: fail
- Name consistency: pass
- Language: pass
- Legalization check: not_applicable
- Actions: none
`, "utf8");
    const actions = join(caseDir, "50-actions.md");
    writeFileSync(actions, `${readFileSync(actions, "utf8")}
## ACT-901 — Completed without safeguards

- Purpose: Fixture only.
- Requirements: REQ-901
- Dependencies: none
- Status: completed
- Class: human_only
- Owner: PERSON-001
- Target: unknown
- Deadline: unknown
- Expected receipt: EVD-901
- Receipt: none
- Decision: none
`, "utf8");
    const appointments = join(caseDir, "65-appointments.md");
    writeFileSync(appointments, `${readFileSync(appointments, "utf8")}
## APPT-901 — Unauthorised appointment

- Service: notary
- Provider comparison: none
- Selected provider: unknown
- Participants: PERSON-001
- Scheduled for: unknown
- Status: confirmed
- Action: ACT-901
- Decision: none
- Receipt: none
- Rescheduled from: none
- Cancellation reason: none
`, "utf8");
    const errors = validateCase(caseDir, new Date("2026-07-30T00:00:00Z")).errors.join("\n");
    expect(errors).toContain("SRC-901 is past Fresh until but marked current");
    expect(errors).toContain("REQ-901 must block and escalate conflicting official sources");
    expect(errors).toContain("DOC-901 Transformations must begin with original");
    expect(errors).toContain("DOC-901 is ready without a passed document quality gate");
    expect(errors).toContain("ACT-901 completed without receipt or No receipt reason");
    expect(errors).toContain("ACT-901 completed without accepted decision");
    expect(errors).toContain("APPT-901 confirmed without selected provider");
    expect(errors).toContain("APPT-901 confirmed without accepted decision");
  });
});
