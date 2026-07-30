import { existsSync, readFileSync } from "node:fs";
import { caseFile, caseFiles, casePath, parseFrontmatter, parseRecords, type RecordItem } from "./case-core";

const owner: Record<string, string> = { PERSON:"people", ROUTE:"routes", SRC:"requirements", REQ:"requirements", DOC:"documents", ACT:"actions", MILESTONE:"timeline", LOG:"landing", DEC:"decisions", EVD:"evidence", APPT:"appointments" };
const required: Record<string, string[]> = {
  PERSON:["Role","Citizenship","Current lawful location","Participation"], ROUTE:["Destination","Legal basis","Country of application","Applies to","Status","Sources","Decision"],
  SRC:["Publisher","Official URL","Retrieved","Updated","Applies to","Rule summary","Fresh until","Status"], REQ:["Source","Applies to","Condition","Status","Evidence","Actions","Dependencies","Conflict","Review needed"],
  DOC:["Owner","Type","Status","Required by","Evidence","Issued","Expires","Needed by","Lead time days","Maximum age days","Transformations","All pages","Legibility","Name consistency","Language","Legalization check","Actions"],
  ACT:["Purpose","Requirements","Dependencies","Status","Class","Owner","Target","Deadline","Expected receipt","Receipt","Decision"], MILESTONE:["Date","Kind","Status","Depends on","Linked records","Consequence if missed"], LOG:["Area","Status","Applies to","Actions","Decision","Notes"], DEC:["Decision maker","Status","Scope","Options considered","Chosen option","Decided","Expires","Linked records"], EVD:["Kind","Owner","Storage reference","Verified","Status","Supports"], APPT:["Service","Provider comparison","Selected provider","Participants","Scheduled for","Status","Action","Decision","Receipt","Rescheduled from","Cancellation reason"]
};
const statuses: Record<string, Set<string>> = {
  REQ:new Set(["unknown","researching","needs_evidence","in_progress","ready","submitted","blocked","not_applicable"]), DOC:new Set(["unknown","missing","requested","received","needs_transformation","ready","expired","rejected","not_applicable"]), ACT:new Set(["not_started","in_progress","waiting_on_user","scheduled","submitted","completed","cancelled","blocked"]), DEC:new Set(["proposed","accepted","superseded","expired","rejected"]), SRC:new Set(["current","needs_recheck","conflicting","unavailable","superseded"]), ROUTE:new Set(["candidate","researching","viable","not_viable","selected","rejected"]), APPT:new Set(["researching","candidate_selected","booking_pending","confirmed","reschedule_requested","rescheduled","cancel_requested","cancelled","completed"]), LOG:new Set(["not_started","researching","waiting_on_user","ready","blocked","not_applicable","completed"])
};
const refs = /\b(?:PERSON|ROUTE|SRC|REQ|DOC|ACT|MILESTONE|LOG|DEC|EVD|APPT)-\d{3,}\b/g;
const sensitive = /(?i:password|passcode|one.time.code|passport[_ -]?number|card[_ -]?number|recovery[_ -]?code|iban|account[_ -]?number|wallet[_ -]?address|bank[_ -]?details|balance)\s*[:=]/;
const dateFields = new Set(["Retrieved", "Updated", "Fresh until", "Issued", "Expires", "Deadline", "Date", "Decided"]);
const transformations = new Set(["original", "copy", "notarized_copy", "apostille", "legalization", "translation", "certified_translation", "upload"]);
const qualityFields = ["All pages", "Legibility", "Name consistency", "Language", "Legalization check"];
const qualityStatuses = new Set(["unknown", "pass", "fail", "not_applicable"]);

