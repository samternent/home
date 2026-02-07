#!/usr/bin/env node
import { readFileSync } from "fs";
import { createHash, createPrivateKey, createPublicKey } from "crypto";

function parseArgs(argv) {
  const args = {
    envFile: "",
    envKey: "ISSUER_PRIVATE_KEY_PEM",
    privateKeyPem: "",
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if ((arg === "--env-file" || arg === "--envFile") && argv[i + 1]) {
      args.envFile = String(argv[i + 1]);
      i += 1;
    } else if ((arg === "--env-key" || arg === "--envKey") && argv[i + 1]) {
      args.envKey = String(argv[i + 1]);
      i += 1;
    } else if ((arg === "--private-key-pem" || arg === "--privateKeyPem") && argv[i + 1]) {
      args.privateKeyPem = String(argv[i + 1]);
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    }
  }

  return args;
}

function normalizePem(pem) {
  if (!pem) return "";
  const normalized = pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem;
  return `${normalized.trim()}\n`;
}

function stripPublicPem(publicKeyPem) {
  return publicKeyPem
    .replace("-----BEGIN PUBLIC KEY-----\n", "")
    .replace("\n-----END PUBLIC KEY-----\n", "")
    .trim();
}

function loadEnvFileValue(filepath, key) {
  const content = readFileSync(filepath, "utf8");
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const entryKey = trimmed.slice(0, idx).trim();
    if (entryKey !== key) continue;
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value;
  }
  return "";
}

function escapeForDoubleQuotedEnv(value) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
}

function sha256HexUtf8(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function deriveFromPrivateKey(privateKeyPemRaw) {
  const privateKeyPem = normalizePem(privateKeyPemRaw);
  if (!privateKeyPem) {
    throw new Error("Missing private key PEM.");
  }

  const privateKey = createPrivateKey(privateKeyPem);
  const publicKeyPem = createPublicKey(privateKey).export({ type: "spki", format: "pem" }).toString();
  const normalizedPublicKeyPem = normalizePem(publicKeyPem);
  const publicKeyBody = stripPublicPem(normalizedPublicKeyPem);
  const issuerKeyId = sha256HexUtf8(normalizedPublicKeyPem.trim());

  const trustedArray = [
    {
      keyId: issuerKeyId,
      publicKeyPem: normalizedPublicKeyPem,
    },
  ];

  const trustedMapLegacy = {
    [issuerKeyId]: normalizedPublicKeyPem,
  };

  return {
    privateKeyPem,
    publicKeyPem: normalizedPublicKeyPem,
    publicKeyBody,
    issuerKeyId,
    trustedArray,
    trustedMapLegacy,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      [
        "Derive all issuer key formats used by PixPax ledger.",
        "",
        "Options:",
        "  --env-file <path>           Read key from env file",
        "  --env-key <name>            Env key name (default: ISSUER_PRIVATE_KEY_PEM)",
        "  --private-key-pem <pem>     Private key PEM directly",
        "  --help                      Show this help",
      ].join("\n")
    );
    process.exit(0);
  }

  let privateKeyPemRaw = args.privateKeyPem || process.env.ISSUER_PRIVATE_KEY_PEM || "";
  if (!privateKeyPemRaw && args.envFile) {
    privateKeyPemRaw = loadEnvFileValue(args.envFile, args.envKey);
  }

  if (!privateKeyPemRaw) {
    console.error(
      [
        "No private key found.",
        "Provide one of:",
        "- ISSUER_PRIVATE_KEY_PEM env var",
        "- --private-key-pem '<pem>'",
        "- --env-file <path> [--env-key ISSUER_PRIVATE_KEY_PEM]",
      ].join("\n")
    );
    process.exit(1);
  }

  const derived = deriveFromPrivateKey(privateKeyPemRaw);

  const trustedArrayJson = JSON.stringify(derived.trustedArray);
  const trustedMapLegacyJson = JSON.stringify(derived.trustedMapLegacy);

  console.log("# Derived issuer key formats");
  console.log(`issuerKeyId: ${derived.issuerKeyId}`);
  console.log("\n# Public key PEM");
  console.log(derived.publicKeyPem);

  console.log("# Public key body (Concord author style)");
  console.log(derived.publicKeyBody);

  console.log("\n# Strict trusted issuer keys JSON (current schema)");
  console.log(trustedArrayJson);

  console.log("\n# Legacy map format (for reference)");
  console.log(trustedMapLegacyJson);

  console.log("\n# Ready-to-paste .env values");
  console.log(`ISSUER_KEY_ID=${derived.issuerKeyId}`);
  console.log(`ISSUER_PUBLIC_KEY_PEM=\"${escapeForDoubleQuotedEnv(derived.publicKeyPem)}\"`);
  console.log(`LEDGER_TRUSTED_ISSUER_PUBLIC_KEYS_JSON='${trustedArrayJson.replace(/'/g, "'\\''")}'`);
}

try {
  main();
} catch (error) {
  console.error(error?.message || "Failed to derive issuer key formats.");
  process.exit(1);
}
