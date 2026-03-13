export const SUPPORTED_PROOF_VERSION = "portable-proof/v1" as const;
export const SUPPORTED_KIND = "portable-proof/signature" as const;
export const SUPPORTED_SIGNATURE_ALGORITHM = "ECDSA-P256-SHA256" as const;
export const SUPPORTED_HASH_ALGORITHM = "SHA-256" as const;

export type SupportedCanonicalization = "ternent-utils/canonicalStringify-v1" | "raw-bytes";

export type PortableProofPayload = {
  contentHash: string;
  hashAlgorithm: typeof SUPPORTED_HASH_ALGORITHM;
  signatureAlgorithm: typeof SUPPORTED_SIGNATURE_ALGORITHM;
  canonicalization: SupportedCanonicalization;
};

export type PortableProofV1 = {
  version: typeof SUPPORTED_PROOF_VERSION;
  kind: typeof SUPPORTED_KIND;
  payload: PortableProofPayload;
  signerPublicKeyPem: string;
  fingerprint: string;
  signature: string;
};
