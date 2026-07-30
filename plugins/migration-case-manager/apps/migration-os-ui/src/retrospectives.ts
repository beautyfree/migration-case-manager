import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseFrontmatter } from "./case-core";

export type RetrospectiveReadiness = { eligible: number; minimum: number; ready: boolean; lines: string[] };

export function retrospectiveReadiness(directory: string, minimum = 3): RetrospectiveReadiness {
  const root = resolve(directory);
  const files = existsSync(root) ? readdirSync(root).filter(name => name.endsWith(".md")).sort() : [];
  const lines: string[] = [], eligible: string[] = [];
  for (const filename of files) {
    const meta = parseFrontmatter(readFileSync(join(root, filename), "utf8"));
    if (meta.sanitized === "yes" && meta.completed_at && meta.completed_at !== "unknown") {
      eligible.push(filename); lines.push(`eligible: ${filename}`);
    } else lines.push(`not eligible: ${filename} (sanitized=yes and completed_at required)`);
  }
  return { eligible: eligible.length, minimum, ready: eligible.length >= minimum, lines };
}
