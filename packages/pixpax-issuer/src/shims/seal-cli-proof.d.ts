declare module "@ternent/seal-cli/proof" {
  import type { SerializedIdentity } from "@ternent/identity";

  export type SealProofV1 = {
    version: "2";
    type: "seal-proof";
    algorithm: "Ed25519";
    createdAt: string;
    subject: {
      kind: "file" | "manifest" | "artifact";
      path: string;
      hash: `sha256:${string}`;
    };
    signer: {
      publicKey: string;
      keyId: string;
    };
    signature: string;
  };

  export function createSealProof(input: {
    createdAt?: string;
    signer: {
      identity: SerializedIdentity;
    };
    subject: SealProofV1["subject"];
  }): Promise<SealProofV1>;

  export function verifySealProofAgainstBytes(
    proof: SealProofV1,
    bytes: Uint8Array | ArrayBuffer,
  ): Promise<{
    valid: boolean;
    hashMatch: boolean;
    signatureValid: boolean;
    keyId: string;
    algorithm: "Ed25519";
    subjectHash: `sha256:${string}`;
  }>;
}
