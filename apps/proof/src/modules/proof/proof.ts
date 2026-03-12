import { importPrivateKeyFromPem, importPublicKeyFromPem, sign, verify } from "ternent-identity";
import { canonicalStringify, hashData, stripIdentityKey } from "ternent-utils";
import type { StoredIdentity } from "@/modules/identity";
import {
  SUPPORTED_HASH_ALGORITHM,
  SUPPORTED_KIND,
  SUPPORTED_PROOF_VERSION,
  SUPPORTED_SIGNATURE_ALGORITHM,
  type PortableProofPayload,
  type PortableProofV1,
} from "./types";

type ProofSignableFields = Omit<PortableProofV1, "signature">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function getProofSignableFields(proof: ProofSignableFields | PortableProofV1): ProofSignableFields {
  return {
    version: proof.version,
    kind: proof.kind,
    payload: proof.payload,
    signerPublicKeyPem: proof.signerPublicKeyPem,
    fingerprint: proof.fingerprint,
  };
}

export function getProofSigningPayload(proof: ProofSignableFields | PortableProofV1): string {
  return canonicalStringify(getProofSignableFields(proof));
}

export async function createPortableProof(input: {
  payload: PortableProofPayload;
  identity: StoredIdentity;
}): Promise<PortableProofV1> {
  const fields: ProofSignableFields = {
    version: SUPPORTED_PROOF_VERSION,
    kind: SUPPORTED_KIND,
    payload: input.payload,
    signerPublicKeyPem: input.identity.publicKeyPem,
    fingerprint: input.identity.fingerprint,
  };

  const signingPayload = getProofSigningPayload(fields);
  const privateKey = await importPrivateKeyFromPem(input.identity.privateKeyPem);
  const signature = await sign(privateKey, signingPayload);

  return {
    ...fields,
    signature,
  };
}

export function validatePortableProofShape(value: unknown): {
  ok: boolean;
  errors: string[];
  proof: PortableProofV1 | null;
} {
  if (!isRecord(value)) {
    return { ok: false, errors: ["Proof must be a JSON object."], proof: null };
  }

  const version = value.version;
  const kind = value.kind;
  const signerPublicKeyPem = value.signerPublicKeyPem;
  const fingerprint = value.fingerprint;
  const signature = value.signature;
  const payload = value.payload;

  const errors: string[] = [];

  if (typeof version !== "string") errors.push("Missing proof version.");
  if (typeof kind !== "string") errors.push("Missing proof kind.");
  if (typeof signerPublicKeyPem !== "string") errors.push("Missing signer public key.");
  if (typeof fingerprint !== "string") errors.push("Missing signer fingerprint.");
  if (typeof signature !== "string") errors.push("Missing signature.");

  if (!isRecord(payload)) {
    errors.push("Missing proof payload.");
  }

  if (errors.length > 0 || !isRecord(payload)) {
    return { ok: false, errors, proof: null };
  }

  const contentHash = payload.contentHash;
  const hashAlgorithm = payload.hashAlgorithm;
  const signatureAlgorithm = payload.signatureAlgorithm;
  const canonicalization = payload.canonicalization;

  if (typeof contentHash !== "string" || contentHash.length === 0) {
    errors.push("Missing payload content hash.");
  }
  if (typeof hashAlgorithm !== "string") {
    errors.push("Missing payload hash algorithm.");
  }
  if (typeof signatureAlgorithm !== "string") {
    errors.push("Missing payload signature algorithm.");
  }
  if (typeof canonicalization !== "string") {
    errors.push("Missing payload canonicalization.");
  }

  if (errors.length > 0) {
    return { ok: false, errors, proof: null };
  }

  const proof: PortableProofV1 = {
    version: version as PortableProofV1["version"],
    kind: kind as PortableProofV1["kind"],
    signerPublicKeyPem,
    fingerprint,
    signature,
    payload: {
      contentHash,
      hashAlgorithm: hashAlgorithm as PortableProofV1["payload"]["hashAlgorithm"],
      signatureAlgorithm: signatureAlgorithm as PortableProofV1["payload"]["signatureAlgorithm"],
      canonicalization: canonicalization as PortableProofV1["payload"]["canonicalization"],
    },
  };

  return { ok: true, errors: [], proof };
}

export async function verifyPortableProofSignature(proof: PortableProofV1): Promise<{
  ok: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  if (proof.version !== SUPPORTED_PROOF_VERSION) {
    errors.push(`Unsupported proof version: ${proof.version}`);
  }

  if (proof.kind !== SUPPORTED_KIND) {
    errors.push(`Unsupported proof kind: ${proof.kind}`);
  }

  if (proof.payload.hashAlgorithm !== SUPPORTED_HASH_ALGORITHM) {
    errors.push(`Unsupported hash algorithm: ${proof.payload.hashAlgorithm}`);
  }

  if (proof.payload.signatureAlgorithm !== SUPPORTED_SIGNATURE_ALGORITHM) {
    errors.push(`Unsupported signature algorithm: ${proof.payload.signatureAlgorithm}`);
  }

  if (
    proof.payload.canonicalization !== "ternent-utils/canonicalStringify-v1" &&
    proof.payload.canonicalization !== "raw-bytes"
  ) {
    errors.push(`Unsupported canonicalization: ${proof.payload.canonicalization}`);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const expectedFingerprint = await hashData(stripIdentityKey(proof.signerPublicKeyPem));
  if (expectedFingerprint !== proof.fingerprint) {
    return {
      ok: false,
      errors: ["Signer fingerprint does not match signer public key."],
    };
  }

  try {
    const publicKey = await importPublicKeyFromPem(proof.signerPublicKeyPem);
    const isValid = await verify(proof.signature, getProofSigningPayload(proof), publicKey);

    if (!isValid) {
      return {
        ok: false,
        errors: ["Invalid signature."],
      };
    }

    return { ok: true, errors: [] };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    return {
      ok: false,
      errors: [`Failed to verify signature: ${message}`],
    };
  }
}

export function parsePortableProofJson(raw: string): {
  ok: boolean;
  errors: string[];
  proof: PortableProofV1 | null;
} {
  try {
    const parsed = JSON.parse(raw);
    return validatePortableProofShape(parsed);
  } catch {
    return {
      ok: false,
      errors: ["Proof JSON is not valid JSON."],
      proof: null,
    };
  }
}
