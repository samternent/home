import type {
  ApproveOptions,
  PasskeyApproval,
} from "./types.js";
import { buildChallenge, shaDigest } from "./challenge.js";
import { bytesToBase64Url } from "./utils/base64url.js";
import { toArrayBuffer, toUint8Array } from "./utils/bytes.js";
import {
  assertSupported,
  ensureApprovalCredential,
  normalizeGetError,
  resolveOrigin,
  resolveRpId,
} from "./utils/webauthn.js";

export async function approve(options: ApproveOptions): Promise<PasskeyApproval> {
  try {
    assertSupported();
    const rpId = resolveRpId(options.rpId);
    const userVerification = options.userVerification ?? "required";
    const challenge = toUint8Array(await buildChallenge(options.challenge));
    const challengeHash = await shaDigest(challenge, "SHA-256");

    const allowCredentials = options.allowCredentials?.map((entry) => ({
      id: toUint8Array(entry.id),
      type: entry.type ?? "public-key",
    }));
    const extensions = options.prf
      ? ({
          prf: {
            eval: {
              first: toUint8Array(options.prf.salt),
            },
          },
        } as AuthenticationExtensionsClientInputs)
      : undefined;

    const credential = ensureApprovalCredential(
      await globalThis.navigator.credentials.get({
        publicKey: {
          challenge,
          rpId,
          timeout: options.timeoutMs,
          userVerification,
          allowCredentials,
          extensions,
        },
      }),
    );

    const response = credential.response as AuthenticatorAssertionResponse;
    const extensionResults =
      typeof credential.getClientExtensionResults === "function"
        ? credential.getClientExtensionResults()
        : undefined;
    const prfOutput =
      extensionResults &&
      "prf" in extensionResults &&
      extensionResults.prf &&
      typeof extensionResults.prf === "object" &&
      "results" in extensionResults.prf &&
      extensionResults.prf.results &&
      typeof extensionResults.prf.results === "object" &&
      "first" in extensionResults.prf.results &&
      extensionResults.prf.results.first instanceof ArrayBuffer
        ? toArrayBuffer(extensionResults.prf.results.first)
        : null;

    return {
      credentialId: toArrayBuffer(credential.rawId),
      credentialIdBase64Url: bytesToBase64Url(credential.rawId),
      raw: credential,
      response: {
        clientDataJSON: toArrayBuffer(response.clientDataJSON),
        authenticatorData: toArrayBuffer(response.authenticatorData),
        signature: toArrayBuffer(response.signature),
        userHandle: response.userHandle ? toArrayBuffer(response.userHandle) : null,
      },
      metadata: {
        rpId,
        origin: resolveOrigin(),
        approvedAt: new Date().toISOString(),
        challengeHashBase64Url: bytesToBase64Url(challengeHash),
      },
      secrets: {
        prfOutput,
      },
    };
  } catch (error) {
    throw normalizeGetError(error);
  }
}
