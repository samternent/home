#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {
  CANONICAL_APP_MANIFEST,
  createScaffoldManifest,
  loadTernentAppManifest,
  normalizeScaffoldedAppFiles,
  stringifyManifestYaml,
  writeGeneratedAppFiles,
} from "./lib/ternent-app-manifest.mjs";

const repoRoot = process.cwd();
const templateDir = path.join(repoRoot, "apps", "_templates", "ternent-vue-app");

function printUsage() {
  console.log(`Usage:
  pnpm scaffold:ternent-app -- --manifest apps/my-app/app.yaml
  pnpm scaffold:ternent-app -- --name <app-name> --title "App Title" --host <app.ternent.dev> [--theme <ternent-ui-theme>]
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

function assertTemplateExists() {
  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template directory not found: ${templateDir}`);
  }
}

function assertName(name) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error("--name must be lowercase kebab-case (letters, numbers, hyphens)");
  }
}

function walkFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, out);
      continue;
    }
    out.push(fullPath);
  }
  return out;
}

function replaceTemplateTokens(targetDir, tokens) {
  const files = walkFiles(targetDir);
  const textExtensions = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".mjs",
    ".cjs",
    ".json",
    ".vue",
    ".md",
    ".html",
    ".css",
    ".yml",
    ".yaml",
    ".d.ts",
    ".webmanifest",
    ".example",
  ]);

  for (const file of files) {
    const ext = path.extname(file);
    const basename = path.basename(file);

    if (!textExtensions.has(ext) && basename !== ".env.example") {
      continue;
    }

    const original = fs.readFileSync(file, "utf8");
    let next = original;

    for (const [token, value] of Object.entries(tokens)) {
      next = next.replaceAll(token, value);
    }

    if (next !== original) {
      fs.writeFileSync(file, next, "utf8");
    }
  }
}

function createManifestFromArgs(args) {
  if (args.manifest) {
    return loadTernentAppManifest(path.resolve(repoRoot, args.manifest), repoRoot);
  }

  const name = args.name;
  const title = args.title;
  const host = args.host;

  if (!name || !title || !host) {
    printUsage();
    process.exitCode = 1;
    return null;
  }

  assertName(name);

  return createScaffoldManifest({
    repoRoot,
    name,
    title,
    host,
    themeName: args.theme,
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  assertTemplateExists();

  const manifest = createManifestFromArgs(args);
  if (!manifest) return;

  const targetDir = path.join(repoRoot, "apps", manifest.app.appId);

  if (fs.existsSync(targetDir)) {
    throw new Error(`Target already exists: ${targetDir}`);
  }

  fs.cpSync(templateDir, targetDir, {
    recursive: true,
    errorOnExist: true,
    force: false,
  });

  replaceTemplateTokens(targetDir, {
    "__APP_ID__": manifest.app.appId,
  });
  normalizeScaffoldedAppFiles(targetDir, repoRoot);

  fs.writeFileSync(
    path.join(targetDir, CANONICAL_APP_MANIFEST),
    stringifyManifestYaml(manifest),
    "utf8",
  );

  writeGeneratedAppFiles(targetDir, manifest);

  console.log(`Created app from template: apps/${manifest.app.appId}`);
  console.log(`Manifest: apps/${manifest.app.appId}/${CANONICAL_APP_MANIFEST}`);
  console.log("Next steps:");
  console.log(`  pnpm sync:ternent-app -- --app apps/${manifest.app.appId}`);
  console.log(`  pnpm --filter ${manifest.app.appId} dev`);
}

main();
