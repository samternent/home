import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export type ConcordConfig = {
  rootAdmins?: string[];
};

export function loadConfig(path?: string): ConcordConfig {
  const configPath = path
    ? resolve(path)
    : resolve(process.cwd(), "concord.config.json");
  if (!existsSync(configPath)) {
    return {};
  }
  const raw = readFileSync(configPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") {
    return {};
  }
  const rootAdmins = Array.isArray(parsed.rootAdmins)
    ? parsed.rootAdmins.filter((value) => typeof value === "string")
    : undefined;
  return { rootAdmins };
}
