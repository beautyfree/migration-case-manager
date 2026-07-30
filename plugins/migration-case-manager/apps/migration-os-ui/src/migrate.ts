import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { templates } from "./templates";

const v1ToV2: Record<string, string> = {
  "00-case.md": "00-case.md", "10-profile.md": "10-people.md", "20-requirements.md": "30-requirements.md", "30-documents.md": "40-documents.md", "40-actions.md": "50-actions.md", "50-timeline.md": "60-timeline.md", "60-decisions.md": "80-decisions.md", "70-evidence-index.md": "90-evidence-index.md", "90-readiness-report.md": "95-readiness-report.md"
};

function splitFrontmatter(text: string): [Record<string, string>, string] {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/); if (!match) return [{}, text];
  return [Object.fromEntries(match[1].split("\n").filter(line => line && !line.startsWith(" ") && line.includes(":")).map(line => line.split(/:(.*)/s).slice(0, 2).map(part => part.trim()))), text.slice(match[0].length)];
}
function frontmatter(caseId: string, filename: string, old: Record<string, string>) {
  if (filename === "00-case.md") {
    const oldStatus = old.status ?? "", [caseStatus, phase] = ["discovery", "draft"].includes(oldStatus) ? ["draft", "explore"] : ["preparation", "in_progress", "active"].includes(oldStatus) ? ["active", "prepare"] : ["draft", "explore"];
    return `---\ncase_id: ${caseId}\nschema_version: 2\ncase_status: ${caseStatus}\nphase: ${phase}\nlast_verified: ${old.last_verified ?? "unknown"}\nmove_date: unknown\n---\n\n`;
  }
  if (filename === "95-readiness-report.md") return `---\ncase_id: ${caseId}\nschema_version: 2\nassessed_at: unknown\nstatus: not_assessed\n---\n\n`;
  return `---\ncase_id: ${caseId}\nschema_version: 2\n---\n\n`;
}
function migratedText(caseId: string, filename: string, source: string, sourceName: string) {
  const [old, body] = splitFrontmatter(source);
  let output = `${frontmatter(caseId, filename, old)}${body.trimEnd()}\n\n## Migrated notes\n\n- Migrated from v1 file: \`${sourceName}\`.\n- Review fields against the v2 contract before treating them as ready.\n`;
  if (filename === "10-people.md" && !/^##\s+PERSON-\d{3,}\b/m.test(output)) {
    const personId = source.match(/\bid:\s*(PERSON-\d{3,})\b/)?.[1] ?? "PERSON-001";
    output += `\n## ${personId} — Migrated participant\n\n- Role: primary_applicant\n- Citizenship: unknown\n- Current lawful location: unknown\n- Participation: unknown\n- Relevant facts: See migrated notes.\n- Documents: none\n`;
  }
  return output;
}

export async function migrateCase(sourceDirectory: string, destinationDirectory: string, migratedAt = new Date().toISOString().slice(0, 10)): Promise<{ source: string; destination: string; case_id: string; warnings: string[] }> {
  const source = resolve(sourceDirectory), destination = resolve(destinationDirectory);
  if (!existsSync(source)) throw new Error(`CASE_NOT_FOUND: source is not a directory: ${source}`);
  if (existsSync(destination) && readdirSync(destination).length) throw new Error("CASE_WRITE_REFUSED: refusing to write into non-empty destination");
  const missing = Object.keys(v1ToV2).filter(filename => !existsSync(join(source, filename)));
  if (missing.length) throw new Error(`CASE_INVALID: source does not match v1 case layout; missing: ${missing.join(", ")}`);
  const [sourceFields] = splitFrontmatter(readFileSync(join(source, "00-case.md"), "utf8"));
  if (!["1", "1.0"].includes(sourceFields.schema_version ?? "")) throw new Error("CASE_INVALID: source is not a recognized v1 case (00-case.md schema_version must be 1)");
  const caseId = sourceFields.case_id ?? "CASE-001", warnings = ["Evidence files were not copied; preserve them in their user-controlled encrypted location."];
  mkdirSync(destination, { recursive: true });
  for (const [oldName, newName] of Object.entries(v1ToV2)) writeFileSync(join(destination, newName), migratedText(caseId, newName, readFileSync(join(source, oldName), "utf8"), oldName), "utf8");
  for (const filename of ["20-route-options.md", "65-appointments.md", "70-finance-logistics.md"]) {
    const [, body] = splitFrontmatter(await Bun.file(templates[filename]).text()); writeFileSync(join(destination, filename), `---\ncase_id: ${caseId}\nschema_version: 2\n---\n\n${body}`, "utf8");
  }
  mkdirSync(join(destination, "evidence")); writeFileSync(join(destination, ".gitignore"), "evidence/\n99-dashboard.md\n.migration-os/\n", "utf8");
  const mapping = Object.entries(v1ToV2).map(([oldName, newName]) => `- \`${oldName}\` → \`${newName}\``).join("\n");
  writeFileSync(join(destination, "98-migration-report.md"), `---\ncase_id: ${caseId}\nschema_version: 2\nmigrated_at: ${migratedAt}\n---\n\n# Migration report\n\nSource: \`${source}\`\n\n## File mapping\n\n${mapping}\n\n## Warnings\n\n${warnings.map(warning => `- ${warning}`).join("\n")}\n\n## Required follow-up\n\n- Review every migrated record against \`case-format.md\` before marking it ready or completed.\n`, "utf8");
  return { source, destination, case_id: caseId, warnings };
}
