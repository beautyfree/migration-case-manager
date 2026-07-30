#!/usr/bin/env node
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve, win32 } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const releaseBase = process.env.MIGRATION_OS_RELEASE_BASE ?? "https://github.com/beautyfree/migration-case-manager/releases/download";
const packageVersion = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;

export function assertRelease(version, base = releaseBase) {
  if (!/^v\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) throw new Error("BINARY_INVALID_RELEASE_VERSION: expected a versioned vX.Y.Z release tag");
  if (!base.startsWith("https://")) throw new Error("BINARY_INVALID_RELEASE_BASE: release downloads must use HTTPS");
}

export function targetFor(platform = process.platform, arch = process.arch, report = process.report?.getReport?.()) {
  if (platform === "darwin" && arch === "arm64") return "migration-os-darwin-arm64";
  if (platform === "darwin" && arch === "x64") return "migration-os-darwin-x64";
  if (platform === "win32" && arch === "x64") return "migration-os-windows-x64.exe";
  if (platform === "win32" && arch === "arm64") return "migration-os-windows-arm64.exe";
  if (platform === "linux" && arch === "x64") return report?.header?.glibcVersionRuntime ? "migration-os-linux-x64" : "migration-os-linux-x64-musl";
  if (platform === "linux" && arch === "arm64") return report?.header?.glibcVersionRuntime ? "migration-os-linux-arm64" : "migration-os-linux-arm64-musl";
  throw new Error(`BINARY_UNSUPPORTED_PLATFORM: ${platform}/${arch}`);
}

export function installationRoot(platform = process.platform, environment = process.env, home = homedir()) {
  if (environment.MIGRATION_OS_HOME) return resolve(environment.MIGRATION_OS_HOME);
  return platform === "win32" ? win32.resolve(environment.LOCALAPPDATA ?? win32.join(home, "AppData", "Local"), "MigrationOS") : resolve(home, ".local", "share", "migration-os");
}

function parse(argv) {
  let version = process.env.MIGRATION_OS_VERSION ?? `v${packageVersion}`, yes = false, index = 0;
  while (index < argv.length) {
    if (argv[index] === "--release") { version = argv[index + 1] ?? ""; index += 2; continue; }
    if (argv[index] === "--yes-download") { yes = true; index++; continue; }
    break;
  }
  return { version, yes, command: argv.slice(index) };
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
  if (!response.ok || !response.url.startsWith("https://")) throw new Error(`BINARY_DOWNLOAD_FAILED: could not retrieve ${url}`);
  return response.text();
}

async function expectedChecksum(url, artifact) {
  const lines = (await fetchText(url)).split(/\r?\n/);
  const entry = lines.find(line => line.trimEnd().endsWith(`  ${artifact}`));
  const hash = entry?.trim().split(/\s+/)[0] ?? "";
  if (!/^[a-fA-F0-9]{64}$/.test(hash)) throw new Error("BINARY_CHECKSUM_MISMATCH: artifact is absent from checksums.txt or has an invalid SHA-256");
  return hash.toLowerCase();
}

async function download(url, destination) {
  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(120_000) });
  if (!response.ok || !response.url.startsWith("https://")) throw new Error(`BINARY_DOWNLOAD_FAILED: could not retrieve ${url}`);
  writeFileSync(destination, Buffer.from(await response.arrayBuffer()), { mode: 0o700 });
}

function doctor(binary) {
  const result = spawnSync(binary, ["doctor"], { stdio: "ignore" });
  if (result.error || result.status !== 0) throw new Error("BINARY_DOCTOR_FAILED: downloaded file was not installed");
}

async function ensure({ version, yes }) {
  assertRelease(version);
  const artifact = targetFor(), home = installationRoot();
  const destination = join(home, version, artifact), url = `${releaseBase}/${version}/${artifact}`, checksums = `${releaseBase}/${version}/checksums.txt`;
  if (existsSync(destination)) { doctor(destination); return destination; }
  const expected = await expectedChecksum(checksums, artifact);
  if (!yes) {
    console.error(`Consent required. Release ${version} would download ${url}, verify SHA-256 ${expected} from ${checksums}, run doctor, then install to ${destination}. Re-run with --yes-download after user approval.`);
    process.exitCode = 3; return null;
  }
  mkdirSync(dirname(destination), { recursive: true });
  const temporary = `${destination}.download-${process.pid}`;
  try {
    await download(url, temporary);
    const actual = createHash("sha256").update(readFileSync(temporary)).digest("hex");
    if (actual !== expected) throw new Error("BINARY_CHECKSUM_MISMATCH: downloaded file was not installed");
    chmodSync(temporary, 0o700); doctor(temporary);
    const backup = `${destination}.previous-${process.pid}`;
    if (existsSync(destination)) renameSync(destination, backup);
    try { renameSync(temporary, destination); } catch (error) { if (existsSync(backup)) renameSync(backup, destination); throw error; }
    if (existsSync(backup)) rmSync(backup, { force: true });
    return destination;
  } finally { if (existsSync(temporary)) rmSync(temporary, { force: true }); }
}

async function main() {
  const options = parse(process.argv.slice(2));
  if (!options.command.length) options.command.push("doctor");
  const binary = await ensure(options);
  if (!binary) return;
  const result = spawnSync(binary, options.command, { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
