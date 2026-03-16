import { createSealPublicKeyArtifact } from "../proof";

export async function createPublicKeyArtifact(params: {
  identity: import("@ternent/identity").SerializedIdentity;
}) {
  return createSealPublicKeyArtifact(params);
}
