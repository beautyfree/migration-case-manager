import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { caseFile, parseRecords, runtimePath } from "./case-core";

type SourceState = { schema_version: 1; last_checked?: string; sources: Record<string, { url: string; retrieved: string; content_sha256: string }> };
type Fetcher = (url: string) => Promise<Uint8Array>;
const maxBytes = 2_000_000, timeoutMs = 20_000;
function today() { return new Date().toISOString().slice(0, 10); }
function validPublicUrl(value: string): URL | undefined {
  try { const url = new URL(value); if (url.protocol !== "https:" || url.port || /^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url.hostname)) return undefined; return url; } catch { return undefined; }
}
async function sha256(bytes: Uint8Array) { return Buffer.from(await crypto.subtle.digest("SHA-256", bytes)).toString("hex"); }
function normalized(bytes: Uint8Array) { return new TextDecoder().decode(bytes).trim().replace(/\s+/g, " "); }
async function fetchPublicSource(initial: string): Promise<Uint8Array> {
  const initialUrl = validPublicUrl(initial); if (!initialUrl) throw new Error("SOURCE_FETCH_REFUSED"); let url = initialUrl;
  for (let redirects = 0; redirects <= 3; redirects++) {
    const response = await fetch(url, { redirect:"manual", signal:AbortSignal.timeout(timeoutMs), headers:{ "User-Agent":"MigrationCaseManager/1.0 source-refresh", "Accept":"text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.1" } });
    if ([301, 302, 303, 307, 308].includes(response.status)) { const next = validPublicUrl(new URL(response.headers.get("location") ?? "", url).toString()); if (!next || next.hostname !== initialUrl.hostname) throw new Error("SOURCE_FETCH_REFUSED"); url = next; continue; }
    if (!response.ok || !response.body) throw new Error("SOURCE_FETCH_FAILED");
    const reader = response.body.getReader(), chunks: Uint8Array[] = []; let total = 0;
    while (true) { const item = await reader.read(); if (item.done) break; total += item.value.byteLength; if (total > maxBytes) throw new Error("SOURCE_FETCH_FAILED"); chunks.push(item.value); }
    const bytes = new Uint8Array(total); let position = 0; for (const chunk of chunks) { bytes.set(chunk, position); position += chunk.byteLength; } return bytes;
  }
  throw new Error("SOURCE_FETCH_REFUSED");
}
function loadState(path: string): SourceState {
  if (!existsSync(path)) return { schema_version:1, sources:{} };
  try { const state = JSON.parse(readFileSync(path, "utf8")); if (state.schema_version !== 1 || !state.sources || typeof state.sources !== "object") throw new Error(); return state; } catch { throw new Error(`CASE_INVALID: invalid or unsupported source state file: ${path}`); }
}
export async function refreshSources(caseDir: string, options: { dryRun?: boolean; asOf?: string; fetcher?: Fetcher } = {}) {
  const requirements = caseFile(caseDir, "requirements"); if (!existsSync(requirements)) throw new Error(`CASE_NOT_FOUND: missing required source register: ${requirements}`);
  const statePath = runtimePath(caseDir, "source-state.json"), state = loadState(statePath), checked = options.asOf ?? today(), current: SourceState["sources"] = {}, lines: string[] = [], fetcher = options.fetcher ?? fetchPublicSource;
  for (const record of parseRecords(readFileSync(requirements, "utf8")).filter(item => item.kind === "SRC")) {
    const url = record.fields["Official URL"] ?? "", old = state.sources[record.id], flags: string[] = [];
    if (!validPublicUrl(url)) flags.push("unavailable (invalid official URL)");
    else try { const digest = await sha256(new TextEncoder().encode(normalized(await fetcher(url)))); flags.push(!old ? "new" : old.url !== url || old.content_sha256 !== digest ? "changed" : "unchanged"); current[record.id] = { url, retrieved:checked, content_sha256:digest }; }
    catch (error) { flags.push(`unavailable (${error instanceof Error && error.message === "SOURCE_FETCH_REFUSED" ? "SourceFetchRefused" : "SourceFetchFailed"})`); if (old) current[record.id] = old; }
    if (record.fields["Fresh until"] !== "unknown" && (record.fields["Fresh until"] ?? "") < checked) flags.push("stale"); lines.push(`${record.id}: ${flags.join(", ")} — ${url}`);
  }
  if (!options.dryRun) { mkdirSync(dirname(statePath), { recursive:true }); writeFileSync(statePath, `${JSON.stringify({ schema_version:1, last_checked:checked, sources:current }, null, 2)}\n`, "utf8"); }
  return { state_path:statePath, written:!options.dryRun, checked, lines };
}
