import {
  decryptWithIdentity,
  encryptForRecipients,
  initArmour,
} from "@ternent/armour";
import { deriveAgeRecipient, type SerializedIdentity } from "@ternent/identity";

let initPromise: Promise<void> | null = null;

export type LegacyProtectedTaskPayloadEnvelope = {
  format: "ternent-task-protected-payload";
  version: "1";
  permissionId: string;
  ciphertext: string;
  keyEncoding: "armor";
};

export type CurrentProtectedTaskPayloadEnvelope = {
  format: "ternent-task-protected-payload";
  version: "2";
  permissionId: string;
  ciphertext: string;
  iv: string;
  algorithm: "aes-gcm-256";
};

export type ProtectedTaskPayloadEnvelope =
  | LegacyProtectedTaskPayloadEnvelope
  | CurrentProtectedTaskPayloadEnvelope;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let base64: string;

  if (typeof Buffer !== "undefined") {
    base64 = Buffer.from(bytes).toString("base64");
  } else {
    let binary = "";
    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index] ?? 0);
    }
    base64 = btoa(binary);
  }

  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(paddingLength);

  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(padded, "base64"));
  }

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toUtf8Bytes(value: string): Uint8Array {
  return Uint8Array.from(textEncoder.encode(value));
}

function decodeUtf8(value: Uint8Array): string {
  return textDecoder.decode(value);
}

function getWebCrypto(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("WebCrypto SubtleCrypto is required for protected task payloads.");
  }
  return subtle;
}

async function importTaskPayloadKey(
  permissionKey: string,
): Promise<CryptoKey> {
  return await getWebCrypto().importKey(
    "raw",
    base64UrlDecode(permissionKey),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function ensureArmourDirect() {
  if (!initPromise) {
    initPromise = initArmour();
  }

  await initPromise;
}

export function createTaskPermissionKey(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export async function wrapPermissionKeyForRecipientDirect(input: {
  permissionKey: string;
  recipient: string;
}): Promise<string> {
  await ensureArmourDirect();
  const ciphertext = await encryptForRecipients({
    recipients: [input.recipient],
    data: toUtf8Bytes(input.permissionKey),
    output: "armor",
  });
  return decodeUtf8(ciphertext);
}

export async function wrapPermissionKeyForIdentityDirect(input: {
  permissionKey: string;
  identity: SerializedIdentity;
}): Promise<string> {
  return await wrapPermissionKeyForRecipientDirect({
    permissionKey: input.permissionKey,
    recipient: await deriveAgeRecipient(input.identity),
  });
}

export async function unwrapPermissionKeyDirect(input: {
  wrappedPermissionKey: string;
  identity: SerializedIdentity;
}): Promise<string> {
  await ensureArmourDirect();
  const plaintext = await decryptWithIdentity({
    identity: input.identity,
    data: toUtf8Bytes(input.wrappedPermissionKey),
  });
  return decodeUtf8(plaintext);
}

export async function encryptProtectedTaskPayloadDirect(input: {
  permissionId: string;
  permissionKey: string;
  payload: unknown;
}): Promise<CurrentProtectedTaskPayloadEnvelope> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await importTaskPayloadKey(input.permissionKey);
  const ciphertext = await getWebCrypto().encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    toUtf8Bytes(JSON.stringify(input.payload)),
  );

  return {
    format: "ternent-task-protected-payload",
    version: "2",
    permissionId: input.permissionId,
    ciphertext: base64UrlEncode(new Uint8Array(ciphertext)),
    iv: base64UrlEncode(iv),
    algorithm: "aes-gcm-256",
  };
}

export async function decryptProtectedTaskPayloadDirect(input: {
  permissionKey: string;
  envelope: ProtectedTaskPayloadEnvelope;
}): Promise<unknown> {
  if (input.envelope.version !== "2") {
    throw new Error(
      "Legacy protected task payloads are unsupported. Recreate protected tasks with the current task crypto format.",
    );
  }

  const key = await importTaskPayloadKey(input.permissionKey);
  const plaintext = await getWebCrypto().decrypt(
    {
      name: "AES-GCM",
      iv: base64UrlDecode(input.envelope.iv),
    },
    key,
    base64UrlDecode(input.envelope.ciphertext),
  );

  return JSON.parse(
    decodeUtf8(new Uint8Array(plaintext)),
  ) as unknown;
}

export function isProtectedTaskPayloadEnvelope(
  value: unknown,
): value is ProtectedTaskPayloadEnvelope {
  return Boolean(value)
    && typeof value === "object"
    && (value as { format?: unknown }).format === "ternent-task-protected-payload"
    && (
      (value as { version?: unknown }).version === "1"
      || (value as { version?: unknown }).version === "2"
    )
    && typeof (value as { permissionId?: unknown }).permissionId === "string"
    && typeof (value as { ciphertext?: unknown }).ciphertext === "string"
    && (
      (
        (value as { version?: unknown }).version === "1"
        && (value as { keyEncoding?: unknown }).keyEncoding === "armor"
      )
      || (
        (value as { version?: unknown }).version === "2"
        && typeof (value as { iv?: unknown }).iv === "string"
        && (value as { algorithm?: unknown }).algorithm === "aes-gcm-256"
      )
    );
}
