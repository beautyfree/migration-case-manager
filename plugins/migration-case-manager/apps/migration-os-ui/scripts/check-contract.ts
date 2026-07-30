import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const contract = JSON.parse(await Bun.file(`${root}/contracts/cli-contract.json`).text());
const responseSchema = JSON.parse(await Bun.file(`${root}/contracts/cli-response.schema.json`).text());

const fail = (message: string): never => { throw new Error(`CLI contract invalid: ${message}`); };
if (contract.contract_version !== "1.0.0") fail("unsupported contract_version");
if (contract.binary_name !== "migration-os") fail("binary_name must be migration-os");
if (contract.output?.format !== "json" || contract.output?.stdout !== "exactly_one_json_object") fail("JSON-only stdout is required");
if (!Array.isArray(contract.commands) || contract.commands.length < 10) fail("command tree is incomplete");
const ids = new Set<string>();
for (const command of contract.commands) {
  if (typeof command.id !== "string" || !command.id) fail("command is missing id");
  if (ids.has(command.id)) fail(`duplicate command id ${command.id}`);
  ids.add(command.id);
  if (typeof command.usage !== "string" || !command.usage.startsWith("migration-os ")) fail(`invalid usage for ${command.id}`);
  if (!Array.isArray(command.writes)) fail(`writes must be an array for ${command.id}`);
}
for (const required of ["doctor", "init", "validate", "render", "serve", "sources.refresh", "migrate"]) {
  if (!ids.has(required)) fail(`missing ${required}`);
}
if (contract.commands.find((item: { id: string }) => item.id === "serve")?.network !== "loopback_only") fail("serve must be loopback_only");
if (!Array.isArray(contract.error_codes) || !contract.error_codes.includes("CONSENT_REQUIRED")) fail("CONSENT_REQUIRED must be stable");
if (responseSchema.properties?.ok?.type !== "boolean" || !responseSchema.required?.includes("next_actions")) fail("response envelope is incomplete");

console.log(JSON.stringify({ ok: true, contract_version: contract.contract_version, commands: contract.commands.length }));
