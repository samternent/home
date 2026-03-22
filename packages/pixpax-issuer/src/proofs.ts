import type { SerializedIdentity } from "@ternent/identity";
import {
  assertValidPackIssuance,
  assertValidSignedArtifact,
  assertValidTransferAcceptance,
  assertValidTransferOffer,
  hashCanonicalValue,
  stringifyCanonical,
  type PixpaxPackIssuance,
  type PixpaxSealProof,
  type PixpaxSignedArtifact,
  type PixpaxTransferAcceptance,
  type PixpaxTransferOffer,
} from "@ternent/pixpax-core";
import { createSealProof, verifySealProofAgainstBytes } from "@ternent/seal-cli";
import { createDeterministicPackIssuance, createIssuanceProofSubjectPath } from "./issuance.js";

const utf8 = new TextEncoder();

function createVerificationErrors(input: {
  hashMatch: boolean;
  signatureValid: boolean;
}): string[] {
  const errors: string[] = [];
  if (!input.hashMatch) {
    errors.push("Payload hash does not match the signed issuer proof.");
  }
  if (!input.signatureValid) {
    errors.push("Issuer proof signature is invalid.");
  }
  return errors;
}

async function createProofForPayload(input: {
  identity: SerializedIdentity;
  payload: object;
  subjectPath: string;
  createdAt?: string;
}): Promise<PixpaxSealProof> {
  const hash = await hashCanonicalValue(input.payload);
  const proof = await createSealProof({
    createdAt: input.createdAt,
    signer: {
      identity: input.identity,
    },
    subject: {
      kind: "artifact",
      path: input.subjectPath,
      hash,
    },
  });
  return proof as PixpaxSealProof;
}

export async function signPackIssuance(input: {
  identity: SerializedIdentity;
  issuance: PixpaxPackIssuance;
  subjectPath?: string;
  createdAt?: string;
}): Promise<PixpaxSignedArtifact<PixpaxPackIssuance>> {
  const issuance = await assertValidPackIssuance(input.issuance);
  const proof = await createProofForPayload({
    identity: input.identity,
    payload: issuance,
    subjectPath:
      input.subjectPath || (await createIssuanceProofSubjectPath(issuance)),
    createdAt: input.createdAt,
  });
  return {
    payload: issuance,
    proof,
  };
}

export async function verifyPackIssuanceProof(input: {
  artifact: PixpaxSignedArtifact<PixpaxPackIssuance>;
}): Promise<{
  ok: boolean;
  hashMatch: boolean;
  signatureValid: boolean;
  keyId: string;
  errors: string[];
}> {
  const artifact = await assertValidSignedArtifact(input.artifact);
  const issuance = await assertValidPackIssuance(artifact.payload);
  const verification = await verifySealProofAgainstBytes(
    artifact.proof,
    utf8.encode(stringifyCanonical(issuance)),
  );
  const errors = createVerificationErrors(verification);
  return {
    ok: verification.valid,
    hashMatch: verification.hashMatch,
    signatureValid: verification.signatureValid,
    keyId: verification.keyId,
    errors,
  };
}

export async function signTransferOffer(input: {
  identity: SerializedIdentity;
  offer: PixpaxTransferOffer;
  subjectPath?: string;
  createdAt?: string;
}): Promise<PixpaxSignedArtifact<PixpaxTransferOffer>> {
  const offer = await assertValidTransferOffer(input.offer);
  const proof = await createProofForPayload({
    identity: input.identity,
    payload: offer,
    subjectPath:
      input.subjectPath ||
      `pixpax/transfers/${offer.collectionId}/${offer.collectionVersion}/${offer.transferId}.json`,
    createdAt: input.createdAt,
  });
  return {
    payload: offer,
    proof,
  };
}

export async function verifyTransferProof(input: {
  artifact: PixpaxSignedArtifact<PixpaxTransferOffer>;
}): Promise<{
  ok: boolean;
  hashMatch: boolean;
  signatureValid: boolean;
  keyId: string;
  errors: string[];
}> {
  const artifact = await assertValidSignedArtifact(input.artifact);
  const offer = await assertValidTransferOffer(artifact.payload);
  const verification = await verifySealProofAgainstBytes(
    artifact.proof,
    utf8.encode(stringifyCanonical(offer)),
  );
  const errors = createVerificationErrors(verification);
  return {
    ok: verification.valid,
    hashMatch: verification.hashMatch,
    signatureValid: verification.signatureValid,
    keyId: verification.keyId,
    errors,
  };
}

export async function signTransferAcceptance(input: {
  identity: SerializedIdentity;
  acceptance: PixpaxTransferAcceptance;
  subjectPath?: string;
  createdAt?: string;
}): Promise<PixpaxSignedArtifact<PixpaxTransferAcceptance>> {
  const acceptance = await assertValidTransferAcceptance(input.acceptance);
  const proof = await createProofForPayload({
    identity: input.identity,
    payload: acceptance,
    subjectPath:
      input.subjectPath ||
      `pixpax/transfers/${acceptance.collectionId}/${acceptance.collectionVersion}/${acceptance.transferId}/acceptance.json`,
    createdAt: input.createdAt,
  });
  return {
    payload: acceptance,
    proof,
  };
}

export async function verifyTransferAcceptanceProof(input: {
  artifact: PixpaxSignedArtifact<PixpaxTransferAcceptance>;
}): Promise<{
  ok: boolean;
  hashMatch: boolean;
  signatureValid: boolean;
  keyId: string;
  errors: string[];
}> {
  const artifact = await assertValidSignedArtifact(input.artifact);
  const acceptance = await assertValidTransferAcceptance(artifact.payload);
  const verification = await verifySealProofAgainstBytes(
    artifact.proof,
    utf8.encode(stringifyCanonical(acceptance)),
  );
  const errors = createVerificationErrors(verification);
  return {
    ok: verification.valid,
    hashMatch: verification.hashMatch,
    signatureValid: verification.signatureValid,
    keyId: verification.keyId,
    errors,
  };
}

export async function issueAndSignDeterministicPack(input: {
  identity: SerializedIdentity;
  claimant: Parameters<typeof createDeterministicPackIssuance>[0]["claimant"];
  scope: Parameters<typeof createDeterministicPackIssuance>[0]["scope"];
  drop: Parameters<typeof createDeterministicPackIssuance>[0]["drop"];
  availableCards: Parameters<typeof createDeterministicPackIssuance>[0]["availableCards"];
  count: number;
  issuedAt: string;
  issuerKeyId?: string | null;
  subjectPath?: string;
}) {
  const issuance = await createDeterministicPackIssuance({
    claimant: input.claimant,
    scope: input.scope,
    drop: input.drop,
    availableCards: input.availableCards,
    count: input.count,
    issuedAt: input.issuedAt,
    issuerKeyId: input.issuerKeyId,
  });
  return await signPackIssuance({
    identity: input.identity,
    issuance,
    subjectPath: input.subjectPath,
    createdAt: input.issuedAt,
  });
}
