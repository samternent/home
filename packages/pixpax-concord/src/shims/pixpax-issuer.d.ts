declare module "@ternent/pixpax-issuer" {
  import type {
    PixpaxPackIssuance,
    PixpaxSignedArtifact,
  } from "@ternent/pixpax-core";

  export function verifyPackIssuanceProof(input: {
    artifact: PixpaxSignedArtifact<PixpaxPackIssuance>;
  }): Promise<{
    ok: boolean;
    hashMatch: boolean;
    signatureValid: boolean;
    keyId: string;
    errors: string[];
  }>;
}
