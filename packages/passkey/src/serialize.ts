import {
  PasskeySerializationError,
} from "./errors.js";
import type {
  PasskeyApproval,
  PasskeyApprovalRecord,
  PasskeyRegistration,
  PasskeyRegistrationRecord,
  SerializedPasskeyApproval,
  SerializedPasskeyRegistration,
} from "./types.js";
import { base64UrlToBytes, bytesToBase64Url } from "./utils/base64url.js";
import { toArrayBuffer } from "./utils/bytes.js";

function assertVersionOne(value: unknown): void {
  if (value !== 1) {
    throw new PasskeySerializationError("Unsupported passkey serialization version.");
  }
}

export function serializeRegistration(
  registration: PasskeyRegistration,
): SerializedPasskeyRegistration {
  return {
    version: 1,
    credentialId: registration.credentialIdBase64Url,
    credentialPublicKeySpki: bytesToBase64Url(registration.credentialPublicKeySpki),
    credentialPublicKeyJwk: registration.credentialPublicKeyJwk,
    clientDataJSON: bytesToBase64Url(registration.response.clientDataJSON),
    attestationObject: bytesToBase64Url(registration.response.attestationObject),
    rpId: registration.metadata.rpId,
    origin: registration.metadata.origin,
    createdAt: registration.metadata.createdAt,
    label: registration.metadata.label,
    userVerification: registration.metadata.userVerification,
  };
}

export function serializeApproval(
  approval: PasskeyApproval,
): SerializedPasskeyApproval {
  return {
    version: 1,
    credentialId: approval.credentialIdBase64Url,
    clientDataJSON: bytesToBase64Url(approval.response.clientDataJSON),
    authenticatorData: bytesToBase64Url(approval.response.authenticatorData),
    signature: bytesToBase64Url(approval.response.signature),
    userHandle: approval.response.userHandle
      ? bytesToBase64Url(approval.response.userHandle)
      : approval.response.userHandle,
    rpId: approval.metadata.rpId,
    origin: approval.metadata.origin,
    approvedAt: approval.metadata.approvedAt,
    challengeHash: approval.metadata.challengeHashBase64Url,
  };
}

export function deserializeRegistration(
  input: SerializedPasskeyRegistration,
): PasskeyRegistrationRecord {
  try {
    assertVersionOne(input.version);

    const credentialId = base64UrlToBytes(input.credentialId);
    return {
      credentialId: toArrayBuffer(credentialId),
      credentialIdBase64Url: input.credentialId,
      credentialPublicKeySpki: toArrayBuffer(base64UrlToBytes(input.credentialPublicKeySpki)),
      credentialPublicKeyJwk: input.credentialPublicKeyJwk,
      response: {
        clientDataJSON: toArrayBuffer(base64UrlToBytes(input.clientDataJSON)),
        attestationObject: toArrayBuffer(base64UrlToBytes(input.attestationObject)),
      },
      metadata: {
        rpId: input.rpId,
        origin: input.origin,
        createdAt: input.createdAt,
        label: input.label,
        userVerification: input.userVerification,
      },
    };
  } catch (error) {
    if (error instanceof PasskeySerializationError) {
      throw error;
    }

    throw new PasskeySerializationError(String(error));
  }
}

export function deserializeApproval(
  input: SerializedPasskeyApproval,
): PasskeyApprovalRecord {
  try {
    assertVersionOne(input.version);

    const credentialId = base64UrlToBytes(input.credentialId);
    return {
      credentialId: toArrayBuffer(credentialId),
      credentialIdBase64Url: input.credentialId,
      response: {
        clientDataJSON: toArrayBuffer(base64UrlToBytes(input.clientDataJSON)),
        authenticatorData: toArrayBuffer(base64UrlToBytes(input.authenticatorData)),
        signature: toArrayBuffer(base64UrlToBytes(input.signature)),
        userHandle:
          input.userHandle === undefined || input.userHandle === null
            ? null
            : toArrayBuffer(base64UrlToBytes(input.userHandle)),
      },
      metadata: {
        rpId: input.rpId,
        origin: input.origin,
        approvedAt: input.approvedAt,
        challengeHashBase64Url: input.challengeHash,
      },
    };
  } catch (error) {
    if (error instanceof PasskeySerializationError) {
      throw error;
    }

    throw new PasskeySerializationError(String(error));
  }
}
