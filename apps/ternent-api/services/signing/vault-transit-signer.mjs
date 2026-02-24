import { createHash } from "node:crypto";
import { canonicalStringify } from "@ternent/concord-protocol";
import { createVaultTransitClient } from "./vault-transit-client.mjs";
import { badRequest, serviceUnavailable } from "../http/errors.mjs";

function trim(value) {
  return String(value || "").trim();
}

function sha256Bytes(input) {
  return createHash("sha256").update(input).digest();
}

function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

function ensurePemTrailingNewline(pem) {
  const normalized = trim(pem);
  if (!normalized) return "";
  return normalized.endsWith("\n") ? normalized : `${normalized}\n`;
}

function parseVaultSignature(value) {
  const raw = trim(value);
  const parts = raw.split(":");
  if (parts.length < 3) {
    throw serviceUnavailable(
      "VAULT_SIGN_FAILED",
      "Vault signature format is invalid."
    );
  }
  const signature = trim(parts[parts.length - 1]);
  if (!signature) {
    throw serviceUnavailable(
      "VAULT_SIGN_FAILED",
      "Vault signature payload is missing."
    );
  }
  return signature;
}

export function createVaultTransitSigner() {
  const client = createVaultTransitClient();

  return {
    canonicalBytes(value) {
      const canonical = canonicalStringify(value);
      return Buffer.from(canonical, "utf8");
    },

    requestHash(value) {
      const canonical = canonicalStringify(value);
      return sha256Hex(Buffer.from(canonical, "utf8"));
    },

    async signDigest({ keyName, digestHex }) {
      const normalizedKeyName = trim(keyName);
      const normalizedDigestHex = trim(digestHex).toLowerCase();
      if (!normalizedKeyName || !/^[a-f0-9]{64}$/.test(normalizedDigestHex)) {
        throw badRequest(
          "SIGN_INPUT_INVALID",
          "signDigest requires keyName and a 64-char SHA-256 digest hex."
        );
      }

      const digestBase64 = Buffer.from(normalizedDigestHex, "hex").toString("base64");
      const response = await client.signDigest({
        keyName: normalizedKeyName,
        digestBase64,
      });
      const signatureB64 = parseVaultSignature(response.signature);
      return {
        signature: signatureB64,
        algorithm: "ecdsa-p256-sha256",
      };
    },

    async resolveKeyMetadata({ keyName }) {
      const normalizedKeyName = trim(keyName);
      if (!normalizedKeyName) {
        throw badRequest("SIGNING_IDENTITY_INVALID", "keyName is required.");
      }
      const key = await client.readKey({ keyName: normalizedKeyName });
      const publicKeyPem = ensurePemTrailingNewline(key.publicKeyPem);
      const publicKeyId = sha256Hex(publicKeyPem);
      return {
        keyName: normalizedKeyName,
        publicKeyPem,
        publicKeyId,
      };
    },

    validateSignatureFormat(signature) {
      const raw = trim(signature);
      if (!raw) return false;
      try {
        const bytes = Buffer.from(raw, "base64");
        return bytes.length > 0;
      } catch {
        return false;
      }
    },

    hashCanonical(value) {
      const canonical = canonicalStringify(value);
      return sha256Hex(Buffer.from(canonical, "utf8"));
    },

    hashBytes(bytes) {
      return sha256Hex(bytes);
    },

    digestHexFromCanonical(value) {
      const bytes = Buffer.from(canonicalStringify(value), "utf8");
      return sha256Bytes(bytes).toString("hex");
    },
  };
}
