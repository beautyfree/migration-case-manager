import { existsSync, readFileSync } from "node:fs";
import { caseFile, parseFrontmatter, parseRecords } from "./case-core";

const coreAreas = ["housing", "insurance", "connectivity", "transport", "cash", "banking"];
const quality = ["All pages", "Legibility", "Name consistency", "Language", "Legalization check"];
function date(value: string) { return value === "unknown" ? undefined : new Date(`${value}T00:00:00.000Z`); }
function iso(value: Date) { return value.toISOString().slice(0, 10); }
function plusDays(value: Date, days: number) { return new Date(value.valueOf() + days * 86_400_000); }

export function documentDates(caseDir: string, asOf = new Date()) {
  const path = caseFile(caseDir, "documents"); if (!existsSync(path)) throw new Error(`CASE_NOT_FOUND: missing documents file: ${path}`);
  return parseRecords(readFileSync(path, "utf8")).map(item => {
    const f = item.fields, needed = date(f["Needed by"] ?? "unknown"), lead = f["Lead time days"], maximumAge = f["Maximum age days"];
    if (!needed || lead === "unknown" || maximumAge === "unknown") return `${item.id}: insufficient timing data — ${item.title}`;
    const latestOrder = plusDays(needed, -Number(lead)), earliestIssue = plusDays(needed, -Number(maximumAge)), issued = date(f.Issued ?? "unknown"), flags: string[] = [];
    if (issued && issued < earliestIssue) flags.push("issued_too_early"); if (issued && issued > needed) flags.push("issued_after_needed_by"); if (!["received", "ready"].includes(f.Status) && asOf > latestOrder) flags.push("order_too_late");
    return `${item.id}: ${flags.length ? flags.join(", ") : "timing_ok"}; earliest_issue ${iso(earliestIssue)}; latest_order ${iso(latestOrder)} — ${item.title}`;
  });
}
export function documentQuality(caseDir: string) {
  const path = caseFile(caseDir, "documents"); if (!existsSync(path)) throw new Error(`CASE_NOT_FOUND: missing documents file: ${path}`);
  return parseRecords(readFileSync(path, "utf8")).map(item => { const failures = quality.filter(field => item.fields[field] === "fail"), unknown = quality.filter(field => (item.fields[field] ?? "unknown") === "unknown"); const outcome = failures.length ? `fail (${failures.join(", ")})` : unknown.length ? `incomplete (${unknown.join(", ")})` : "pass"; return `${item.id}: ${outcome} — ${item.title}`; });
}
export function logisticsReadiness(caseDir: string) {
  const path = caseFile(caseDir, "landing"); if (!existsSync(path)) throw new Error(`CASE_NOT_FOUND: missing finance/logistics file: ${path}`);
  const records = parseRecords(readFileSync(path, "utf8")), present = new Set(records.map(item => item.fields.Area));
  return [...coreAreas.filter(area => !present.has(area)).map(area => `missing core area: ${area}`), ...records.map(item => `${item.id}: ${item.fields.Area ?? "unknown"}; ${item.fields.Status ?? "unknown"} — ${item.title}`)];
}
export function arrivalPhase(caseDir: string, asOf = new Date()) {
  const path = caseFile(caseDir, "case"); if (!existsSync(path)) throw new Error(`CASE_NOT_FOUND: missing case file: ${path}`);
  const move = parseFrontmatter(readFileSync(path, "utf8")).move_date ?? "unknown"; if (move === "unknown") return "pre_move (move date unknown)";
  const days = Math.floor((Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()) - Date.parse(`${move}T00:00:00Z`)) / 86_400_000);
  return days < 0 ? "pre_move" : days <= 3 ? "arrival_72h" : days <= 30 ? "arrival_30d" : days <= 90 ? "arrival_90d" : "stabilize";
}
