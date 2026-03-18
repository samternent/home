import {
  decryptWithIdentity,
  encryptForRecipients,
  initArmour,
  type ArmourIdentityInput,
} from "@ternent/armour";
import { canonicalStringify } from "ternent-utils";
import type { SealHash } from "./manifest";
import {
  createSealHash,
  createSealProof,
  validateSealProofShape,
  verifySealProofSignature,
  type SealProofV1,
} from "./proof";
import type { SealSignerInput } from "./crypto";
import {
  toSealDecryptionError,
  toSealEncryptionError,
  unsupportedEncryptionModeError,
} from "./errors";

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder();

export const SEAL_ARTIFACT_VERSION = "1" as const;
export const SEAL_ARTIFACT_TYPE = "seal-artifact" as const;
export const SEAL_ARTIFACT_MANIFEST_VERSION = "1" as const;

export type SealArtifactManifestV1 = {
  version: typeof SEAL_ARTIFACT_MANIFEST_VERSION;
  payloadType: "encrypted";
  payloadScheme: "age";
  payloadMode: "recipients";
  payloadEncoding: "armor";
  payloadHash: SealHash;
};

export type SealEncryptedPayloadV1 = {
  type: "encrypted";
  scheme: "age";
  mode: "recipients";
  encoding: "armor";
  data: string;
};

export type SealArtifactUnsignedV1 = {
  version: typeof SEAL_ARTIFACT_VERSION;
  type: typeof SEAL_ARTIFACT_TYPE;
  manifest: SealArtifactManifestV1;
  payload: SealEncryptedPayloadV1;
};

export type SealArtifactV1 = SealArtifactUnsignedV1 & {
  proof: SealProofV1;
};

export type VerifySealArtifactResult = {
  valid: boolean;
  hashMatch: boolean;
  signatureValid: boolean;
  encrypted: boolean;
  payloadScheme: "age";
  payloadMode: "recipients";
  keyId: string;
  algorithm: SealProofV1["algorithm"];
  subjectHash: SealHash;
  errors: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: string[]
): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isSealHash(value: unknown): value is SealHash {
  return typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value);
}

function normalizeBytes(
  value: Uint8Array | ArrayBuffer
): Uint8Array {
  return value instanceof Uint8Array ? value : new Uint8Array(value);
}

export function getSealArtifactUnsignedFields(
  artifact: SealArtifactV1 | SealArtifactUnsignedV1
): SealArtifactUnsignedV1 {
  return {
    version: artifact.version,
    type: artifact.type,
    manifest: artifact.manifest,
    payload: artifact.payload,
  };
}

function getUnsignedArtifactBytes(
  artifact: SealArtifactV1 | SealArtifactUnsignedV1
): Uint8Array {
  return utf8Encoder.encode(canonicalStringify(getSealArtifactUnsignedFields(artifact)));
}

export async function createSealArtifact(input: {
  createdAt?: string;
  signer: SealSignerInput;
  subjectPath: string;
  payload: Uint8Array | ArrayBuffer;
  recipients: string[];
}): Promise<SealArtifactV1> {
  const plaintext = normalizeBytes(input.payload);

  try {
    await initArmour();

    const ciphertext = await encryptForRecipients({
      recipients: input.recipients,
      data: plaintext,
      output: "armor",
    });
    const payloadData = utf8Decoder.decode(ciphertext);
    const manifest: SealArtifactManifestV1 = {
      version: SEAL_ARTIFACT_MANIFEST_VERSION,
      payloadType: "encrypted",
      payloadScheme: "age",
      payloadMode: "recipients",
      payloadEncoding: "armor",
      payloadHash: await createSealHash(ciphertext),
    };
    const payload: SealEncryptedPayloadV1 = {
      type: "encrypted",
      scheme: "age",
      mode: "recipients",
      encoding: "armor",
      data: payloadData,
    };
    const unsignedArtifact: SealArtifactUnsignedV1 = {
      version: SEAL_ARTIFACT_VERSION,
      type: SEAL_ARTIFACT_TYPE,
      manifest,
      payload,
    };

    const proof = await createSealProof({
      createdAt: input.createdAt,
      signer: input.signer,
      subject: {
        kind: "artifact",
        path: input.subjectPath,
        hash: await createSealHash(getUnsignedArtifactBytes(unsignedArtifact)),
      },
    });

    return {
      ...unsignedArtifact,
      proof,
    };
  } catch (error) {
    throw toSealEncryptionError(error);
  }
}

