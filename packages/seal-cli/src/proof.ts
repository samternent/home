import { canonicalStringify, hashBytes } from "ternent-utils";
import {
  resolveSealSigner,
  signSealUtf8,
  verifyPublicKeyKeyId,
  verifySealUtf8,
  type SealSignerInput,
} from "./crypto";

export const SEAL_PROOF_VERSION = "2" as const;
export const SEAL_PROOF_TYPE = "seal-proof" as const;
export const SEAL_PUBLIC_KEY_TYPE = "seal-public-key" as const;
export const SEAL_SIGNATURE_ALGORITHM = "Ed25519" as const;

export type SealSubjectKind = "file" | "manifest" | "artifact";

export type SealProofV1 = {
  version: typeof SEAL_PROOF_VERSION;
  type: typeof SEAL_PROOF_TYPE;
  algorithm: typeof SEAL_SIGNATURE_ALGORITHM;
  createdAt: string;
  subject: {
    kind: SealSubjectKind;
    path: string;
    hash: `sha256:${string}`;
  };
  signer: {
    publicKey: string;
    keyId: string;
  };
  signature: string;
};

export type SealPublicKeyArtifact = {
  version: typeof SEAL_PROOF_VERSION;
  type: typeof SEAL_PUBLIC_KEY_TYPE;
  algorithm: typeof SEAL_SIGNATURE_ALGORITHM;
  publicKey: string;
  keyId: string;
};

type SealProofSignableFields = Omit<SealProofV1, "signature">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: string[]
): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isSealHash(value: unknown): value is `sha256:${string}` {
  return typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value);
}

function isIsoDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

export function getSealProofSignableFields(
  proof: SealProofV1 | SealProofSignableFields
): SealProofSignableFields {
  return {
    version: proof.version,
    type: proof.type,
    algorithm: proof.algorithm,
    createdAt: proof.createdAt,
    subject: proof.subject,
    signer: proof.signer,
  };
}

export function getSealProofSigningPayload(
  proof: SealProofV1 | SealProofSignableFields
): string {
  return canonicalStringify(getSealProofSignableFields(proof));
}

export async function createSealHash(
  bytes: Uint8Array | ArrayBuffer
): Promise<`sha256:${string}`> {
  const hash = await hashBytes(bytes);
  return `sha256:${hash}`;
}

export async function createSealProof(input: {
  createdAt?: string;
  signer: SealSignerInput;
  subject: SealProofV1["subject"];
}): Promise<SealProofV1> {
  const signer = await resolveSealSigner(input.signer);
  const fields: SealProofSignableFields = {
    version: SEAL_PROOF_VERSION,
    type: SEAL_PROOF_TYPE,
    algorithm: SEAL_SIGNATURE_ALGORITHM,
    createdAt: input.createdAt ?? new Date().toISOString(),
    subject: input.subject,
    signer: {
      publicKey: signer.publicKey,
      keyId: signer.keyId,
    },
  };

  const signature = await signSealUtf8(
    signer.identity,
    getSealProofSigningPayload(fields)
  );

  return {
    ...fields,
    signature,
  };
}

export async function createSealPublicKeyArtifact(
  signer: SealSignerInput
): Promise<SealPublicKeyArtifact> {
  const resolved = await resolveSealSigner(signer);
  return {
    version: SEAL_PROOF_VERSION,
    type: SEAL_PUBLIC_KEY_TYPE,
    algorithm: SEAL_SIGNATURE_ALGORITHM,
    publicKey: resolved.publicKey,
    keyId: resolved.keyId,
  };
}

export function validateSealProofShape(value: unknown): {
  ok: boolean;
  errors: string[];
  proof: SealProofV1 | null;
} {
  if (!isRecord(value)) {
    return { ok: false, errors: ["Proof must be a JSON object."], proof: null };
  }

  const errors: string[] = [];

  if (
    !hasOnlyKeys(value, [
      "version",
      "type",
      "algorithm",
      "createdAt",
      "subject",
      "signer",
      "signature",
    ])
  ) {
    errors.push("Proof contains unsupported fields.");
  }

  if (value.version !== SEAL_PROOF_VERSION) {
    errors.push(`Proof version must be ${SEAL_PROOF_VERSION}.`);
  }
  if (value.type !== SEAL_PROOF_TYPE) {
    errors.push(`Proof type must be ${SEAL_PROOF_TYPE}.`);
  }
  if (value.algorithm !== SEAL_SIGNATURE_ALGORITHM) {
    errors.push(`Proof algorithm must be ${SEAL_SIGNATURE_ALGORITHM}.`);
  }
  if (typeof value.createdAt !== "string" || !isIsoDate(value.createdAt)) {
    errors.push("Proof createdAt must be an ISO timestamp.");
  }
  if (typeof value.signature !== "string" || value.signature.length === 0) {
    errors.push("Proof signature must be a non-empty base64url string.");
  }
  if (!isRecord(value.subject)) {
    errors.push("Proof subject must be an object.");
  }
  if (!isRecord(value.signer)) {
    errors.push("Proof signer must be an object.");
  }

  if (errors.length > 0 || !isRecord(value.subject) || !isRecord(value.signer)) {
    return { ok: false, errors, proof: null };
  }

  if (!hasOnlyKeys(value.subject, ["kind", "path", "hash"])) {
    errors.push("Proof subject contains unsupported fields.");
  }
  if (!hasOnlyKeys(value.signer, ["publicKey", "keyId"])) {
    errors.push("Proof signer contains unsupported fields.");
  }
  if (
    value.subject.kind !== "file" &&
    value.subject.kind !== "manifest" &&
    value.subject.kind !== "artifact"
  ) {
    errors.push("Proof subject kind must be file, manifest, or artifact.");
  }
  if (typeof value.subject.path !== "string" || value.subject.path.length === 0) {
    errors.push("Proof subject path must be a non-empty string.");
  }
  if (!isSealHash(value.subject.hash)) {
    errors.push("Proof subject hash must be a sha256 hash.");
  }
  if (
    typeof value.signer.publicKey !== "string" ||
    value.signer.publicKey.length === 0
  ) {
    errors.push("Proof signer publicKey must be a non-empty base64url string.");
  }
  if (typeof value.signer.keyId !== "string" || value.signer.keyId.length === 0) {
    errors.push("Proof signer keyId must be a non-empty string.");
  }

  if (errors.length > 0) {
    return { ok: false, errors, proof: null };
  }

  return {
    ok: true,
    errors: [],
    proof: value as SealProofV1,
  };
}

