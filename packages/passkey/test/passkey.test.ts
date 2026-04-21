import { afterEach, describe, expect, it, vi } from "vitest";
import {
  approve,
  approveAction,
  buildChallenge,
  deriveEphemeralApprovalKey,
  deriveUnlockKey,
  deserializeApproval,
  deserializeRegistration,
  isSupported,
  register,
  registerForIdentity,
  requireSupport,
  serializeApproval,
  serializeRegistration,
  unlockIdentityKey,
  validateApprovalContext,
  verifyApproval,
  type PasskeyApproval,
  type PasskeyRegistration,
} from "../src/index.js";
import { bytesToBase64Url } from "../src/utils/base64url.js";
import { concatBytes } from "../src/utils/bytes.js";

class MockAuthenticatorAttestationResponse {
  clientDataJSON: ArrayBuffer;
  attestationObject: ArrayBuffer;
  credentialPublicKey: ArrayBuffer | null;

  constructor(
    clientDataJSON: ArrayBuffer,
    attestationObject: ArrayBuffer,
    credentialPublicKey: ArrayBuffer | null,
  ) {
    this.clientDataJSON = clientDataJSON;
    this.attestationObject = attestationObject;
    this.credentialPublicKey = credentialPublicKey;
  }

  getTransports() {
    return ["internal"];
  }

  getPublicKey() {
    return this.credentialPublicKey;
  }
}

class MockAuthenticatorAssertionResponse {
  clientDataJSON: ArrayBuffer;
  authenticatorData: ArrayBuffer;
  signature: ArrayBuffer;
  userHandle: ArrayBuffer | null;

  constructor(input: {
    clientDataJSON: ArrayBuffer;
    authenticatorData: ArrayBuffer;
    signature: ArrayBuffer;
    userHandle?: ArrayBuffer | null;
  }) {
    this.clientDataJSON = input.clientDataJSON;
    this.authenticatorData = input.authenticatorData;
    this.signature = input.signature;
    this.userHandle = input.userHandle ?? null;
  }
}

class MockPublicKeyCredential {
  rawId: ArrayBuffer;
  response: MockAuthenticatorAttestationResponse | MockAuthenticatorAssertionResponse;
  private extensionResults: AuthenticationExtensionsClientOutputs;

  constructor(
    rawId: ArrayBuffer,
    response: MockAuthenticatorAttestationResponse | MockAuthenticatorAssertionResponse,
    extensionResults: AuthenticationExtensionsClientOutputs = {},
  ) {
    this.rawId = rawId;
    this.response = response;
    this.extensionResults = extensionResults;
  }

  getClientExtensionResults() {
    return this.extensionResults;
  }
}

function toArrayBuffer(input: Uint8Array): ArrayBuffer {
  return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
}

async function rpIdHash(rpId: string): Promise<Uint8Array> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(rpId),
  );
  return new Uint8Array(digest);
}

async function generateRegistrationPublicKey(): Promise<{
  spki: ArrayBuffer;
  jwk: JsonWebKey;
  privateKey: CryptoKey;
}> {
  const keyPair = await globalThis.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"],
  );
  const spki = await globalThis.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const jwk = (await globalThis.crypto.subtle.exportKey("jwk", keyPair.publicKey)) as JsonWebKey;
  return {
    spki,
    jwk,
    privateKey: keyPair.privateKey,
  };
}

function stubWebAuthnEnvironment(input: {
  createImpl?: (init: CredentialCreationOptions) => Promise<Credential | null>;
  getImpl?: (init: CredentialRequestOptions) => Promise<Credential | null>;
}) {
  vi.stubGlobal("window", {
    isSecureContext: true,
    location: {
      hostname: "app.example",
      origin: "https://app.example",
    },
  });
  vi.stubGlobal("PublicKeyCredential", MockPublicKeyCredential as unknown as typeof PublicKeyCredential);
  vi.stubGlobal(
    "AuthenticatorAttestationResponse",
    MockAuthenticatorAttestationResponse as unknown as typeof AuthenticatorAttestationResponse,
  );
  vi.stubGlobal(
    "AuthenticatorAssertionResponse",
    MockAuthenticatorAssertionResponse as unknown as typeof AuthenticatorAssertionResponse,
  );
  vi.stubGlobal("navigator", {
    credentials: {
      create: input.createImpl ?? vi.fn(async () => null),
      get: input.getImpl ?? vi.fn(async () => null),
    },
  });
}

