import { createSealPublicKeyArtifact } from "../proof";

export async function createPublicKeyArtifact(params: {
  privateKeyPem: string;
  publicKeyPem?: string;
}) {
  return createSealPublicKeyArtifact({
    privateKeyPem: params.privateKeyPem,
    publicKeyPem: params.publicKeyPem,
  });
}
