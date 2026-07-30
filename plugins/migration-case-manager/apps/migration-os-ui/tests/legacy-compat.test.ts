import { afterEach, describe, expect, test } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { retrospectiveReadiness } from "../src/retrospectives";
import { renderStaticHtml } from "../src/static-html";

const cleanup: string[] = [];
function temp(name: string) { const path = mkdtempSync(join(tmpdir(), name)); cleanup.push(path); return path; }
afterEach(() => { while (cleanup.length) rmSync(cleanup.pop()!, { recursive: true, force: true }); });

describe("legacy Python parity", () => {
  test("reports only sanitized completed retrospectives as eligible", () => {
    const directory = temp("migration-os-retros-");
    writeFileSync(join(directory, "draft.md"), "---\r\nsanitized: no\r\ncompleted_at: unknown\r\n---\r\n");
    for (let index = 1; index <= 3; index++) writeFileSync(join(directory, `retro-${index}.md`), `---\nsanitized: yes\ncompleted_at: 2026-07-30\n---\n`);
    expect(retrospectiveReadiness(directory)).toMatchObject({ eligible: 3, minimum: 3, ready: true });
    expect(retrospectiveReadiness(directory).lines).toContain("not eligible: draft.md (sanitized=yes and completed_at required)");
  });

  test("renders a disposable escaped no-network HTML dashboard", () => {
    const root = temp("migration-os-html-"), caseDir = join(root, "case");
    cpSync(join(import.meta.dir, "../../../examples/georgia-russia-ie-family"), caseDir, { recursive: true });
    const output = renderStaticHtml(caseDir), html = readFileSync(output, "utf8");
    expect(html).toContain("Readiness and consent queue");
    expect(html).toContain("Route graph");
    expect(html).toContain("No network, forms, authentication, evidence files, or edit controls are included.");
    expect(html).not.toContain("<script");
  });
});
