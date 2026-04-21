import { PasskeyVerificationError } from "./errors.js";
import { buildChallenge, shaDigest } from "./challenge.js";
import type {
  PasskeyApproval,
  VerifyApprovalOptions,
  VerifyApprovalResult,
} from "./types.js";
import { base64UrlToBytes, bytesToBase64Url } from "./utils/base64url.js";
import { concatBytes, equalBytes, toUint8Array } from "./utils/bytes.js";

type ParsedClientData = {
  challenge: string;
  origin: string;
  type: string;
};

function requireSubtle(): SubtleCrypto {
  if (typeof globalThis.crypto?.subtle !== "object") {
    throw new PasskeyVerificationError(
      "Web Crypto API is required for passkey verification.",
    );
  }
  return globalThis.crypto.subtle;
}

function parseClientDataJSON(input: ArrayBuffer): ParsedClientData {
  try {
    const text = new TextDecoder().decode(new Uint8Array(input));
    const value = JSON.parse(text) as Record<string, unknown>;
    const challenge = String(value.challenge || "");
    const origin = String(value.origin || "");
    const type = String(value.type || "");

    if (!challenge || !origin || !type) {
      throw new Error("Missing required clientDataJSON fields.");
    }

    return {
      challenge,
      origin,
      type,
    };
  } catch (error) {
    throw new PasskeyVerificationError(
      `Unable to parse passkey clientDataJSON: ${String(error)}`,
    );
  }
}

function parseAuthenticatorFlags(input: ArrayBuffer): { userPresent: boolean; userVerified: boolean } {
  const bytes = new Uint8Array(input);
  if (bytes.byteLength < 33) {
    throw new PasskeyVerificationError(
      "Authenticator data is too short to read RP ID hash and flags.",
    );
  }

  const flags = bytes[32];
  return {
    userPresent: Boolean(flags & 0x01),
    userVerified: Boolean(flags & 0x04),
  };
}

function getAuthenticatorRpIdHash(input: ArrayBuffer): Uint8Array {
  const bytes = new Uint8Array(input);
  if (bytes.byteLength < 32) {
    throw new PasskeyVerificationError("Authenticator data is too short to read RP ID hash.");
  }
  return bytes.slice(0, 32);
}

async function importCredentialPublicKey(
  expected: VerifyApprovalOptions,
): Promise<CryptoKey | null> {
  const value = expected.credentialPublicKey;
  if (!value) {
    return null;
  }
  if (value instanceof CryptoKey) {
    return value;
  }

  const format =
    expected.credentialPublicKeyFormat ??
    (value instanceof Uint8Array || value instanceof ArrayBuffer ? "spki" : "jwk");
  const subtle = requireSubtle();

  if (format === "jwk") {
    return await subtle.importKey(
      "jwk",
      value as JsonWebKey,
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["verify"],
    );
  }

  return await subtle.importKey(
    format,
    toUint8Array(value as Uint8Array | ArrayBuffer),
    format === "spki"
      ? {
          name: "ECDSA",
          namedCurve: "P-256",
        }
      : {
          name: "ECDSA",
        },
    false,
    ["verify"],
  );
}

async function verifyApprovalSignature(
  approval: PasskeyApproval,
  key: CryptoKey,
): Promise<boolean> {
  const clientDataHash = await shaDigest(approval.response.clientDataJSON, "SHA-256");
  const signedBytes = concatBytes(
    approval.response.authenticatorData,
    clientDataHash,
  );

  return await requireSubtle().verify(
    {
      name: "ECDSA",
      hash: "SHA-256",
    },
    key,
    approval.response.signature,
    signedBytes,
  );
}

export async function validateApprovalContext(
  approval: PasskeyApproval,
  expected: VerifyApprovalOptions,
): Promise<VerifyApprovalResult> {
  const reasons: string[] = [];
  const clientData = parseClientDataJSON(approval.response.clientDataJSON);
  const flags = parseAuthenticatorFlags(approval.response.authenticatorData);

  const expectedChallenge = toUint8Array(await buildChallenge(expected.challenge));
  const actualChallenge = base64UrlToBytes(clientData.challenge);

  if (!equalBytes(expectedChallenge, actualChallenge)) {
    reasons.push("Challenge mismatch.");
  }

  const expectedChallengeHash = bytesToBase64Url(
    await shaDigest(expectedChallenge, "SHA-256"),
  );
  if (approval.metadata.challengeHashBase64Url !== expectedChallengeHash) {
    reasons.push("Challenge hash metadata mismatch.");
  }

  if (expected.expectedOrigin && clientData.origin !== expected.expectedOrigin) {
    reasons.push("Origin mismatch.");
  }

  if (expected.expectedOrigin && approval.metadata.origin !== expected.expectedOrigin) {
    reasons.push("Approval metadata origin mismatch.");
  }

  if (expected.expectedRpId && approval.metadata.rpId !== expected.expectedRpId) {
    reasons.push("RP ID metadata mismatch.");
  }

  if (expected.expectedRpId) {
    const expectedRpHash = await shaDigest(
      new TextEncoder().encode(expected.expectedRpId),
      "SHA-256",
    );
    const actualRpHash = getAuthenticatorRpIdHash(approval.response.authenticatorData);
    if (!equalBytes(expectedRpHash, actualRpHash)) {
      reasons.push("RP ID hash mismatch.");
    }
  }

  if (expected.requireUserPresence && !flags.userPresent) {
    reasons.push("User presence required but not present.");
  }

  if (expected.requireUserVerification && !flags.userVerified) {
    reasons.push("User verification required but not present.");
  }

  let signatureVerified: boolean | null = null;
  const verificationKey = await importCredentialPublicKey(expected);
  if (verificationKey) {
    signatureVerified = await verifyApprovalSignature(approval, verificationKey);
    if (!signatureVerified) {
      reasons.push("Assertion signature verification failed.");
    }
  } else if (expected.requireSignatureVerification) {
    reasons.push(
      "Signature verification required but credentialPublicKey was not provided.",
    );
  }

  return {
    ok: reasons.length === 0,
    reasons,
    signatureVerified,
    flags,
  };
}

export async function verifyApproval(
  approval: PasskeyApproval,
  expected: VerifyApprovalOptions,
): Promise<VerifyApprovalResult> {
  return await validateApprovalContext(approval, expected);
}
