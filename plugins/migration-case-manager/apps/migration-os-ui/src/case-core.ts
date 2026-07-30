import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

export const caseFiles = {
  case: "00-case.md",
  people: "10-people.md",
  routes: "20-route-options.md",
  requirements: "30-requirements.md",
  documents: "40-documents.md",
  actions: "50-actions.md",
  timeline: "60-timeline.md",
  appointments: "65-appointments.md",
  landing: "70-finance-logistics.md",
  decisions: "80-decisions.md",
  evidence: "90-evidence-index.md",
  readiness: "95-readiness-report.md",
  dashboard: "99-dashboard.md"
} as const;

export type RecordItem = { id: string; kind: string; title: string; fields: Record<string, string> };
export type CasePayload = { case: { case_id: string; case_status: string; phase: string; case_path: string }; collections: Record<string, RecordItem[]> };

const recordHeading = /^##\s+((PERSON|ROUTE|SRC|REQ|DOC|ACT|MILESTONE|LOG|DEC|EVD|APPT)-\d{3,})\s+—\s+(.+)$/gm;
const fieldLine = /^- ([^:]+):\s*(.+)$/gm;
const sensitive = /(?i:password|passcode|one.time.code|passport[_ -]?number|card[_ -]?number|recovery[_ -]?code|iban|account[_ -]?number|wallet[_ -]?address|bank[_ -]?details|balance)\s*[:=]/;
const writableCaseFiles = new Set(Object.values(caseFiles));

export function parseFrontmatter(text: string): Record<string, string> {
  const hit = text.match(/^---\n([\s\S]*?)\n---/);
  if (!hit) return {};
  return Object.fromEntries(hit[1].split("\n").filter(line => line.includes(":"))
    .map(line => line.split(/:(.*)/s).slice(0, 2).map(part => part.trim())));
}

export function parseRecords(text: string): RecordItem[] {
  const hits = [...text.matchAll(recordHeading)];
  return hits.map((hit, index) => {
    const body = text.slice(hit.index! + hit[0].length, hits[index + 1]?.index);
    const fields = Object.fromEntries([...body.matchAll(fieldLine)].map(field => [field[1].trim(), field[2].trim()]));
    return { id: hit[1], kind: hit[2], title: hit[3], fields };
  });
}

export function casePath(path: string): string { return resolve(path); }
export function caseFile(caseDir: string, name: keyof typeof caseFiles): string { return join(casePath(caseDir), caseFiles[name]); }
export function runtimePath(caseDir: string, filename: string): string { return join(casePath(caseDir), ".migration-os", filename); }

export function readCaseText(caseDir: string, name: keyof typeof caseFiles): string {
  const path = caseFile(caseDir, name);
  if (!existsSync(path)) throw new Error(`CASE_NOT_FOUND: missing case file ${path}`);
  return readFileSync(path, "utf8");
}

export function loadCase(caseDir: string): CasePayload {
  const resolved = casePath(caseDir);
  const meta = parseFrontmatter(readCaseText(resolved, "case"));
  const collections: Record<string, RecordItem[]> = {};
  for (const name of ["requirements", "documents", "actions", "timeline", "appointments", "landing", "decisions"] as const) {
    const path = caseFile(resolved, name);
    collections[name] = existsSync(path) ? parseRecords(readFileSync(path, "utf8")) : [];
  }
  return { case: { case_id: meta.case_id ?? "unknown", case_status: meta.case_status ?? "unknown", phase: meta.phase ?? "unknown", case_path: resolved }, collections };
}

export function assertSafeCaseWrite(caseDir: string, filename: string, text: string): string {
  const root = casePath(caseDir);
  const path = resolve(root, filename);
  if (!writableCaseFiles.has(filename as typeof caseFiles[keyof typeof caseFiles]) || relative(root, path).startsWith(`..${sep}`) || relative(root, path) === "") {
    throw new Error(`CASE_WRITE_REFUSED: ${filename} is not a writable case source file`);
  }
  if (sensitive.test(text)) throw new Error("CASE_WRITE_REFUSED: text contains a restricted sensitive field");
  return path;
}

export function writeCaseText(caseDir: string, filename: keyof typeof caseFiles, text: string): void {
  const path = assertSafeCaseWrite(caseDir, caseFiles[filename], text);
  writeFileSync(path, text, "utf8");
}

export function readJsonLines(path: string): unknown[] {
  return existsSync(path) ? readFileSync(path, "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line)) : [];
}

export function appendJsonLine(path: string, entry: object): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(entry)}\n`, { encoding: "utf8", flag: "a" });
}
