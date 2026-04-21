import type {
  PasskeyRegistration,
  RegisterOptions,
} from "./types.js";
import { randomBytes, toArrayBuffer, toUint8Array } from "./utils/bytes.js";
import { bytesToBase64Url } from "./utils/base64url.js";
import {
  assertSupported,
  ensureRegistrationCredential,
  normalizeCreateError,
  resolveOrigin,
  resolveRpId,
} from "./utils/webauthn.js";

function requireSubtle(): SubtleCrypto {
  if (typeof globalThis.crypto?.subtle !== "object") {
    throw new Error("Web Crypto API is required for passkey registration.");
  }
  return globalThis.crypto.subtle;
}

async function exportCredentialPublicKeyJwk(spki: ArrayBuffer): Promise<JsonWebKey> {
  const imported = await requireSubtle().importKey(
    "spki",
    spki,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["verify"],
  );
  return (await requireSubtle().exportKey("jwk", imported)) as JsonWebKey;
}

export async function register(options: RegisterOptions): Promise<PasskeyRegistration> {
  try {
    assertSupported();
    const rpId = resolveRpId(options.rpId);
    const userVerification = options.userVerification ?? "required";
    const challenge = options.challenge ? toUint8Array(options.challenge) : randomBytes(32);

    const authenticatorSelection: AuthenticatorSelectionCriteria = {
      userVerification,
      residentKey: options.discoverable ?? "preferred",
    };

    if (options.attachment) {
      authenticatorSelection.authenticatorAttachment = options.attachment;
    }

    const credential = ensureRegistrationCredential(
      await globalThis.navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            id: rpId,
            name: options.rpName,
          },
          user: {
            id: toUint8Array(options.user.id),
            name: options.user.name,
            displayName: options.user.displayName,
          },
          pubKeyCredParams: [
            {
              type: "public-key",
              alg: -7,
            },
          ],
          timeout: options.timeoutMs,
          attestation: options.attestation ?? "none",
          authenticatorSelection,
        },
      }),
    );

    const response = credential.response as AuthenticatorAttestationResponse;
    const registrationPublicKey =
      typeof response.getPublicKey === "function" ? response.getPublicKey() : null;
    if (!registrationPublicKey) {
      throw new Error(
        "Passkey registration did not expose a credential public key. getPublicKey() support is required.",
      );
    }
    const credentialPublicKeySpki = toArrayBuffer(registrationPublicKey);
    const credentialPublicKeyJwk = await exportCredentialPublicKeyJwk(
      credentialPublicKeySpki,
    );
    const transports =
      typeof response.getTransports === "function"
        ? (response.getTransports() as AuthenticatorTransport[])
        : undefined;

    return {
      credentialId: toArrayBuffer(credential.rawId),
      credentialIdBase64Url: bytesToBase64Url(credential.rawId),
      credentialPublicKeySpki,
      credentialPublicKeyJwk,
      raw: credential,
      response: {
        clientDataJSON: toArrayBuffer(response.clientDataJSON),
        attestationObject: toArrayBuffer(response.attestationObject),
        transports,
      },
      metadata: {
        rpId,
        origin: resolveOrigin(),
        userVerification,
        createdAt: new Date().toISOString(),
        label: options.label,
      },
    };
  } catch (error) {
    throw normalizeCreateError(error);
  }
}