function day(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value ? undefined : parsed;
}
function validDate(value: string): boolean { return value === "unknown" || !!day(value); }
function ids(value: string | undefined): string[] { return value?.match(refs) ?? []; }
function transformationError(value: string): string | undefined {
  if (value === "none") return undefined;
  const chain = value.split(",").map(item => item.trim());
  if (!chain.length || chain.some(item => !transformations.has(item))) return "contains an unsupported transformation";
  if (new Set(chain).size !== chain.length) return "repeats a transformation";
  if (chain[0] !== "original") return "must begin with original";
  if (chain.includes("apostille") && chain.includes("legalization")) return "cannot require both apostille and legalization";
  if (chain.includes("upload") && chain.at(-1) !== "upload") return "must end with upload when upload is required";
  if (chain.includes("translation") && chain.includes("apostille") && chain.indexOf("translation") < chain.indexOf("apostille")) return "must place translation after apostille";
  if (chain.includes("certified_translation") && chain.includes("apostille") && chain.indexOf("certified_translation") < chain.indexOf("apostille")) return "must place certified_translation after apostille";
  return undefined;
}
function validDays(value: string): boolean { return value === "unknown" || (/^\d+$/.test(value) && Number(value) >= 0); }
function isCurrent(records: Map<string, RecordItem>, id: string) { return records.get(id)?.fields.Status === "current"; }
function isAccepted(records: Map<string, RecordItem>, id: string) { return records.get(id)?.fields.Status === "accepted"; }