function createApprovalFixture(input: {
  challenge: Uint8Array;
  rpId: string;
  origin: string;
  userPresent: boolean;
  userVerified: boolean;
}): Promise<PasskeyApproval> {
  return (async () => {
    const clientData = {
      type: "webauthn.get",
      challenge: bytesToBase64Url(input.challenge),
      origin: input.origin,
    };
    const clientDataJSON = new TextEncoder().encode(JSON.stringify(clientData));
    const flags =
      (input.userPresent ? 0x01 : 0) |
      (input.userVerified ? 0x04 : 0);
    const authData = concatBytes(
      await rpIdHash(input.rpId),
      new Uint8Array([flags, 0, 0, 0, 1]),
    );
    const signature = new Uint8Array([5, 6, 7, 8]);
    const challengeDigest = await globalThis.crypto.subtle.digest(
      "SHA-256",
      input.challenge,
    );

    return {
      credentialId: toArrayBuffer(new Uint8Array([1, 2, 3])),
      credentialIdBase64Url: bytesToBase64Url(new Uint8Array([1, 2, 3])),
      raw: {} as PublicKeyCredential,
      response: {
        clientDataJSON: toArrayBuffer(clientDataJSON),
        authenticatorData: toArrayBuffer(authData),
        signature: toArrayBuffer(signature),
        userHandle: null,
      },
      metadata: {
        rpId: input.rpId,
        origin: input.origin,
        approvedAt: "2026-01-01T00:00:00.000Z",
        challengeHashBase64Url: bytesToBase64Url(challengeDigest),
      },
      secrets: {
        prfOutput: null,
      },
    };
  })();
}

