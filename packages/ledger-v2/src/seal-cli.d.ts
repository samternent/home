declare module "@ternent/seal-cli" {
  export function createSealHash(
    bytes: Uint8Array | ArrayBuffer
  ): Promise<`sha256:${string}`>;

  export function createSealProof(input: {
    createdAt?: string;
    signer: { identity: unknown };
    subject: {
      kind: "file" | "manifest" | "artifact";
      path: string;
      hash: `sha256:${string}`;
    };
  }): Promise<unknown>;

  export function verifySealProofAgainstBytes(
    proof: unknown,
    bytes: Uint8Array | ArrayBuffer
  ): Promise<{
    valid: boolean;
    hashMatch: boolean;
    signatureValid: boolean;
    keyId: string;
    algorithm: string;
    subjectHash: `sha256:${string}`;
  }>;
}
