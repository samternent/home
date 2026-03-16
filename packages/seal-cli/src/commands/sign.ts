import { basename } from "node:path";
import { readFile } from "node:fs/promises";
import { parseSealManifestJson } from "../manifest";
import { createSealProof, createSealHash, type SealProofV1 } from "../proof";

export async function createProofArtifact(params: {
  inputPath: string;
  identity: import("@ternent/identity").SerializedIdentity;
}): Promise<{
  proof: SealProofV1;
  content: string;
}> {
  const bytes = await readFile(params.inputPath);
  const raw = new TextDecoder().decode(bytes);
  const parsedManifest = parseSealManifestJson(raw);
  const proof = await createSealProof({
    signer: {
      identity: params.identity,
    },
    subject: {
      kind: parsedManifest.ok ? "manifest" : "file",
      path: basename(params.inputPath),
      hash: await createSealHash(bytes),
    },
  });

  return {
    proof,
    content: `${JSON.stringify(proof, null, 2)}\n`,
  };
}
