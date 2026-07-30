const supported = ["bun-darwin-arm64", "bun-darwin-x64", "bun-windows-x64", "bun-windows-arm64", "bun-linux-x64", "bun-linux-x64-musl", "bun-linux-arm64", "bun-linux-arm64-musl"] as const;
const args = process.argv.slice(2), targetFlag = args.indexOf("--target"), outputFlag = args.indexOf("--output");
const localTarget = `bun-${process.platform === "win32" ? "windows" : process.platform}-${process.arch}`;
const target = targetFlag >= 0 ? args[targetFlag + 1] : localTarget;
if (!supported.includes(target as typeof supported[number])) throw new Error(`Unsupported target ${target}; supported targets: ${supported.join(", ")}`);
const outfile = outputFlag >= 0 ? args[outputFlag + 1] : "bin/migration-os";
if (!outfile) throw new Error("--output requires a path");
const result = await Bun.build({ entrypoints:["src/cli.ts"], compile:{ target, outfile, autoloadDotenv:false, autoloadBunfig:false }, minify:true });
if (!result.success) { for (const log of result.logs) console.error(log.message); process.exit(1); }
console.log(JSON.stringify({ ok:true, artifact:outfile, target, embedded_assets:["dist"] }));