export type Validation = { ok: boolean; errors: string[]; warnings: string[] };
export function validateCase(caseDir: string, now = new Date()): Validation {
  const root = casePath(caseDir), errors: string[] = [], warnings: string[] = [], records = new Map<string, RecordItem>(), texts = new Map<string, string>(); let caseId: string | undefined;
  for (const [name, file] of Object.entries(caseFiles)) {
    if (name === "dashboard") continue;
    const path = caseFile(root, name as keyof typeof caseFiles);
    if (!existsSync(path)) { errors.push(`missing required file: ${file}`); continue; }
    const text = readFileSync(path, "utf8"), meta = parseFrontmatter(text); texts.set(file, text);
    if (!Object.keys(meta).length) { errors.push(`missing valid frontmatter: ${file}`); continue; }
    if (meta.schema_version !== "2") errors.push(`${file} must use schema_version: 2`);
    if (!meta.case_id) errors.push(`${file} is missing case_id`); else if (caseId && caseId !== meta.case_id) errors.push(`${file} case_id does not match ${caseId}`); else caseId = meta.case_id;
    if (sensitive.test(text)) errors.push(`possible sensitive value in Markdown: ${file}`);
    for (const record of parseRecords(text)) {
      if (owner[record.kind] !== name) errors.push(`${record.id} belongs in ${owner[record.kind]}, not ${file}`);
      if (records.has(record.id)) errors.push(`duplicate record definition: ${record.id}`); records.set(record.id, record);
      const missing = (required[record.kind] ?? []).filter(field => !(field in record.fields)); if (missing.length) errors.push(`${record.id} missing fields: ${missing.join(", ")}`);
      if (statuses[record.kind] && !statuses[record.kind].has(record.fields.Status)) errors.push(`${record.id} has invalid Status: ${record.fields.Status}`);
      for (const field of Object.keys(record.fields)) if (dateFields.has(field) && !validDate(record.fields[field])) errors.push(`${record.id} has invalid ${field}: ${record.fields[field]}`);
    }
  }
  const meta = parseFrontmatter(texts.get("00-case.md") ?? "");
  if (!new Set(["draft","active","paused","completed","archived"]).has(meta.case_status)) errors.push("00-case.md has invalid case_status");
  if (!new Set(["explore","choose_route","prepare","apply","move","land","stabilize"]).has(meta.phase)) errors.push("00-case.md has invalid phase");
  if (!("move_date" in meta) || !validDate(meta.move_date)) errors.push("00-case.md must have a valid move_date or unknown");
  for (const [file, text] of texts) for (const id of ids(text)) if (!records.has(id)) errors.push(`undefined reference ${id} in ${file}`);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (const [id, record] of records) {
    const f = record.fields;
    if (record.kind === "SRC") {
      if (!f["Official URL"]?.startsWith("https://")) errors.push(`${id} Official URL must use https://`);
      const fresh = day(f["Fresh until"] ?? ""); if (fresh && fresh < today && f.Status === "current") errors.push(`${id} is past Fresh until but marked current`);
    }
    if (record.kind === "REQ") {
      const sourceIds = ids(f.Source);
      if (["ready", "submitted"].includes(f.Status) && (!sourceIds.length || sourceIds.some(sourceId => !isCurrent(records, sourceId)))) errors.push(`${id} is ${f.Status} without a current source`);
      const conflicts = sourceIds.some(sourceId => records.get(sourceId)?.fields.Status === "conflicting");
      if (!["none", "needs_reconciliation"].includes(f.Conflict)) errors.push(`${id} has invalid Conflict: ${f.Conflict}`);
      if (conflicts && (f.Status !== "blocked" || f.Conflict !== "needs_reconciliation" || !["legal", "human"].includes(f["Review needed"]))) errors.push(`${id} must block and escalate conflicting official sources`);
    }
    if (record.kind === "DOC") {
      const problem = transformationError(f.Transformations ?? ""); if (problem) errors.push(`${id} Transformations ${problem}`);
      for (const field of ["Lead time days", "Maximum age days"]) if (!validDays(f[field] ?? "")) errors.push(`${id} has invalid ${field}: ${f[field]}`);
      for (const field of qualityFields) if (!qualityStatuses.has(f[field])) errors.push(`${id} has invalid ${field}: ${f[field]}`);
      if (f.Status === "ready" && qualityFields.some(field => !["pass", "not_applicable"].includes(f[field]))) errors.push(`${id} is ready without a passed document quality gate`);
    }
    if (record.kind === "ACT") {
      if (!["autonomous", "confirmation_required", "human_only"].includes(f.Class)) errors.push(`${id} has invalid Class`);
      if (f.Status === "completed") {
        const receipt = f.Receipt ?? "";
        if (receipt === "none" && !f["No receipt reason"]) errors.push(`${id} completed without receipt or No receipt reason`);
        if (receipt !== "none" && !ids(receipt).length) errors.push(`${id} completed receipt must reference EVD-*`);
        if (["confirmation_required", "human_only"].includes(f.Class) && !ids(f.Decision).some(decisionId => isAccepted(records, decisionId))) errors.push(`${id} completed without accepted decision`);
      }
    }
    if (record.kind === "LOG" && !["insurance","housing","connectivity","transport","cash","banking","school","pets","other"].includes(f.Area)) errors.push(`${id} has invalid Area: ${f.Area}`);
    if (record.kind === "APPT") {
      if (["confirmed", "completed", "rescheduled"].includes(f.Status) && ["", "unknown"].includes(f["Selected provider"])) errors.push(`${id} ${f.Status} without selected provider`);
      if (["confirmed", "completed", "rescheduled"].includes(f.Status) && ["", "unknown"].includes(f["Scheduled for"])) errors.push(`${id} ${f.Status} without scheduled time`);
      if (["confirmed", "completed"].includes(f.Status) && !ids(f.Decision).some(decisionId => isAccepted(records, decisionId))) errors.push(`${id} ${f.Status} without accepted decision`);
      if (["confirmed", "completed"].includes(f.Status) && !ids(f.Receipt).some(receiptId => receiptId.startsWith("EVD-"))) errors.push(`${id} ${f.Status} without EVD receipt`);
      if (f.Status === "rescheduled" && !ids(f["Rescheduled from"]).some(previous => previous.startsWith("APPT-"))) errors.push(`${id} rescheduled without prior appointment`);
      if (f.Status === "cancelled" && ["", "unknown", "none"].includes(f["Cancellation reason"])) errors.push(`${id} cancelled without reason`);
    }
  }
  const readiness = parseFrontmatter(texts.get("95-readiness-report.md") ?? ""), readinessStatus = readiness.status, assessed = readiness.assessed_at;
  if (!new Set(["not_assessed", "not_ready", "ready_with_risks", "ready"]).has(readinessStatus)) errors.push("95-readiness-report.md has invalid status");
  if (readinessStatus !== "not_assessed") { const assessedDay = day(assessed ?? ""); if (!assessedDay) errors.push("readiness report must have assessed_at date"); else if ((today.valueOf() - assessedDay.valueOf()) / 86_400_000 > 7) errors.push("readiness report is older than seven days"); }
  return { ok: errors.length === 0, errors, warnings };
}
