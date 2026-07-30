import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const [binary] = process.argv.slice(2);
if (!binary) throw new Error("usage: bun run scripts/smoke-standalone.ts <migration-os-binary>");

function run(args: string[]) {
  const result = Bun.spawnSync([binary, ...args], { stdout: "pipe", stderr: "pipe" });
  const stdout = new TextDecoder().decode(result.stdout);
  const stderr = new TextDecoder().decode(result.stderr);
  if (result.exitCode !== 0) throw new Error(`${args.join(" ")} failed: ${stdout}${stderr}`);
  return stdout;
}

const root = mkdtempSync(join(tmpdir(), "migration-os-smoke-"));
const caseDir = join(root, "case");
try {
  const doctor = JSON.parse(run(["doctor"]));
  if (doctor.ok !== true || doctor.result?.loopback_only !== true) throw new Error("doctor did not report the expected local-only runtime");

  const init = JSON.parse(run(["init", caseDir]));
  if (init.ok !== true) throw new Error("init did not succeed");

  const validation = JSON.parse(run(["validate", caseDir]));
  if (validation.ok !== true) throw new Error("new case did not validate");

  const server = Bun.spawn([binary, "serve", caseDir, "--no-browser"], { stdout: "pipe", stderr: "pipe" });
  const reader = server.stdout.getReader();
  const first = await Promise.race([
    reader.read(),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("serve did not announce a local URL")), 10_000)),
  ]);
  const output = new TextDecoder().decode(first.value ?? new Uint8Array());
  const match = output.match(/Migration OS UI: (http:\/\/127\.0\.0\.1:\d+\/\?token=[^\s]+)/);
  if (!match) throw new Error(`serve did not emit a loopback token URL: ${output}`);
  const response = await fetch(match[1], { redirect: "manual" });
  if (response.status !== 302) throw new Error(`token bootstrap returned ${response.status}, expected 302`);
  server.kill();
  await Promise.race([
    server.exited,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("serve did not stop")), 10_000)),
  ]);
  console.log(JSON.stringify({ ok: true, binary, checks: ["doctor", "init", "validate", "serve-loopback"] }));
} finally {
  rmSync(root, { recursive: true, force: true });
}
