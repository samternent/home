#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {
  createScaffoldManifest,
  stringifyManifestYaml,
} from "./lib/ternent-app-manifest.mjs";

const repoRoot = process.cwd();

function printUsage() {
  console.log(`Usage:
  pnpm prepare:ternent-app -- --out .ternent-apps/my-app.yaml --name my-app --title "My App" --host my-app.ternent.dev [--theme aurora]
`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;

    const key = arg.slice(2);
    const value = argv[i + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    args[key] = value;
    i += 1;
  }

  return args;
}

function assertName(name) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error("--name must be lowercase kebab-case (letters, numbers, hyphens)");
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { out, name, title, host, theme } = args;

  if (!out || !name || !title || !host) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  assertName(name);

  const manifest = createScaffoldManifest({
    repoRoot,
    name,
    title,
    host,
    themeName: theme,
  });

  const outPath = path.resolve(repoRoot, out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  if (fs.existsSync(outPath)) {
    throw new Error(`Manifest already exists: ${outPath}`);
  }

  fs.writeFileSync(outPath, stringifyManifestYaml(manifest), "utf8");

  console.log(`Created starter ternent app manifest: ${path.relative(repoRoot, outPath)}`);
  console.log("Next steps:");
  console.log(`  1. Edit ${path.relative(repoRoot, outPath)}`);
  console.log(`  2. pnpm scaffold:ternent-app -- --manifest ${path.relative(repoRoot, outPath)}`);
  console.log(`  3. pnpm --filter ${name} dev`);
}

main();
