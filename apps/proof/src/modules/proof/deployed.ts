import {
  parseSealProofJson,
  parseSealPublicKeyJson,
  verifySealProofAgainstBytes,
  verifySealProofSignature,
  type SealProofV1,
  type SealPublicKeyArtifact,
} from "seal-cli/proof";

export type PublishedArtifactsVerification = {
  valid: boolean;
  proof: SealProofV1 | null;
  publicKeyArtifact: SealPublicKeyArtifact | null;
  keyId: string;
  algorithm: string;
  subjectHash: string;
  errors: string[];
};

async function readText(response: Response): Promise<string> {
  return response.text();
}

async function readBytes(response: Response): Promise<ArrayBuffer> {
  return response.arrayBuffer();
}

export async function verifyPublishedArtifacts(
  fetcher: typeof fetch = fetch,
  baseUrl = ""
): Promise<PublishedArtifactsVerification> {
  const proofResponse = await fetcher(`${baseUrl}/proof.json`);
  const manifestResponse = await fetcher(`${baseUrl}/dist-manifest.json`);
  const publicKeyResponse = await fetcher(`${baseUrl}/public-key.json`);

  if (!proofResponse.ok) {
    throw new Error(`Failed to fetch /proof.json (${proofResponse.status}).`);
  }
  if (!manifestResponse.ok) {
    throw new Error(
      `Failed to fetch /dist-manifest.json (${manifestResponse.status}).`
    );
  }

  const proofRaw = await readText(proofResponse);
  const parsedProof = parseSealProofJson(proofRaw);
  if (!parsedProof.ok || !parsedProof.proof) {
    return {
      valid: false,
      proof: null,
      publicKeyArtifact: null,
      keyId: "",
      algorithm: "",
      subjectHash: "",
      errors: parsedProof.errors,
    };
  }

  const manifestBytes = await readBytes(manifestResponse);
  const signatureCheck = await verifySealProofSignature(parsedProof.proof);
  const verification = await verifySealProofAgainstBytes(
    parsedProof.proof,
    manifestBytes
  );

  const errors = [...signatureCheck.errors];

  if (parsedProof.proof.subject.kind !== "manifest") {
    errors.push("Published proof subject kind must be manifest.");
  }

  if (!verification.hashMatch) {
    errors.push("Published manifest hash does not match proof subject hash.");
  }

  let publicKeyArtifact: SealPublicKeyArtifact | null = null;
  if (publicKeyResponse.ok) {
    const parsedPublicKey = parseSealPublicKeyJson(await readText(publicKeyResponse));
    if (!parsedPublicKey.ok || !parsedPublicKey.artifact) {
      errors.push(...parsedPublicKey.errors);
    } else {
      publicKeyArtifact = parsedPublicKey.artifact;
      if (publicKeyArtifact.publicKey !== parsedProof.proof.signer.publicKey) {
        errors.push("Published public key does not match proof signer public key.");
      }
      if (publicKeyArtifact.keyId !== parsedProof.proof.signer.keyId) {
        errors.push("Published public key keyId does not match proof signer keyId.");
      }
    }
  } else if (publicKeyResponse.status !== 404) {
    errors.push(`Failed to fetch /public-key.json (${publicKeyResponse.status}).`);
  }

  return {
    valid: verification.valid && errors.length === 0,
    proof: parsedProof.proof,
    publicKeyArtifact,
    keyId: parsedProof.proof.signer.keyId,
    algorithm: parsedProof.proof.algorithm,
    subjectHash: verification.subjectHash,
    errors,
  };
}
