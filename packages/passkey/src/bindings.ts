import { approve } from "./approve.js";
import { buildChallenge, shaDigest } from "./challenge.js";
import { deriveUnlockKey } from "./derive.js";
import { register } from "./register.js";
import { validateApprovalContext } from "./verify.js";
import type {
  ApproveActionOptions,
  PasskeyApproval,
  PasskeyBinding,
  RegisterForIdentityOptions,
  UnlockIdentityKeyOptions,
} from "./types.js";
import { base64UrlToBytes, bytesToBase64Url } from "./utils/base64url.js";
import { toUint8Array } from "./utils/bytes.js";

async function identityIdToUserId(identityId: string): Promise<Uint8Array> {
  return await shaDigest(new TextEncoder().encode(identityId), "SHA-256");
}

export async function registerForIdentity(options: RegisterForIdentityOptions): Promise<{
  binding: PasskeyBinding;
  registration: Awaited<ReturnType<typeof register>>;
}> {
  const role = options.role ?? "unlock";
  const userName = options.userName ?? options.identityId;
  const userDisplayName = options.userDisplayName ?? options.identityId;
  const userId = await identityIdToUserId(options.identityId);

  const registration = await register({
    rpName: options.rpName,
    rpId: options.rpId,
    label: options.label,
    user: {
      id: userId,
      name: userName,
      displayName: userDisplayName,
    },
    userVerification: "required",
    attestation: "none",
  });

  const binding: PasskeyBinding = {
    version: 1,
    type: "webauthn-passkey",
    label: options.label,
    credentialId: registration.credentialIdBase64Url,
    credentialPublicKeyJwk: registration.credentialPublicKeyJwk,
    rpId: registration.metadata.rpId,
    origin: registration.metadata.origin,
    createdAt: registration.metadata.createdAt,
    role,
    userVerification: registration.metadata.userVerification,
  };

  return {
    binding,
    registration,
  };
}

export async function approveAction(options: ApproveActionOptions): Promise<PasskeyApproval> {
  const challenge = await buildChallenge({
    type: options.action,
    payload: options.payload,
  });

  const allowCredentials = options.allowCredentialIds?.map((credentialId) => ({
    id: base64UrlToBytes(credentialId),
    type: "public-key" as const,
  }));

  return await approve({
    challenge,
    rpId: options.rpId,
    allowCredentials,
    userVerification: options.userVerification ?? "required",
  });
}

export async function unlockIdentityKey(options: UnlockIdentityKeyOptions): Promise<CryptoKey> {
  const encryptedIdentityHash = bytesToBase64Url(
    await shaDigest(toUint8Array(options.encryptedIdentity), "SHA-256"),
  );
  const ivHash = bytesToBase64Url(await shaDigest(toUint8Array(options.iv), "SHA-256"));

  const challenge = await buildChallenge({
    type: "concord.identity.unlock",
    payload: {
      credentialId: options.binding.credentialId,
      encryptedIdentityHash,
      ivHash,
      context: options.challengeContext ?? null,
    },
  });

  const approval = await approve({
    challenge,
    rpId: options.binding.rpId,
    allowCredentials: [
      {
        id: base64UrlToBytes(options.binding.credentialId),
        type: "public-key",
      },
    ],
    userVerification: options.binding.userVerification,
  });
  const verified = await validateApprovalContext(approval, {
    challenge,
    expectedOrigin: options.binding.origin,
    expectedRpId: options.binding.rpId,
    requireUserPresence: true,
    requireUserVerification: options.binding.userVerification === "required",
    credentialPublicKey: options.binding.credentialPublicKeyJwk,
    credentialPublicKeyFormat: "jwk",
    requireSignatureVerification: true,
  });
  if (!verified.ok) {
    throw new Error(`Passkey unlock approval validation failed: ${verified.reasons.join(" ")}`);
  }

  return await deriveUnlockKey(approval, {
    algorithm: "AES-GCM",
    usage: ["decrypt", "encrypt"],
  });
}
