import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  deriveKeyIdFromPublicKey,
  derivePublicKeyFromPrivateKey,
} from "../domain/code-signing.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..", "..", "..", "persisted", "pixpax");
const ISSUER_FILE = join(ROOT, "issuers.json");
const RECEIPT_FILE = join(ROOT, "receipt-keys.json");

function normalizePem(pem) {
  if (!pem) return "";
  const normalized = String(pem).includes("\\n") ? String(pem).replace(/\\n/g, "\n") : String(pem);
  return normalized.trim();
}

function ensurePublicPem(pemOrBody) {
  const normalized = normalizePem(pemOrBody);
  if (!normalized) return "";
  if (normalized.includes("BEGIN PUBLIC KEY")) return `${normalized}\n`;
  return `-----BEGIN PUBLIC KEY-----\n${normalized}\n-----END PUBLIC KEY-----\n`;
}

async function readJsonArray(filepath, label) {
  const raw = await readFile(filepath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON array.`);
  }
  return parsed;
}

export async function loadIssuerRegistry() {
  const rows = await readJsonArray(ISSUER_FILE, "issuers.json");
  const mapped = rows
    .map((row) => {
      const issuerKeyId = String(row?.issuerKeyId || "").trim();
      const name = String(row?.name || "").trim() || issuerKeyId;
      const status = String(row?.status || "active").trim().toLowerCase();
      const publicKeyPem = ensurePublicPem(row?.publicKeyPem || row?.publicKeyJwk || "");
      const derivedKeyId = publicKeyPem ? deriveKeyIdFromPublicKey(publicKeyPem) : "";
      if (!issuerKeyId || !publicKeyPem) return null;
      if (derivedKeyId && derivedKeyId !== issuerKeyId) {
        throw new Error(`Issuer key id mismatch for ${issuerKeyId}.`);
      }
      return {
        issuerKeyId,
        name,
        status: status === "revoked" ? "revoked" : "active",
        publicKeyPem,
        createdAt: row?.createdAt || null,
        notes: row?.notes || null,
      };
    })
    .filter(Boolean);

  try {
    const signer = resolveTokenIssuerSignerFromEnv();
    if (!mapped.find((entry) => entry.issuerKeyId === signer.issuerKeyId)) {
      mapped.push({
        issuerKeyId: signer.issuerKeyId,
        name: "env-issuer",
        status: "active",
        publicKeyPem: ensurePublicPem(signer.publicKeyPem),
        createdAt: null,
        notes: "Loaded from runtime env signer.",
      });
    }
  } catch {
    // Registry-only mode if env signer isn't configured.
  }

  return mapped;
}

export async function loadReceiptKeyRegistry() {
  const rows = await readJsonArray(RECEIPT_FILE, "receipt-keys.json");
  const mapped = rows
    .map((row) => {
      const receiptKeyId = String(row?.receiptKeyId || "").trim();
      const name = String(row?.name || "").trim() || receiptKeyId;
      const status = String(row?.status || "active").trim().toLowerCase();
      const publicKeyPem = ensurePublicPem(row?.publicKeyPem || "");
      const derivedKeyId = publicKeyPem ? deriveKeyIdFromPublicKey(publicKeyPem) : "";
      if (!receiptKeyId || !publicKeyPem) return null;
      if (derivedKeyId && derivedKeyId !== receiptKeyId) {
        throw new Error(`Receipt key id mismatch for ${receiptKeyId}.`);
      }
      return {
        receiptKeyId,
        name,
        status: status === "revoked" ? "revoked" : "active",
        publicKeyPem,
        createdAt: row?.createdAt || null,
        notes: row?.notes || null,
      };
    })
    .filter(Boolean);

  try {
    const signer = resolveReceiptSignerFromEnv();
    if (!mapped.find((entry) => entry.receiptKeyId === signer.receiptKeyId)) {
      mapped.push({
        receiptKeyId: signer.receiptKeyId,
        name: "env-receipt-key",
        status: "active",
        publicKeyPem: ensurePublicPem(signer.publicKeyPem),
        createdAt: null,
        notes: "Loaded from runtime env signer.",
      });
    }
  } catch {
    // Registry-only mode if env signer isn't configured.
  }

  return mapped;
}

export async function resolveActiveIssuerByKeyId(issuerKeyId) {
  const issuers = await loadIssuerRegistry();
  return (
    issuers.find(
      (entry) => entry.issuerKeyId === String(issuerKeyId || "").trim() && entry.status === "active"
    ) || null
  );
}

export async function resolveActiveReceiptKeyById(receiptKeyId) {
  const keys = await loadReceiptKeyRegistry();
  return (
    keys.find(
      (entry) => entry.receiptKeyId === String(receiptKeyId || "").trim() && entry.status === "active"
    ) || null
  );
}

export function resolveTokenIssuerSignerFromEnv() {
  const privateKeyPem = normalizePem(process.env.ISSUER_PRIVATE_KEY_PEM || "");
  if (!privateKeyPem) {
    throw new Error("ISSUER_PRIVATE_KEY_PEM is required for token signing.");
  }
  const publicKeyPem = derivePublicKeyFromPrivateKey(privateKeyPem);
  const issuerKeyId =
    String(process.env.ISSUER_KEY_ID || "").trim() || deriveKeyIdFromPublicKey(publicKeyPem);
  return {
    issuerKeyId,
    privateKeyPem,
    publicKeyPem,
  };
}

export function resolveReceiptSignerFromEnv() {
  const privateKeyPem = normalizePem(process.env.PIX_PAX_RECEIPT_PRIVATE_KEY_PEM || "");
  if (!privateKeyPem) {
    throw new Error("PIX_PAX_RECEIPT_PRIVATE_KEY_PEM is required for receipt signing.");
  }
  const publicKeyPem =
    ensurePublicPem(process.env.PIX_PAX_RECEIPT_PUBLIC_KEY_PEM || "") ||
    derivePublicKeyFromPrivateKey(privateKeyPem);
  const receiptKeyId =
    String(process.env.PIX_PAX_RECEIPT_KEY_ID || "").trim() ||
    deriveKeyIdFromPublicKey(publicKeyPem);

  return {
    receiptKeyId,
    privateKeyPem,
    publicKeyPem,
  };
}