describe("@ternent/passkey", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds deterministic hashed challenges for objects", async () => {
    const a = await buildChallenge({ type: "x", payload: { b: 1, a: 2 } });
    const b = await buildChallenge({ type: "x", payload: { a: 2, b: 1 } });
    expect(bytesToBase64Url(new Uint8Array(a))).toBe(bytesToBase64Url(new Uint8Array(b)));
  });

  it("serializes and deserializes passkey approval and registration payloads", async () => {
    const keyMaterial = await generateRegistrationPublicKey();
    const registration: PasskeyRegistration = {
      credentialId: toArrayBuffer(new Uint8Array([1, 2, 3])),
      credentialIdBase64Url: bytesToBase64Url(new Uint8Array([1, 2, 3])),
      credentialPublicKeySpki: keyMaterial.spki,
      credentialPublicKeyJwk: keyMaterial.jwk,
      raw: {} as PublicKeyCredential,
      response: {
        clientDataJSON: toArrayBuffer(new Uint8Array([4, 5, 6])),
        attestationObject: toArrayBuffer(new Uint8Array([7, 8, 9])),
        transports: ["internal"],
      },
      metadata: {
        rpId: "app.example",
        origin: "https://app.example",
        userVerification: "required",
        createdAt: "2026-01-01T00:00:00.000Z",
        label: "MacBook",
      },
    };

    const approval = await createApprovalFixture({
      challenge: new TextEncoder().encode("demo"),
      rpId: "app.example",
      origin: "https://app.example",
      userPresent: true,
      userVerified: true,
    });

    const registrationRoundtrip = deserializeRegistration(serializeRegistration(registration));
    const approvalRoundtrip = deserializeApproval(serializeApproval(approval));

    expect(registrationRoundtrip.metadata.rpId).toBe("app.example");
    expect(registrationRoundtrip.credentialPublicKeyJwk.kty).toBe("EC");
    expect(approvalRoundtrip.metadata.rpId).toBe("app.example");
  });

  it("validates approval context against challenge/origin/rpId and flags", async () => {
    const challenge = new TextEncoder().encode("hello-world");
    const approval = await createApprovalFixture({
      challenge,
      rpId: "app.example",
      origin: "https://app.example",
      userPresent: true,
      userVerified: true,
    });

    const result = await validateApprovalContext(approval, {
      challenge,
      expectedOrigin: "https://app.example",
      expectedRpId: "app.example",
      requireUserPresence: true,
      requireUserVerification: true,
    });

    expect(result.ok).toBe(true);
    expect(result.signatureVerified).toBeNull();
    expect(result.flags.userPresent).toBe(true);
    expect(result.flags.userVerified).toBe(true);
  });

  it("reports verification failures when challenge mismatches", async () => {
    const approval = await createApprovalFixture({
      challenge: new TextEncoder().encode("expected"),
      rpId: "app.example",
      origin: "https://app.example",
      userPresent: true,
      userVerified: false,
    });

    const result = await verifyApproval(approval, {
      challenge: "different",
      expectedOrigin: "https://app.example",
      expectedRpId: "app.example",
      requireUserPresence: true,
      requireUserVerification: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("Challenge mismatch.");
    expect(result.reasons).toContain("User verification required but not present.");
  });

  it("verifies assertion signatures when a credential public key is provided", async () => {
    const keyPair = await globalThis.crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["sign", "verify"],
    );
    const challenge = new TextEncoder().encode("signed-challenge");
    const clientDataJSON = toArrayBuffer(
      new TextEncoder().encode(
        JSON.stringify({
          type: "webauthn.get",
          challenge: bytesToBase64Url(challenge),
          origin: "https://app.example",
        }),
      ),
    );
    const authenticatorData = toArrayBuffer(
      concatBytes(await rpIdHash("app.example"), new Uint8Array([0x05, 0, 0, 0, 1])),
    );
    const clientDataHash = await globalThis.crypto.subtle.digest("SHA-256", clientDataJSON);
    const signedPayload = concatBytes(authenticatorData, clientDataHash);
    const signature = await globalThis.crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: "SHA-256",
      },
      keyPair.privateKey,
      signedPayload,
    );
    const challengeDigest = await globalThis.crypto.subtle.digest("SHA-256", challenge);
    const approval: PasskeyApproval = {
      credentialId: toArrayBuffer(new Uint8Array([1, 2, 3])),
      credentialIdBase64Url: bytesToBase64Url(new Uint8Array([1, 2, 3])),
      raw: {} as PublicKeyCredential,
      response: {
        clientDataJSON,
        authenticatorData,
        signature: toArrayBuffer(new Uint8Array(signature)),
        userHandle: null,
      },
      metadata: {
        rpId: "app.example",
        origin: "https://app.example",
        approvedAt: "2026-01-01T00:00:00.000Z",
        challengeHashBase64Url: bytesToBase64Url(challengeDigest),
      },
      secrets: {
        prfOutput: null,
      },
    };

    const result = await verifyApproval(approval, {
      challenge,
      expectedOrigin: "https://app.example",
      expectedRpId: "app.example",
      requireUserPresence: true,
      requireUserVerification: true,
      credentialPublicKey: keyPair.publicKey,
      requireSignatureVerification: true,
    });

    expect(result.ok).toBe(true);
    expect(result.signatureVerified).toBe(true);
  });

  it("derives an AES-GCM unlock key from approval material", async () => {
    const approval = await createApprovalFixture({
      challenge: new TextEncoder().encode("unlock"),
      rpId: "app.example",
      origin: "https://app.example",
      userPresent: true,
      userVerified: true,
    });

    const key = await deriveEphemeralApprovalKey(approval);
    expect(key.type).toBe("secret");
    expect(key.algorithm).toMatchObject({ name: "AES-GCM" });
  });

  it("registers and approves with mocked browser WebAuthn APIs", async () => {
    const keyMaterial = await generateRegistrationPublicKey();
    const createSpy = vi.fn(async () => {
      const clientDataJSON = toArrayBuffer(new TextEncoder().encode("{}"));
      const attestationObject = toArrayBuffer(new Uint8Array([9, 9, 9]));
      return new MockPublicKeyCredential(
        toArrayBuffer(new Uint8Array([1, 2, 3, 4])),
        new MockAuthenticatorAttestationResponse(
          clientDataJSON,
          attestationObject,
          keyMaterial.spki,
        ),
      ) as unknown as Credential;
    });

    const getSpy = vi.fn(async (input: CredentialRequestOptions) => {
      const challenge = input.publicKey?.challenge as Uint8Array;
      const clientDataJSON = toArrayBuffer(
        new TextEncoder().encode(
          JSON.stringify({
            type: "webauthn.get",
            challenge: bytesToBase64Url(challenge),
            origin: "https://app.example",
          }),
        ),
      );
      const authData = concatBytes(await rpIdHash("app.example"), new Uint8Array([0x05, 0, 0, 0, 1]));
      const signature = toArrayBuffer(new Uint8Array([1, 1, 1]));

      return new MockPublicKeyCredential(
        toArrayBuffer(new Uint8Array([1, 2, 3, 4])),
        new MockAuthenticatorAssertionResponse({
          clientDataJSON,
          authenticatorData: toArrayBuffer(authData),
          signature,
          userHandle: null,
        }),
        {
          prf: {
            enabled: true,
            results: {
              first: toArrayBuffer(new Uint8Array([8, 8, 8, 8])),
            },
          },
        },
      ) as unknown as Credential;
    });

    stubWebAuthnEnvironment({
      createImpl: createSpy,
      getImpl: getSpy,
    });

    expect(isSupported()).toBe(true);
    expect(() => requireSupport()).not.toThrow();

    const registered = await register({
      rpName: "Concord",
      user: {
        id: new Uint8Array([1, 2, 3]),
        name: "sam",
        displayName: "Sam",
      },
    });
    expect(registered.metadata.rpId).toBe("app.example");
    expect(registered.credentialPublicKeyJwk.kty).toBe("EC");

    const approved = await approve({
      challenge: { type: "demo", payload: { ok: true } },
      rpId: "app.example",
      prf: {
        salt: new Uint8Array([3, 2, 1]),
      },
    });
    expect(approved.metadata.rpId).toBe("app.example");
    expect(approved.secrets.prfOutput).not.toBeNull();
  });

  it("provides identity and action helpers", async () => {
    const keyMaterial = await generateRegistrationPublicKey();
    const createSpy = vi.fn(async () => {
      const clientDataJSON = toArrayBuffer(new TextEncoder().encode("{}"));
      const attestationObject = toArrayBuffer(new Uint8Array([9, 9, 9]));
      return new MockPublicKeyCredential(
        toArrayBuffer(new Uint8Array([1, 2, 3, 4])),
        new MockAuthenticatorAttestationResponse(
          clientDataJSON,
          attestationObject,
          keyMaterial.spki,
        ),
      ) as unknown as Credential;
    });

    const getSpy = vi.fn(async (input: CredentialRequestOptions) => {
      const challenge = input.publicKey?.challenge as Uint8Array;
      const clientDataJSON = toArrayBuffer(
        new TextEncoder().encode(
          JSON.stringify({
            type: "webauthn.get",
            challenge: bytesToBase64Url(challenge),
            origin: "https://app.example",
          }),
        ),
      );
      const authData = concatBytes(await rpIdHash("app.example"), new Uint8Array([0x05, 0, 0, 0, 1]));
      const clientDataHash = await globalThis.crypto.subtle.digest("SHA-256", clientDataJSON);
      const payload = concatBytes(authData, clientDataHash);
      const signature = await globalThis.crypto.subtle.sign(
        {
          name: "ECDSA",
          hash: "SHA-256",
        },
        keyMaterial.privateKey,
        payload,
      );

      return new MockPublicKeyCredential(
        toArrayBuffer(new Uint8Array([1, 2, 3, 4])),
        new MockAuthenticatorAssertionResponse({
          clientDataJSON,
          authenticatorData: toArrayBuffer(authData),
          signature: toArrayBuffer(new Uint8Array(signature)),
          userHandle: null,
        }),
        {
          prf: {
            enabled: true,
            results: {
              first: toArrayBuffer(new Uint8Array([7, 7, 7, 7])),
            },
          },
        },
      ) as unknown as Credential;
    });

    stubWebAuthnEnvironment({
      createImpl: createSpy,
      getImpl: getSpy,
    });

    const { binding } = await registerForIdentity({
      identityId: "did:ternent:test",
      rpName: "Concord",
      role: "unlock-and-approval",
    });

    expect(binding.role).toBe("unlock-and-approval");
    expect(binding.credentialPublicKeyJwk.kty).toBe("EC");

    const approval = await approveAction({
      action: "concord.commit.approval",
      payload: {
        head: "abc",
      },
      allowCredentialIds: [binding.credentialId],
    });
    expect(approval.credentialIdBase64Url).toBe(binding.credentialId);

    const key = await unlockIdentityKey({
      encryptedIdentity: toArrayBuffer(new Uint8Array([10, 11, 12])),
      iv: new Uint8Array([13, 14, 15]),
      binding,
      challengeContext: {
        reason: "test",
      },
    });

    expect(key.type).toBe("secret");
  });
});
