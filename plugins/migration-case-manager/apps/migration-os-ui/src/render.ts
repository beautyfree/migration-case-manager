import { writeFileSync } from "node:fs";
import { caseFile, loadCase, parseFrontmatter, readCaseText } from "./case-core";

const today = () => new Date().toISOString().slice(0, 10);
const line = (item: { id:string; title:string }, detail:string) => `- \`${item.id}\` — ${item.title}: ${detail}`;
const section = (lines:string[], name:string, values:string[], empty:string) => lines.push(`## ${name}`, "", ...(values.length ? values : [`- ${empty}`]), "");
function lane(moveDate:string) { if (moveDate === "unknown") return "pre_move (move date unknown)"; const days = Math.floor((Date.now() - Date.parse(`${moveDate}T00:00:00Z`)) / 86_400_000); return days < 0 ? "pre_move" : days <= 3 ? "arrival_72h" : days <= 30 ? "arrival_30d" : days <= 90 ? "arrival_90d" : "stabilize"; }

export function renderCase(caseDir:string): string {
  const loaded = loadCase(caseDir), meta = parseFrontmatter(readCaseText(caseDir, "case"));
  const req = loaded.collections.requirements, actions = loaded.collections.actions, appointments = loaded.collections.appointments, timeline = loaded.collections.timeline;
  const counts = [["Requirements",req.length],["Documents",loaded.collections.documents.length],["Actions",actions.length],["Milestones",timeline.length],["Appointments",appointments.length],["Decisions",loaded.collections.decisions.length]];
  const blocked = req.filter(x => x.fields.Status === "blocked").map(x => line(x, "blocked"));
  const stale = req.filter(x => x.id.startsWith("SRC-") && (x.fields.Status !== "current" || x.fields["Fresh until"] !== "unknown" && x.fields["Fresh until"] < today())).map(x => line(x, `${x.fields.Status}; fresh until ${x.fields["Fresh until"]}`));
  const human = actions.filter(x => ["confirmation_required","human_only"].includes(x.fields.Class) && !["completed","cancelled"].includes(x.fields.Status)).map(x => line(x, `${x.fields.Class}; ${x.fields.Status}; deadline ${x.fields.Deadline}`));
  const critical = actions.filter(x => !["completed","cancelled"].includes(x.fields.Status) && x.fields.Deadline !== "unknown").sort((a,b) => a.fields.Deadline.localeCompare(b.fields.Deadline)).map(x => line(x, `${x.fields.Status}; deadline ${x.fields.Deadline}`));
  const upcoming = timeline.filter(x => x.fields.Date !== "unknown").sort((a,b) => a.fields.Date.localeCompare(b.fields.Date)).map(x => line(x, `${x.fields.Kind}; ${x.fields.Status}`));
  const activeAppointments = appointments.filter(x => !["completed","cancelled"].includes(x.fields.Status)).map(x => line(x, `${x.fields.Status}; scheduled ${x.fields["Scheduled for"]}`));
  const lines = ["---",`case_id: ${meta.case_id ?? "unknown"}`,"schema_version: 2",`generated_at: ${today()}`,"source: Markdown case files","---","","# Migration OS dashboard","",`Case: ${meta.case_id ?? "unknown"} · ${meta.case_status ?? "unknown"} · ${meta.phase ?? "unknown"}`,`Landing lane: ${lane(meta.move_date ?? "unknown")}`,"","| Area | Records |","| --- | ---: |",...counts.map(([name,count]) => `| ${name} | ${count} |`),""];
  section(lines,"Blockers",blocked,"No blocked requirements recorded."); section(lines,"Actions needing a person",human,"No active confirmation-required or human-only actions."); section(lines,"Source freshness",stale,"No stale or non-current source records."); section(lines,"Appointment lifecycle",activeAppointments,"No active appointments recorded."); section(lines,"Critical-path actions",critical,"No incomplete actions with a deadline."); section(lines,"Upcoming milestones",upcoming,"No dated milestones recorded."); lines.push("This dashboard is generated. Update numbered source files, validate the case, then render again.","");
  const output = caseFile(caseDir, "dashboard"); writeFileSync(output, lines.join("\n"), "utf8"); return output;
}
