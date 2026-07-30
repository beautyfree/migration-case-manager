import { existsSync, readFileSync } from "node:fs";
import { caseFile, caseFiles, casePath, parseFrontmatter, parseRecords } from "./case-core";

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
const validDate = (value: string) => value === "unknown" || /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

export type Validation = { ok: boolean; errors: string[]; warnings: string[] };
export function validateCase(caseDir: string): Validation {
  const root = casePath(caseDir), errors: string[] = [], warnings: string[] = [], records = new Map<string, { kind:string; fields:Record<string,string> }>(), texts = new Map<string,string>(); let caseId: string | undefined;
  for (const [name, file] of Object.entries(caseFiles)) {
    if (name === "dashboard") continue;
    const path = caseFile(root, name as keyof typeof caseFiles);
    if (!existsSync(path)) { errors.push(`missing required file: ${file}`); continue; }
    const text = readFileSync(path, "utf8"), meta = parseFrontmatter(text); texts.set(file, text);
    if (!Object.keys(meta).length) { errors.push(`missing valid frontmatter: ${file}`); continue; }
    if (meta.schema_version !== "2") errors.push(`${file} must use schema_version: 2`);
    if (!meta.case_id) errors.push(`${file} is missing case_id`); else if (caseId && caseId !== meta.case_id) errors.push(`${file} case_id does not match ${caseId}`); else caseId = meta.case_id;
    if (sensitive.test(text)) errors.push(`possible sensitive value in Markdown: ${file}`);
    for (const record of parseRecords(text)) { if (owner[record.kind] !== name) errors.push(`${record.id} belongs in ${owner[record.kind]}, not ${file}`); if (records.has(record.id)) errors.push(`duplicate record definition: ${record.id}`); records.set(record.id, record); const missing = (required[record.kind] ?? []).filter(field => !(field in record.fields)); if (missing.length) errors.push(`${record.id} missing fields: ${missing.join(", ")}`); if (statuses[record.kind] && !statuses[record.kind].has(record.fields.Status)) errors.push(`${record.id} has invalid Status: ${record.fields.Status}`); }
  }
  const meta = parseFrontmatter(texts.get("00-case.md") ?? ""); if (!new Set(["draft","active","paused","completed","archived"]).has(meta.case_status)) errors.push("00-case.md has invalid case_status"); if (!new Set(["explore","choose_route","prepare","apply","move","land","stabilize"]).has(meta.phase)) errors.push("00-case.md has invalid phase"); if (!validDate(meta.move_date ?? "")) errors.push("00-case.md must have a valid move_date or unknown");
  for (const [file, text] of texts) for (const id of text.match(refs) ?? []) if (!records.has(id)) errors.push(`undefined reference ${id} in ${file}`);
  for (const [id, record] of records) { const f = record.fields; if (record.kind === "SRC" && !f["Official URL"]?.startsWith("https://")) errors.push(`${id} Official URL must use https://`); if (record.kind === "ACT" && !new Set(["autonomous","confirmation_required","human_only"]).has(f.Class)) errors.push(`${id} has invalid Class`); if (record.kind === "LOG" && !new Set(["insurance","housing","connectivity","transport","cash","banking","school","pets","other"]).has(f.Area)) errors.push(`${id} has invalid Area: ${f.Area}`); }
  return { ok: errors.length === 0, errors, warnings };
}