export function parseSealProofJson(raw: string): {
  ok: boolean;
  errors: string[];
  proof: SealProofV1 | null;
} {
  try {
    return validateSealProofShape(JSON.parse(raw));
  } catch {
    return {
      ok: false,
      errors: ["Proof JSON is not valid JSON."],
      proof: null,
    };
  }
}

export function validateSealPublicKeyShape(value: unknown): {
  ok: boolean;
  errors: string[];
  artifact: SealPublicKeyArtifact | null;
} {
  if (!isRecord(value)) {
    return {
      ok: false,
      errors: ["Public key artifact must be a JSON object."],
      artifact: null,
    };
  }

  const errors: string[] = [];

  if (!hasOnlyKeys(value, ["version", "type", "algorithm", "publicKey", "keyId"])) {
    errors.push("Public key artifact contains unsupported fields.");
  }
  if (value.version !== SEAL_PROOF_VERSION) {
    errors.push(`Public key artifact version must be ${SEAL_PROOF_VERSION}.`);
  }
  if (value.type !== SEAL_PUBLIC_KEY_TYPE) {
    errors.push(`Public key artifact type must be ${SEAL_PUBLIC_KEY_TYPE}.`);
  }
  if (value.algorithm !== SEAL_SIGNATURE_ALGORITHM) {
    errors.push(`Public key artifact algorithm must be ${SEAL_SIGNATURE_ALGORITHM}.`);
  }
  if (typeof value.publicKey !== "string" || value.publicKey.length === 0) {
    errors.push("Public key artifact publicKey must be a non-empty base64url string.");
  }
  if (typeof value.keyId !== "string" || value.keyId.length === 0) {
    errors.push("Public key artifact keyId must be a non-empty string.");
  }

  if (errors.length > 0) {
    return { ok: false, errors, artifact: null };
  }

  return {
    ok: true,
    errors: [],
    artifact: value as SealPublicKeyArtifact,
  };
}

export function parseSealPublicKeyJson(raw: string): {
  ok: boolean;
  errors: string[];
  artifact: SealPublicKeyArtifact | null;
} {
  try {
    return validateSealPublicKeyShape(JSON.parse(raw));
  } catch {
    return {
      ok: false,
      errors: ["Public key JSON is not valid JSON."],
      artifact: null,
    };
  }
}

export async function verifySealProofSignature(proof: SealProofV1): Promise<{
  ok: boolean;
  errors: string[];
}> {
  const validation = validateSealProofShape(proof);
  if (!validation.ok || !validation.proof) {
    return { ok: false, errors: validation.errors };
  }

  if (!(await verifyPublicKeyKeyId(proof.signer.publicKey, proof.signer.keyId))) {
    return {
      ok: false,
      errors: ["Proof signer keyId does not match signer public key."],
    };
  }

  try {
    const valid = await verifySealUtf8(
      proof.signature,
      getSealProofSigningPayload(proof),
      proof.signer.publicKey
    );
    if (!valid) {
      return { ok: false, errors: ["Invalid signature."] };
    }
    return { ok: true, errors: [] };
  } catch (caught) {
    return {
      ok: false,
      errors: ["Invalid signature."],
    };
  }
}

export async function verifySealProofAgainstBytes(
  proof: SealProofV1,
  bytes: Uint8Array | ArrayBuffer
): Promise<{
  valid: boolean;
  hashMatch: boolean;
  signatureValid: boolean;
  keyId: string;
  algorithm: typeof SEAL_SIGNATURE_ALGORITHM;
  subjectHash: `sha256:${string}`;
}> {
  const subjectHash = await createSealHash(bytes);
  const signatureCheck = await verifySealProofSignature(proof);
  const hashMatch = subjectHash === proof.subject.hash;
  const signatureValid = signatureCheck.ok;

  return {
    valid: hashMatch && signatureValid,
    hashMatch,
    signatureValid,
    keyId: proof.signer.keyId,
    algorithm: proof.algorithm,
    subjectHash,
  };
}
