#!/usr/bin/env bun
/** Local-only Migration OS UI daemon. Markdown remains the authoritative data source. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { embeddedAssets } from "./embedded-assets";
import { appendJsonLine, caseFile, loadCase, readCaseText, readJsonLines, runtimePath } from "./case-core";
import { validateCase } from "./validate";
import { initCase } from "./operations";
import { renderCase } from "./render";
import { migrateCase } from "./migrate";
import { arrivalPhase, documentDates, documentQuality, logisticsReadiness } from "./reports";
import { createBranch, createProviderComparison } from "./generators";
import { refreshSources } from "./source-refresh";

const cookieName = "migration_os_session";
const root = resolve(import.meta.dir, "..");
const payload = loadCase;
function statePath(caseDir: string) { return runtimePath(caseDir, "ui-session.json"); }
function requestPath(caseDir: string) { return runtimePath(caseDir, "requests.jsonl"); }
function eventPath(caseDir: string) { return runtimePath(caseDir, "events.jsonl"); }
function acceptDecision(caseDir: string, id: string) {
  if (!/^DEC-\d{3,}$/.test(id)) throw new Error("invalid decision ID"); const path = caseFile(caseDir, "decisions"); const text = readCaseText(caseDir, "decisions");
  const match = text.match(new RegExp(`(## ${id}[^\\n]*[\\s\\S]*?\\n- Status:) proposed(\\n)`)); if (!match) throw new Error("decision is not an existing proposed record");
  writeFileSync(path, text.replace(match[0], `${match[1]} accepted${match[2]}`), "utf8"); appendJsonLine(eventPath(caseDir), { kind:"decision_accepted", decision_id:id, at:new Date().toISOString() });
}
function contentType(path: string) { return path.endsWith(".js") ? "text/javascript" : path.endsWith(".css") ? "text/css" : path.endsWith(".html") ? "text/html" : "application/octet-stream"; }
function openBrowser(url: string) { if (process.platform === "darwin") Bun.spawn(["open", url], { stdout:"ignore", stderr:"ignore" }); else if (process.platform === "win32") Bun.spawn(["cmd", "/c", "start", "", url], { stdout:"ignore", stderr:"ignore" }); else Bun.spawn(["xdg-open", url], { stdout:"ignore", stderr:"ignore" }); }
async function serve(caseDir: string, noBrowser: boolean) {
  const casePath = resolve(caseDir); payload(casePath); const token = crypto.randomUUID() + crypto.randomUUID();
  const server = Bun.serve({ hostname:"127.0.0.1", port:0, fetch(request) {
    const url = new URL(request.url); const authed = request.headers.get("cookie")?.includes(`${cookieName}=${token}`) ?? false;
    if (url.pathname === "/" && url.searchParams.get("token") === token) return new Response(null, { status:302, headers:{ Location:"/", "Set-Cookie":`${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/`, "Cache-Control":"no-store" } });
    if (!authed) return new Response("local session token required", { status:403 });
    if (url.pathname === "/api/data") return Response.json(payload(casePath), { headers:{ "Cache-Control":"no-store" } });
    if (url.pathname === "/api/requests" && request.method === "GET") return Response.json(readJsonLines(requestPath(casePath)), { headers:{ "Cache-Control":"no-store" } });
    if (url.pathname === "/api/requests" && request.method === "POST") return request.json().then((body: any) => {
      if (typeof body?.objective !== "string" || body.objective.trim().length < 3 || body.objective.length > 500) return new Response("invalid local request", { status:400 });
      const entry = { id:`REQST-${crypto.randomUUID()}`, type:typeof body.type === "string" ? body.type : "agent_research", objective:body.objective.trim(), status:"pending", created_at:new Date().toISOString() };
      appendJsonLine(requestPath(casePath), entry); appendJsonLine(eventPath(casePath), { kind:"request_created", request_id:entry.id, at:entry.created_at }); return Response.json(entry, { status:201 });
    });
    if (url.pathname === "/api/decisions/accept" && request.method === "POST") return request.json().then((body: any) => { try { if (body?.confirm !== true) return new Response("explicit confirmation required", {status:400}); acceptDecision(casePath, body.id); return Response.json(payload(casePath)); } catch (error) { return new Response(error instanceof Error ? error.message : "invalid decision", {status:400}); } });
    const asset = embeddedAssets[url.pathname];
    if (!asset) return new Response("not found", { status:404 });
    return new Response(Bun.file(asset), { headers:{ "Content-Type":contentType(url.pathname), "Cache-Control":"no-store" } });
  }});
  const dir = dirname(statePath(casePath)); mkdirSync(dir, { recursive:true }); writeFileSync(statePath(casePath), JSON.stringify({ pid:process.pid, port:server.port, started_at:new Date().toISOString(), case_id:payload(casePath).case.case_id }), "utf8");
  const url = `http://127.0.0.1:${server.port}/?token=${token}`; console.log(`Migration OS UI: ${url}`); if (!noBrowser) openBrowser(url);
  const stop = () => { server.stop(true); process.exit(0); }; process.on("SIGINT", stop); process.on("SIGTERM", stop); await new Promise(() => {});
}
function usage() { console.log(JSON.stringify({ ok:false, command:"migration-os", error:{ code:"CASE_INVALID", message:"missing or unsupported command" }, fix:"Run migration-os doctor or consult the installed plugin for the supported command tree.", next_actions:[] })); }
const [command, target, ...flags] = process.argv.slice(2);
function report(commandName: string, execute: () => unknown) {
  try { console.log(JSON.stringify({ ok:true, command:commandName, result:execute(), next_actions:[] })); }
  catch (error) { console.log(JSON.stringify({ ok:false, command:commandName, error:{ code:"CASE_INVALID", message:error instanceof Error ? error.message : "operation failed" }, fix:"Check the case path and command inputs, then retry.", next_actions:[] })); process.exitCode = 1; }
}
if (command === "document" && target === "dates") { const asOf = flags[1] === "--as-of" ? new Date(`${flags[2]}T00:00:00Z`) : new Date(); report("migration-os document dates", () => ({ as_of:asOf.toISOString().slice(0, 10), lines:documentDates(flags[0], asOf) })); process.exit(); }
if (command === "document" && target === "quality") { report("migration-os document quality", () => ({ lines:documentQuality(flags[0]) })); process.exit(); }
if (command === "logistics" && target === "readiness") { report("migration-os logistics readiness", () => ({ lines:logisticsReadiness(flags[0]) })); process.exit(); }
if (command === "arrival" && target === "phase") { const asOf = flags[1] === "--as-of" ? new Date(`${flags[2]}T00:00:00Z`) : new Date(); report("migration-os arrival phase", () => ({ as_of:asOf.toISOString().slice(0, 10), lane:arrivalPhase(flags[0], asOf) })); process.exit(); }
if (command === "branch" && target === "create") { const ownerAt = flags.indexOf("--owner"), owner = ownerAt >= 0 ? flags[ownerAt + 1] : "unknown"; report("migration-os branch create", () => ({ output:createBranch(flags[0], flags[1], owner) })); process.exit(); }
if (command === "provider" && target === "comparison") { const serviceAt = flags.indexOf("--service"), cityAt = flags.indexOf("--city"); report("migration-os provider comparison", () => ({ output:createProviderComparison(flags[0], flags[1], serviceAt >= 0 ? flags[serviceAt + 1] ?? "" : "", cityAt >= 0 ? flags[cityAt + 1] ?? "" : "") })); process.exit(); }
if (command === "sources" && target === "refresh") { try { console.log(JSON.stringify({ ok:true, command:"migration-os sources refresh", result:await refreshSources(flags[0], { dryRun:flags.includes("--dry-run") }), next_actions:[] })); } catch (error) { console.log(JSON.stringify({ ok:false, command:"migration-os sources refresh", error:{ code:error instanceof Error && error.message.includes("SOURCE_FETCH") ? error.message : "CASE_INVALID", message:error instanceof Error ? error.message : "source refresh failed" }, fix:"Only use existing public HTTPS source records; this command never sends case data.", next_actions:[] })); process.exitCode = 1; } process.exit(); }
if (command === "migrate") {
  const destination = flags[0];
  if (!target || !destination) { usage(); process.exit(2); }
  try { const result = await migrateCase(target, destination); console.log(JSON.stringify({ ok:true, command:"migration-os migrate", result, next_actions:[{ command:"migration-os validate <case-directory>", description:"Validate the new v2 case before treating migrated records as ready.", params:{ "case-directory":{ value:result.destination, required:true } } }] })); }
  catch (error) { console.log(JSON.stringify({ ok:false, command:"migration-os migrate", error:{ code:"CASE_INVALID", message:error instanceof Error ? error.message : "migration failed" }, fix:"Keep the v1 source unchanged and use an empty destination directory.", next_actions:[] })); process.exitCode = 1; }
  process.exit();
}
if (!command || !target) { usage(); process.exit(2); }
const caseDir = resolve(target);
if (command === "init") { const created = await initCase(caseDir); console.log(JSON.stringify({ ok:true, command:"migration-os init", result:{ case_path:created }, next_actions:[{ command:"migration-os validate <case-directory>", description:"Validate the newly created case before adding records." }] })); }
else if (command === "serve") await serve(caseDir, flags.includes("--no-browser"));
else if (command === "status") { const path = statePath(caseDir); console.log(existsSync(path) ? readFileSync(path, "utf8") : "not running"); }
else if (command === "stop") { const path = statePath(caseDir); if (!existsSync(path)) throw new Error("not running"); const state = JSON.parse(readFileSync(path, "utf8")); process.kill(state.pid, "SIGTERM"); console.log("stop requested"); }
else if (command === "validate") { const validation = validateCase(caseDir); console.log(JSON.stringify({ ok:validation.ok, command:"migration-os validate", result:validation, next_actions:validation.ok ? [] : [{ command:"migration-os validate <case-directory>", description:"Re-run after correcting the reported case source files." }] })); if (!validation.ok) process.exitCode = 1; }
else if (command === "render") { const output = renderCase(caseDir); console.log(JSON.stringify({ ok:true, command:"migration-os render", result:{ output }, next_actions:[] })); }
else if (command === "requests") { console.log(JSON.stringify(readJsonLines(requestPath(caseDir)), null, 2)); }
else if (command === "claim" || command === "complete") { const id = flags[0]; if (!id) throw new Error("request ID required"); appendJsonLine(eventPath(caseDir), { kind:`request_${command}d`, request_id:id, at:new Date().toISOString() }); console.log(`${command} recorded`); }
else if (command === "build") Bun.spawnSync(["bun", "run", "build"], { cwd:root, stdio:["inherit", "inherit", "inherit"] });
else { usage(); process.exit(2); }
