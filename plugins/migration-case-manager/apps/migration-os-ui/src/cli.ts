#!/usr/bin/env bun
/** Local-only Migration OS UI daemon. Markdown remains the authoritative data source. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { embeddedAssets } from "./embedded-assets";
import { appendJsonLine, caseFile, loadCase, readCaseText, readJsonLines, runtimePath } from "./case-core";

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
function usage() { console.log("Usage: migration-os-ui <serve|status|stop|validate|requests|claim|complete|build> <case-directory> [--no-browser]"); }
const [command, target, ...flags] = process.argv.slice(2);
if (!command || !target) { usage(); process.exit(2); }
const caseDir = resolve(target);
if (command === "serve") await serve(caseDir, flags.includes("--no-browser"));
else if (command === "status") { const path = statePath(caseDir); console.log(existsSync(path) ? readFileSync(path, "utf8") : "not running"); }
else if (command === "stop") { const path = statePath(caseDir); if (!existsSync(path)) throw new Error("not running"); const state = JSON.parse(readFileSync(path, "utf8")); process.kill(state.pid, "SIGTERM"); console.log("stop requested"); }
else if (command === "validate") { console.log(JSON.stringify(payload(caseDir), null, 2)); }
else if (command === "requests") { console.log(JSON.stringify(readJsonLines(requestPath(caseDir)), null, 2)); }
else if (command === "claim" || command === "complete") { const id = flags[0]; if (!id) throw new Error("request ID required"); appendJsonLine(eventPath(caseDir), { kind:`request_${command}d`, request_id:id, at:new Date().toISOString() }); console.log(`${command} recorded`); }
else if (command === "build") Bun.spawnSync(["bun", "run", "build"], { cwd:root, stdio:["inherit", "inherit", "inherit"] });
else { usage(); process.exit(2); }
