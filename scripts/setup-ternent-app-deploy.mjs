#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  getVercelProjectSecretName,
  loadTernentAppManifestForDir,
} from "./lib/ternent-app-manifest.mjs";

const repoRoot = process.cwd();

function printUsage() {
  console.log(`Usage:
  pnpm setup:ternent-app-deploy -- --app apps/armour

Options:
  --app <path>             App directory, e.g. apps/armour
  --project <name>         Override the Vercel project name (defaults to app.id)
  --repo <owner/repo>      Target GitHub repository for secrets
  --scope <scope>          Vercel scope/team slug to use when linking
  --skip-org-secret        Do not update VERCEL_ORG_ID on GitHub
`);
}

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") continue;
    if (!arg.startsWith("--")) continue;

    const key = arg.slice(2);
    if (key === "skip-org-secret") {
      args[key] = true;
      continue;
    }

    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    args[key] = value;
    i += 1;
  }

  return args;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    stdio: options.stdio ?? "inherit",
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with exit code ${result.status}`,
    );
  }

  return result;
}

function ensureCommand(command, versionArg = "--version") {
  const result = spawnSync(command, [versionArg], {
    cwd: repoRoot,
    stdio: "pipe",
    encoding: "utf8",
  });

  if (result.error || result.status !== 0) {
    throw new Error(`Required command "${command}" is not available.`);
  }
}

function readLinkedProject(appDir) {
  const projectJsonPath = path.join(appDir, ".vercel", "project.json");
  if (!fs.existsSync(projectJsonPath)) {
    throw new Error(
      `Expected Vercel project metadata at ${path.relative(repoRoot, projectJsonPath)} after linking.`,
    );
  }

  const raw = JSON.parse(fs.readFileSync(projectJsonPath, "utf8"));
  if (!raw.projectId || !raw.orgId) {
    throw new Error("Vercel project metadata is missing projectId or orgId.");
  }

  return raw;
}

function ensureDeployWorkflowExists(appId) {
  const workflowPath = path.join(
    repoRoot,
    ".github",
    "workflows",
    `deploy-${appId}.yml`,
  );

  if (!fs.existsSync(workflowPath)) {
    throw new Error(
      `Missing deploy workflow: ${path.relative(repoRoot, workflowPath)}. Scaffold the app first.`,
    );
  }
}

function setGithubSecret(name, value, repo) {
  const args = ["secret", "set", name, "--body", value];

  if (repo) {
    args.push("--repo", repo);
  }

  run("gh", args);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.app) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  ensureCommand("vercel");
  ensureCommand("gh");

  const appDir = path.resolve(repoRoot, args.app);
  const manifest = loadTernentAppManifestForDir(appDir, repoRoot);
  const appId = manifest.app.appId;
  const projectName = args.project || appId;
  const repo = args.repo;
  const scope = args.scope;
  const projectSecretName = getVercelProjectSecretName(appId);

  ensureDeployWorkflowExists(appId);

  const vercelArgs = ["link", "--cwd", appDir, "--project", projectName, "--yes"];
  if (scope) {
    vercelArgs.push("--scope", scope);
  }

  run("vercel", vercelArgs);

  const linkedProject = readLinkedProject(appDir);

  setGithubSecret(projectSecretName, linkedProject.projectId, repo);

  if (!args["skip-org-secret"]) {
    setGithubSecret("VERCEL_ORG_ID", linkedProject.orgId, repo);
  }

  console.log(`Linked Vercel project "${projectName}" for ${appId}.`);
  console.log(`Set GitHub Actions secret ${projectSecretName}.`);
  if (!args["skip-org-secret"]) {
    console.log("Set GitHub Actions secret VERCEL_ORG_ID.");
  }
  console.log(`Deploy workflow: .github/workflows/deploy-${appId}.yml`);
  console.log(`App host: ${manifest.app.defaultHost}`);
}

main();
