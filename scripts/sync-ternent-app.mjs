#!/usr/bin/env node

import path from "node:path";
import {
  loadTernentAppManifestForDir,
  normalizeScaffoldedAppFiles,
  writeGeneratedAppFiles,
} from "./lib/ternent-app-manifest.mjs";

const repoRoot = process.cwd();

function printUsage() {
  console.log(`Usage:
  pnpm sync:ternent-app -- --app apps/seal
`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") continue;
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

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.app) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const appDir = path.resolve(repoRoot, args.app);
  const manifest = loadTernentAppManifestForDir(appDir, repoRoot);
  normalizeScaffoldedAppFiles(appDir, repoRoot);
  writeGeneratedAppFiles(appDir, manifest);

  console.log(`Synced ternent app config from ${path.relative(repoRoot, appDir)}/app.yaml`);
}

main();
