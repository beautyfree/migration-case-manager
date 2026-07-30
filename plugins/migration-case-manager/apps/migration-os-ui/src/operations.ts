import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { normalizeCaseText } from "./case-core";
import { templates } from "./templates";

export async function initCase(directory: string): Promise<string> {
  const target = resolve(directory);
  if (existsSync(target) && readdirSync(target).length > 0) throw new Error("CASE_WRITE_REFUSED: refusing to initialize a non-empty directory");
  mkdirSync(target, { recursive: true });
  for (const [filename, embedded] of Object.entries(templates)) writeFileSync(join(target, filename), normalizeCaseText(await Bun.file(embedded).text()), "utf8");
  mkdirSync(join(target, "evidence"));
  writeFileSync(join(target, ".gitignore"), "evidence/\n99-dashboard.md\n.migration-os/\n", "utf8");
  return target;
}