export function validateSealArtifactShape(value: unknown): {
  ok: boolean;
  errors: string[];
  artifact: SealArtifactV1 | null;
} {
  if (!isRecord(value)) {
    return {
      ok: false,
      errors: ["Artifact must be a JSON object."],
      artifact: null,
    };
  }

  const errors: string[] = [];

  if (!hasOnlyKeys(value, ["version", "type", "manifest", "payload", "proof"])) {
    errors.push("Artifact contains unsupported fields.");
  }
  if (value.version !== SEAL_ARTIFACT_VERSION) {
    errors.push(`Artifact version must be ${SEAL_ARTIFACT_VERSION}.`);
  }
  if (value.type !== SEAL_ARTIFACT_TYPE) {
    errors.push(`Artifact type must be ${SEAL_ARTIFACT_TYPE}.`);
  }
  if (!isRecord(value.manifest)) {
    errors.push("Artifact manifest must be an object.");
  }
  if (!isRecord(value.payload)) {
    errors.push("Artifact payload must be an object.");
  }
  if (!isRecord(value.proof)) {
    errors.push("Artifact proof must be an object.");
  }

  if (
    errors.length > 0 ||
    !isRecord(value.manifest) ||
    !isRecord(value.payload) ||
    !isRecord(value.proof)
  ) {
    return {
      ok: false,
      errors,
      artifact: null,
    };
  }

  if (
    !hasOnlyKeys(value.manifest, [
      "version",
      "payloadType",
      "payloadScheme",
      "payloadMode",
      "payloadEncoding",
      "payloadHash",
    ])
  ) {
    errors.push("Artifact manifest contains unsupported fields.");
  }
  if (
    !hasOnlyKeys(value.payload, [
      "type",
      "scheme",
      "mode",
      "encoding",
      "data",
    ])
  ) {
    errors.push("Artifact payload contains unsupported fields.");
  }

  if (value.manifest.version !== SEAL_ARTIFACT_MANIFEST_VERSION) {
    errors.push(
      `Artifact manifest version must be ${SEAL_ARTIFACT_MANIFEST_VERSION}.`
    );
  }
  if (value.manifest.payloadType !== "encrypted") {
    errors.push("Artifact manifest payloadType must be encrypted.");
  }
  if (value.manifest.payloadScheme !== "age") {
    errors.push("Artifact manifest payloadScheme must be age.");
  }
  if (value.manifest.payloadMode !== "recipients") {
    errors.push("Artifact manifest payloadMode must be recipients.");
  }
  if (value.manifest.payloadEncoding !== "armor") {
    errors.push("Artifact manifest payloadEncoding must be armor.");
  }
  if (!isSealHash(value.manifest.payloadHash)) {
    errors.push("Artifact manifest payloadHash must be a sha256 hash.");
  }

  if (value.payload.type !== "encrypted") {
    errors.push("Artifact payload type must be encrypted.");
  }
  if (value.payload.scheme !== "age") {
    errors.push("Artifact payload scheme must be age.");
  }
  if (value.payload.mode !== "recipients") {
    errors.push("Artifact payload mode must be recipients.");
  }
  if (value.payload.encoding !== "armor") {
    errors.push("Artifact payload encoding must be armor.");
  }
  if (typeof value.payload.data !== "string" || value.payload.data.length === 0) {
    errors.push("Artifact payload data must be a non-empty string.");
  }

  if (
    value.manifest.payloadType !== value.payload.type ||
    value.manifest.payloadScheme !== value.payload.scheme ||
    value.manifest.payloadMode !== value.payload.mode ||
    value.manifest.payloadEncoding !== value.payload.encoding
  ) {
    errors.push("Artifact manifest and payload metadata must match.");
  }

  const proofValidation = validateSealProofShape(value.proof);
  if (!proofValidation.ok || !proofValidation.proof) {
    errors.push(...proofValidation.errors);
  } else if (proofValidation.proof.subject.kind !== "artifact") {
    errors.push("Artifact proof subject kind must be artifact.");
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      artifact: null,
    };
  }

  return {
    ok: true,
    errors: [],
    artifact: value as SealArtifactV1,
  };
}

export function parseSealArtifactJson(raw: string): {
  ok: boolean;
  errors: string[];
  artifact: SealArtifactV1 | null;
} {
  try {
    return validateSealArtifactShape(JSON.parse(raw));
  } catch {
    return {
      ok: false,
      errors: ["Artifact JSON is not valid JSON."],
      artifact: null,
    };
  }
}

export async function verifySealArtifact(
  artifact: SealArtifactV1
): Promise<VerifySealArtifactResult> {
  const validation = validateSealArtifactShape(artifact);
  if (!validation.ok || !validation.artifact) {
    return {
      valid: false,
      hashMatch: false,
      signatureValid: false,
      encrypted: true,
      payloadScheme: "age",
      payloadMode: "recipients",
      keyId: "",
      algorithm: "Ed25519",
      subjectHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      errors: validation.errors,
    };
  }

  const signatureCheck = await verifySealProofSignature(artifact.proof);
  const subjectHash = await createSealHash(getUnsignedArtifactBytes(artifact));
  const payloadHash = await createSealHash(utf8Encoder.encode(artifact.payload.data));
  const artifactHashMatch = artifact.proof.subject.hash === subjectHash;
  const payloadHashMatch = artifact.manifest.payloadHash === payloadHash;
  const errors = [...signatureCheck.errors];

  if (!artifactHashMatch) {
    errors.push("Artifact hash does not match proof subject hash.");
  }
  if (!payloadHashMatch) {
    errors.push("Encrypted payload hash does not match manifest payload hash.");
  }

  return {
    valid: signatureCheck.ok && artifactHashMatch && payloadHashMatch,
    hashMatch: artifactHashMatch && payloadHashMatch,
    signatureValid: signatureCheck.ok,
    encrypted: true,
    payloadScheme: artifact.payload.scheme,
    payloadMode: artifact.payload.mode,
    keyId: artifact.proof.signer.keyId,
    algorithm: artifact.proof.algorithm,
    subjectHash,
    errors,
  };
}

export async function decryptSealArtifactPayload(input: {
  artifact: SealArtifactV1;
  identity: ArmourIdentityInput;
}): Promise<Uint8Array> {
  const verification = await verifySealArtifact(input.artifact);
  if (!verification.valid) {
    throw new Error(
      verification.errors.join(" ") || "Artifact verification failed."
    );
  }

  if (
    input.artifact.payload.type !== "encrypted" ||
    input.artifact.payload.scheme !== "age" ||
    input.artifact.payload.mode !== "recipients" ||
    input.artifact.payload.encoding !== "armor"
  ) {
    throw unsupportedEncryptionModeError(
      "Seal only supports age recipient-mode armored payloads."
    );
  }

  try {
    await initArmour();
    return await decryptWithIdentity({
      identity: input.identity,
      data: utf8Encoder.encode(input.artifact.payload.data),
    });
  } catch (error) {
    throw toSealDecryptionError(error);
  }
}
