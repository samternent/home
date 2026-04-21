import {
  approve as approvePasskey,
  buildChallenge as buildPasskeyChallenge,
  validateApprovalContext as validatePasskeyApprovalContext,
} from "@ternent/passkey";
import type {
  CreateSolidWebAuthnIdentityUnlockerOptions,
  SolidIdentityUnlockContext,
  SolidIdentityUnlocker,
  SolidPasskeyBinding,
} from "./types.js";
import {
  assertPassphrase,
  base64UrlToBytes,
  concatBytes,
  isRecord,
  resolveExpectedOrigin,
  resolveRpId,
  sha256Base64Url,
  SOLID_UNLOCKER_NAMESPACE,
} from "./identity-shared.js";

async function derivePasskeyPrfPassphrase(input: {
  rpId: string;
  salt: string;
  prfOutput: ArrayBuffer;
}): Promise<string> {
  return await sha256Base64Url(
    concatBytes(
      new TextEncoder().encode(SOLID_UNLOCKER_NAMESPACE),
      new TextEncoder().encode("|"),
      new TextEncoder().encode(input.rpId),
      new TextEncoder().encode("|"),
      new TextEncoder().encode(input.salt),
      new TextEncoder().encode("|"),
      new Uint8Array(input.prfOutput),
    ),
  );
}

export function isSolidPasskeyBinding(value: unknown): value is SolidPasskeyBinding {
  return (
    isRecord(value) &&
    value.version === 1 &&
    value.type === "webauthn-passkey" &&
    typeof value.credentialId === "string" &&
    isRecord(value.credentialPublicKeyJwk) &&
    typeof value.credentialPublicKeyJwk.kty === "string" &&
    typeof value.rpId === "string" &&
    typeof value.origin === "string" &&
    typeof value.createdAt === "string" &&
    (value.label === undefined || typeof value.label === "string") &&
    (value.role === "unlock" || value.role === "approval" || value.role === "unlock-and-approval") &&
    (value.userVerification === "required" ||
      value.userVerification === "preferred" ||
      value.userVerification === "discouraged")
  );
}

export function normalizePasskeyBinding(
  input: SolidPasskeyBinding | null | undefined,
): SolidPasskeyBinding | null {
  if (input === null || input === undefined) {
    return null;
  }

  if (!isSolidPasskeyBinding(input)) {
    throw new Error("Solid encrypted identity passkey binding must be a webauthn-passkey v1 object.");
  }

  return {
    version: 1,
    type: "webauthn-passkey",
    label: input.label,
    credentialId: input.credentialId,
    credentialPublicKeyJwk: input.credentialPublicKeyJwk,
    rpId: input.rpId,
    origin: input.origin,
    createdAt: input.createdAt,
    role: input.role,
    userVerification: input.userVerification,
  };
}

export function createStaticSolidIdentityUnlocker(
  passphrase: string,
  mechanism = "unsafe-static-passphrase",
): SolidIdentityUnlocker {
  const normalized = assertPassphrase(passphrase);
  return {
    mechanism,
    async unlock(_context: SolidIdentityUnlockContext) {
      return normalized;
    },
  };
}

