import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { caseFiles, casePath, parseFrontmatter, parseRecords, readCaseText } from "./case-core";

const sections: [keyof typeof caseFiles, string][] = [["requirements", "Route graph"], ["documents", "Documents"], ["actions", "Actions"], ["timeline", "Timeline"], ["appointments", "Appointments"], ["landing", "Landing board"]];
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#x27;", '"':"&quot;" })[character]!);
const card = (id: string, title: string, fields: Record<string, string>) => `<article><h3>${escapeHtml(id)} · ${escapeHtml(title)}</h3><dl>${Object.entries(fields).map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join("")}</dl></article>`;

export function renderStaticHtml(caseDirectory: string, output?: string): string {
  const directory = casePath(caseDirectory), meta = parseFrontmatter(readCaseText(directory, "case"));
  const parsed = new Map(sections.map(([name, label]) => [label, parseRecords(readCaseText(directory, name))]));
  const attention = [
    ...(parsed.get("Route graph") ?? []).filter(item => ["blocked", "needs_recheck", "conflicting", "unavailable"].includes(item.fields.Status)),
    ...(parsed.get("Actions") ?? []).filter(item => ["confirmation_required", "human_only"].includes(item.fields.Class) && !["completed", "cancelled"].includes(item.fields.Status))
  ].map(item => card(item.id, item.title, item.fields)).join("") || "<p>No blocked source/requirement or active consent action.</p>";
  const body = sections.map(([name, label]) => {
    const items = parsed.get(label) ?? [], cards = items.map(item => card(item.id, item.title, item.fields)).join("") || "<p>No records.</p>";
    return `<section id="${label.toLowerCase().replaceAll(" ", "-")}"><h2>${escapeHtml(label)}</h2>${cards}</section>`;
  }).join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Migration OS · ${escapeHtml(meta.case_id ?? "unknown")}</title><style>body{font:16px system-ui,sans-serif;max-width:1100px;margin:32px auto;padding:0 18px;color:#172033;background:#f6f8fb}header,section{background:#fff;border:1px solid #dce3ec;border-radius:12px;padding:20px;margin:16px 0}h1,h2,h3{margin-top:0}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}section h2{grid-column:1/-1}article{border-left:4px solid #3a6ea5;padding:12px;background:#f9fbfd}dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 12px;margin:0}dt{font-weight:600}dd{margin:0;overflow-wrap:anywhere}footer{color:#52606d;font-size:.9em}</style></head><body><header><h1>Migration OS</h1><p>Case <strong>${escapeHtml(meta.case_id ?? "unknown")}</strong> · ${escapeHtml(meta.case_status ?? "unknown")} · ${escapeHtml(meta.phase ?? "unknown")}</p><p>Read-only derived output. Markdown remains authoritative; this file may be deleted and regenerated.</p></header><section id="readiness"><h2>Readiness and consent queue</h2>${attention}</section>${body}<footer>No network, forms, authentication, evidence files, or edit controls are included.</footer></body></html>`;
  const target = resolve(output ?? `${directory}/99-dashboard.html`);
  writeFileSync(target, html, "utf8");
  return target;
}
