import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import identity from "ternent-identity";

const {
  createIdentity,
  exportPrivateKeyAsPem,
  exportPublicKeyAsPem,
} = identity;

const repoRoot = resolve(new URL("../../..", import.meta.url).pathname);
const manifestPath = resolve(repoRoot, "apps/proof/public/_seal/dist-manifest.json");
const proofPath = resolve(repoRoot, "apps/proof/public/_seal/proof.json");
const publicKeyPath = resolve(repoRoot, "apps/proof/public/_seal/public-key.json");

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
  if (process.env.SEAL_PRIVATE_KEY?.trim()) {
    return {
      privateKeyPem: process.env.SEAL_PRIVATE_KEY,
      publicKeyPem: process.env.SEAL_PUBLIC_KEY,
      generated: false,
    };
  }

  const keyPair = await createIdentity();
  return {
    privateKeyPem: await exportPrivateKeyAsPem(keyPair.privateKey),
    publicKeyPem: await exportPublicKeyAsPem(keyPair.publicKey),
    generated: true,
  };
}

const signing = await resolveSigningEnv();

if (signing.generated) {
  process.stdout.write(
    "No SEAL_PRIVATE_KEY found. Generating an ephemeral local dev signer.\n"
  );
}

run("pnpm", ["--filter", "@ternent/seal-cli", "build"]);
run("pnpm", ["--filter", "proof", "build"]);

const sealEnv = {
  ...process.env,
  SEAL_PRIVATE_KEY: signing.privateKeyPem,
  SEAL_PUBLIC_KEY: signing.publicKeyPem,
};

await mkdir(dirname(manifestPath), { recursive: true });

run(
  "node",
  [
    "packages/seal-cli/bin/seal",
    "manifest",
    "create",
    "--input",
    "apps/proof/dist",
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
