const os = process.platform === "win32" ? "windows" : process.platform;
const target = `bun-${os}-${process.arch}`;
const result = await Bun.build({
  entrypoints: ["src/cli.ts"],
  compile: {
    target,
    outfile: "bin/migration-os",
    autoloadDotenv: false,
    autoloadBunfig: false
  },
  minify: true
});

if (!result.success) {
  for (const log of result.logs) console.error(log.message);
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, artifact: "bin/migration-os", target, embedded_assets: ["dist"] }));
