const targets = ["bun-darwin-arm64", "bun-darwin-x64", "bun-windows-x64", "bun-windows-arm64", "bun-linux-x64", "bun-linux-x64-musl", "bun-linux-arm64", "bun-linux-arm64-musl"];
const releaseDir = process.argv[2] ?? "release";
const artifacts: { target:string; artifact:string; sha256:string }[] = [];
for (const target of targets) {
  const file = `${releaseDir}/${target.replace(/^bun-/, "migration-os-")}${target.includes("windows") ? ".exe" : ""}`;
  const build = Bun.spawnSync([process.execPath, "run", "scripts/build-standalone.ts", "--target", target, "--output", file], { cwd:import.meta.dir + "/..", stdout:"pipe", stderr:"pipe" });
  if (build.exitCode !== 0) throw new Error(new TextDecoder().decode(build.stderr));
  artifacts.push({ target, artifact:file.split("/").at(-1)!, sha256:Buffer.from(await crypto.subtle.digest("SHA-256", await Bun.file(file).arrayBuffer())).toString("hex") });
}
await Bun.write(`${releaseDir}/checksums.json`, `${JSON.stringify({ schema_version:1, artifacts }, null, 2)}\n`);
console.log(JSON.stringify({ ok:true, release_dir:releaseDir, artifacts }));
