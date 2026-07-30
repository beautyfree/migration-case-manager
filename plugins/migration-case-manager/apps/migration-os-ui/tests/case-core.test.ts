import { afterEach, describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { assertSafeCaseWrite, loadCase, parseFrontmatter, parseRecords, writeCaseText } from "../src/case-core";
import { validateCase } from "../src/validate";
import { migrateCase } from "../src/migrate";
import { renderCase } from "../src/render";
import { refreshSources } from "../src/source-refresh";

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

  test("migrates a v1 case without modifying its source", async () => {
    const root = mkdtempSync(join(tmpdir(), "migration-os-v1-")); cleanup.push(root);
    const source = join(root, "v1"), destination = join(root, "v2"); mkdirSync(source);
    const files: Record<string, string> = {
      "00-case.md":"---\ncase_id: CASE-901\nschema_version: 1\nstatus: discovery\nlast_verified: unknown\n---\n\n# Old case\n",
      "10-profile.md":"---\nparticipants:\n- id: PERSON-001\n---\n\n# Old profile\n", "20-requirements.md":"---\nsources: []\n---\n\n# Old requirements\n", "30-documents.md":"---\ndocuments: []\n---\n\n# Old documents\n", "40-actions.md":"---\nactions: []\n---\n\n# Old actions\n", "50-timeline.md":"---\ntimeline: []\n---\n\n# Old timeline\n", "60-decisions.md":"---\ndecisions: []\n---\n\n# Old decisions\n", "70-evidence-index.md":"---\nevidence: []\n---\n\n# Old evidence\n", "90-readiness-report.md":"---\ngenerated_at: unknown\nstatus: not_assessed\n---\n\n# Old readiness\n"
    };
    for (const [name, value] of Object.entries(files)) writeFileSync(join(source, name), value);
    const before = Object.fromEntries(Object.keys(files).map(name => [name, readFileSync(join(source, name), "utf8")]));
    await migrateCase(source, destination, "2026-07-30");
    expect(Object.fromEntries(Object.keys(files).map(name => [name, readFileSync(join(source, name), "utf8")]))).toEqual(before);
    expect(validateCase(destination, new Date("2026-07-30T00:00:00Z")).ok).toBe(true);
    expect(readFileSync(join(destination, "98-migration-report.md"), "utf8")).toContain("Evidence files were not copied");
  });

  test("renders the stable Python-compatible dashboard headings", () => {
    const caseDir = fixture();
    const dashboard = readFileSync(renderCase(caseDir), "utf8");
    expect(dashboard).toContain("Case: `CASE-001` · active · choose_route");
    expect(dashboard).toContain("Landing lane: `pre_move (move date unknown)`");
    expect(dashboard).toContain("This dashboard is generated. Update numbered source files, validate the case, then render again.");
  });

  test("refreshes only public source hashes and preserves dry-run state", async () => {
    const caseDir = fixture(), requirements = join(caseDir, "30-requirements.md");
    writeFileSync(requirements, `${readFileSync(requirements, "utf8")}
## SRC-901 — Public fixture source

- Publisher: Example authority
- Official URL: https://authority.example/rule
- Retrieved: 2026-07-30
- Updated: unknown
- Applies to: ROUTE-001
- Rule summary: Fixture only.
- Fresh until: 2099-01-01
- Status: current
`, "utf8");
    const first = await refreshSources(caseDir, { asOf:"2026-07-30", fetcher:async () => new TextEncoder().encode("first public page") });
    expect(first.lines.find(line => line.startsWith("SRC-901:"))).toContain("new");
    const state = readFileSync(join(caseDir, ".migration-os", "source-state.json"), "utf8");
    expect(state).toContain("content_sha256"); expect(state).not.toContain("first public page");
    const unchanged = await refreshSources(caseDir, { asOf:"2026-07-31", dryRun:true, fetcher:async () => new TextEncoder().encode(" first\n public page ") });
    expect(unchanged.lines.find(line => line.startsWith("SRC-901:"))).toContain("unchanged");
    expect(readFileSync(join(caseDir, ".migration-os", "source-state.json"), "utf8")).toBe(state);
  });
});
