import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createIdentity, serializeIdentity } from "@ternent/identity";

const repoRoot = resolve(new URL("../../..", import.meta.url).pathname);
const manifestPath = resolve(repoRoot, "apps/seal/public/_seal/dist-manifest.json");
const proofPath = resolve(repoRoot, "apps/seal/public/_seal/proof.json");
const publicKeyPath = resolve(repoRoot, "apps/seal/public/_seal/public-key.json");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    env: options.env ?? process.env,
  });

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with exit code ${result.status ?? 1}.`
    );
  }

  return result;
}

async function resolveSigningEnv() {
  if (process.env.SEAL_IDENTITY?.trim()) {
    return {
      identityJson: process.env.SEAL_IDENTITY,
      generated: false,
    };
  }

  const identity = await createIdentity();
  return {
    identityJson: serializeIdentity(identity, false).trim(),
    generated: true,
  };
}

const signing = await resolveSigningEnv();

if (signing.generated) {
  process.stdout.write(
    "No SEAL_IDENTITY found. Generating an ephemeral local dev signer.\n"
  );
}

run("pnpm", ["--filter", "@ternent/seal-cli", "build"]);
run("pnpm", ["--filter", "seal", "build"]);

const sealEnv = {
  ...process.env,
  SEAL_IDENTITY: signing.identityJson,
};

await mkdir(dirname(manifestPath), { recursive: true });

run(
  "node",
  [
    "packages/seal-cli/bin/seal",
    "manifest",
    "create",
    "--input",
    "apps/seal/dist",
    "--out",
    manifestPath,
    "--quiet",
  ],
  { env: sealEnv }
);

run(
  "node",
  [
    "packages/seal-cli/bin/seal",
    "sign",
    "--input",
    manifestPath,
    "--out",
    proofPath,
    "--quiet",
  ],
  { env: sealEnv }
);

const publicKeyResult = run(
  "node",
  ["packages/seal-cli/bin/seal", "public-key", "--json"],
  { env: sealEnv, capture: true }
);

await writeFile(publicKeyPath, publicKeyResult.stdout, "utf8");

process.stdout.write(`Wrote ${manifestPath}\n`);
process.stdout.write(`Wrote ${proofPath}\n`);
process.stdout.write(`Wrote ${publicKeyPath}\n`);
