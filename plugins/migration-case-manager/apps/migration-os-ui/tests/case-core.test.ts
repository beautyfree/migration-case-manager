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
});