export function createSolidWebAuthnIdentityUnlocker(
  options: CreateSolidWebAuthnIdentityUnlockerOptions = {},
): SolidIdentityUnlocker {
  const rpId = resolveRpId(options.rpId);
  const userVerification = options.userVerification ?? "required";
  const configuredCredentialPublicKeyJwk = options.credentialPublicKeyJwk;
  const timeout = Number.isFinite(options.timeoutMs)
    ? Math.max(1, Number(options.timeoutMs))
    : 60_000;
  const expectedCredentialId = String(options.credentialId || "").trim() || null;
  if (expectedCredentialId && !configuredCredentialPublicKeyJwk) {
    throw new Error(
      "createSolidWebAuthnIdentityUnlocker requires credentialPublicKeyJwk when credentialId is provided.",
    );
  }
  const role = options.role ?? "unlock";
  const expectedOrigin = resolveExpectedOrigin();
  let binding: SolidPasskeyBinding | undefined =
    expectedCredentialId === null
      ? undefined
      : {
          version: 1,
          type: "webauthn-passkey",
          label: options.label,
          credentialId: expectedCredentialId,
          credentialPublicKeyJwk: configuredCredentialPublicKeyJwk as JsonWebKey,
          rpId,
          origin: expectedOrigin ?? "",
          createdAt: new Date().toISOString(),
          role,
          userVerification,
        };

  return {
    mechanism: "webauthn-passkey",
    get binding() {
      return binding;
    },
    async unlock(context: SolidIdentityUnlockContext): Promise<string> {
      try {
        const boundCredentialId =
          context.passkeyBinding &&
          String(context.passkeyBinding.credentialId || "").trim();
        const expectedCredential =
          expectedCredentialId ?? (boundCredentialId ? boundCredentialId : null);

        const allowCredentials = expectedCredential
          ? [
              {
                id: base64UrlToBytes(expectedCredential),
                type: "public-key" as const,
              },
            ]
          : undefined;

        const challenge = await buildPasskeyChallenge({
        type: "concord.identity.unlock",
        payload: {
          namespace: SOLID_UNLOCKER_NAMESPACE,
          reason: context.reason,
          webId: context.webId,
          keyId: context.keyId,
          storage: context.storage,
          cacheKey: context.cacheKey ?? null,
          resourceUrl: context.resourceUrl ?? null,
          expectedCredential,
          passkeyDerivationSalt: context.passkeyDerivationSalt ?? null,
        },
      });

        const approval = await approvePasskey({
        challenge,
        rpId,
        allowCredentials,
        timeoutMs: timeout,
        userVerification,
        prf: context.passkeyDerivationSalt
          ? {
              salt: base64UrlToBytes(context.passkeyDerivationSalt),
            }
          : undefined,
      });

        const verification = await validatePasskeyApprovalContext(approval, {
        challenge,
        expectedOrigin,
        expectedRpId: rpId,
        requireUserPresence: true,
        requireUserVerification: userVerification === "required",
        credentialPublicKey:
          context.passkeyBinding?.credentialPublicKeyJwk ??
          binding?.credentialPublicKeyJwk ??
          configuredCredentialPublicKeyJwk,
        credentialPublicKeyFormat: "jwk",
        requireSignatureVerification: true,
      });
        if (!verification.ok) {
          throw new Error(
            `Passkey unlock verification failed: ${verification.reasons.join(" ")}`,
          );
        }
        if (!verification.signatureVerified) {
          throw new Error("Passkey unlock requires cryptographic signature verification.");
        }

        const derivedCredentialId = approval.credentialIdBase64Url;
        if (expectedCredential && derivedCredentialId !== expectedCredential) {
          throw new Error(
            `Passkey unlock returned credential ${derivedCredentialId}, expected ${expectedCredential}.`,
          );
        }

        if (!binding) {
        const credentialPublicKeyJwk =
          context.passkeyBinding?.credentialPublicKeyJwk ??
          configuredCredentialPublicKeyJwk;
        if (!credentialPublicKeyJwk) {
          throw new Error(
            "Passkey unlock requires a registered credential public key (JWK).",
          );
        }
        binding = {
          version: 1,
          type: "webauthn-passkey",
          label: options.label,
          credentialId: derivedCredentialId,
          credentialPublicKeyJwk,
          rpId,
          origin: approval.metadata.origin,
          createdAt: approval.metadata.approvedAt,
          role,
          userVerification,
        };
      }

        if (!context.passkeyDerivationSalt) {
          throw new Error(
            "Encrypted identity is missing passkey PRF derivation metadata.",
          );
        }
        if (!approval.secrets.prfOutput) {
          throw new Error(
            "Passkey unlock requires WebAuthn PRF extension output, but this authenticator/runtime did not provide it.",
          );
        }

        const passphrase = await derivePasskeyPrfPassphrase({
          rpId,
          salt: context.passkeyDerivationSalt,
          prfOutput: approval.secrets.prfOutput,
        });

        return assertPassphrase(passphrase);
      } catch (error) {
        if (typeof console !== "undefined" && typeof console.warn === "function") {
          console.warn(
            `[ternent/solid] Passkey unlock failed (${context.reason}, ${context.storage}): ${String(error)}`,
          );
        }
        throw error;
      }
    },
  };
}

export function createDefaultSolidIdentityUnlocker(): SolidIdentityUnlocker {
  return createSolidWebAuthnIdentityUnlocker();
}

export function resolveSolidIdentityUnlocker(
  unlocker?: SolidIdentityUnlocker,
): SolidIdentityUnlocker {
  if (unlocker) {
    return unlocker;
  }

  if (typeof globalThis.navigator?.credentials?.get === "function") {
    return createDefaultSolidIdentityUnlocker();
  }

  throw new Error(
    "Solid encrypted identity persistence requires a passkey unlocker. Provide input.unlocker or use a browser WebAuthn runtime.",
  );
}
