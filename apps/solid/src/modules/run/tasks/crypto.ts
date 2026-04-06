import { deriveAgeRecipient, type SerializedIdentity } from "@ternent/identity";
import {
  createTaskPermissionKey,
  decryptProtectedTaskPayloadDirect,
  ensureArmourDirect,
  encryptProtectedTaskPayloadDirect,
  isProtectedTaskPayloadEnvelope,
  type ProtectedTaskPayloadEnvelope,
  unwrapPermissionKeyDirect,
  wrapPermissionKeyForRecipientDirect,
} from "./crypto.direct";

export {
  createTaskPermissionKey,
  isProtectedTaskPayloadEnvelope,
};
export type { ProtectedTaskPayloadEnvelope };

export async function wrapPermissionKeyForRecipient(input: {
  permissionKey: string;
  recipient: string;
}): Promise<string> {
  return await wrapPermissionKeyForRecipientDirect(input);
}

export async function wrapPermissionKeyForIdentity(input: {
  permissionKey: string;
  identity: SerializedIdentity;
}): Promise<string> {
  return await wrapPermissionKeyForRecipient({
    permissionKey: input.permissionKey,
    recipient: await deriveAgeRecipient(input.identity),
  });
}

export async function unwrapPermissionKey(input: {
  wrappedPermissionKey: string;
  identity: SerializedIdentity;
}): Promise<string> {
  return await unwrapPermissionKeyDirect(input);
}

export async function encryptProtectedTaskPayload(input: {
  permissionId: string;
  permissionKey: string;
  payload: unknown;
}): Promise<ProtectedTaskPayloadEnvelope> {
  return await encryptProtectedTaskPayloadDirect(input);
}

export async function decryptProtectedTaskPayload(input: {
  permissionKey: string;
  envelope: ProtectedTaskPayloadEnvelope;
}): Promise<unknown> {
  return await decryptProtectedTaskPayloadDirect(input);
}

export async function warmTaskCrypto(): Promise<void> {
  await ensureArmourDirect();
}
