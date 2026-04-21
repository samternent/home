export type BytesLike = Uint8Array | ArrayBuffer;

export interface RegisterOptions {
  rpName: string;
  rpId?: string;
  user: {
    id: Uint8Array | ArrayBuffer;
    name: string;
    displayName: string;
  };
  label?: string;
  timeoutMs?: number;
  userVerification?: "required" | "preferred" | "discouraged";
  attachment?: "platform" | "cross-platform";
  discoverable?: "required" | "preferred" | "discouraged";
  attestation?: "none" | "direct" | "enterprise";
  challenge?: Uint8Array | ArrayBuffer;
}

export interface PasskeyRegistration {
  credentialId: ArrayBuffer;
  credentialIdBase64Url: string;
  credentialPublicKeySpki: ArrayBuffer;
  credentialPublicKeyJwk: JsonWebKey;
  raw: PublicKeyCredential;
  response: {
    clientDataJSON: ArrayBuffer;
    attestationObject: ArrayBuffer;
    transports?: AuthenticatorTransport[];
  };
  metadata: {
    rpId: string;
    origin: string;
    userVerification: "required" | "preferred" | "discouraged";
    createdAt: string;
    label?: string;
  };
}

export interface ApproveOptions {
  challenge: Uint8Array | ArrayBuffer | string | object;
  rpId?: string;
  allowCredentials?: Array<{
    id: Uint8Array | ArrayBuffer;
    type?: "public-key";
  }>;
  timeoutMs?: number;
  userVerification?: "required" | "preferred" | "discouraged";
  prf?: {
    salt: Uint8Array | ArrayBuffer;
  };
}

export interface PasskeyApproval {
  credentialId: ArrayBuffer;
  credentialIdBase64Url: string;
  raw: PublicKeyCredential;
  response: {
    clientDataJSON: ArrayBuffer;
    authenticatorData: ArrayBuffer;
    signature: ArrayBuffer;
    userHandle: ArrayBuffer | null;
  };
  metadata: {
    rpId: string;
    origin: string;
    approvedAt: string;
    challengeHashBase64Url: string;
  };
  secrets: {
    prfOutput: ArrayBuffer | null;
  };
}

export type ChallengeInput =
  | string
  | ArrayBuffer
  | Uint8Array
  | object;

export interface DeriveUnlockKeyOptions {
  algorithm?: "AES-GCM";
  hash?: "SHA-256" | "SHA-384";
  usage?: KeyUsage[];
}

export interface VerifyApprovalOptions {
  challenge: Uint8Array | ArrayBuffer | string | object;
  expectedOrigin?: string;
  expectedRpId?: string;
  requireUserPresence?: boolean;
  requireUserVerification?: boolean;
  credentialPublicKey?: CryptoKey | JsonWebKey | Uint8Array | ArrayBuffer;
  credentialPublicKeyFormat?: "spki" | "raw" | "jwk";
  requireSignatureVerification?: boolean;
}

export interface VerifyApprovalResult {
  ok: boolean;
  reasons: string[];
  signatureVerified: boolean | null;
  flags: {
    userPresent: boolean;
    userVerified: boolean;
  };
}

export interface PasskeyBinding {
  version: 1;
  type: "webauthn-passkey";
  label?: string;
  credentialId: string;
  credentialPublicKeyJwk: JsonWebKey;
  rpId: string;
  origin: string;
  createdAt: string;
  role: "unlock" | "approval" | "unlock-and-approval";
  userVerification: "required" | "preferred" | "discouraged";
}

export interface IdentityPasskeyProfile {
  version: 1;
  identityId: string;
  bindings: PasskeyBinding[];
}

export interface SerializedPasskeyRegistration {
  version: 1;
  credentialId: string;
  credentialPublicKeySpki: string;
  credentialPublicKeyJwk: JsonWebKey;
  clientDataJSON: string;
  attestationObject: string;
  rpId: string;
  origin: string;
  createdAt: string;
  label?: string;
  userVerification: "required" | "preferred" | "discouraged";
}

export interface SerializedPasskeyApproval {
  version: 1;
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle?: string | null;
  rpId: string;
  origin: string;
  approvedAt: string;
  challengeHash: string;
}

export interface PasskeyRegistrationRecord {
  credentialId: ArrayBuffer;
  credentialIdBase64Url: string;
  credentialPublicKeySpki: ArrayBuffer;
  credentialPublicKeyJwk: JsonWebKey;
  response: {
    clientDataJSON: ArrayBuffer;
    attestationObject: ArrayBuffer;
  };
  metadata: {
    rpId: string;
    origin: string;
    createdAt: string;
    label?: string;
    userVerification: "required" | "preferred" | "discouraged";
  };
}

export interface PasskeyApprovalRecord {
  credentialId: ArrayBuffer;
  credentialIdBase64Url: string;
  response: {
    clientDataJSON: ArrayBuffer;
    authenticatorData: ArrayBuffer;
    signature: ArrayBuffer;
    userHandle: ArrayBuffer | null;
  };
  metadata: {
    rpId: string;
    origin: string;
    approvedAt: string;
    challengeHashBase64Url: string;
  };
}

export interface RegisterForIdentityOptions {
  identityId: string;
  rpName: string;
  rpId?: string;
  label?: string;
  role?: "unlock" | "approval" | "unlock-and-approval";
  userName?: string;
  userDisplayName?: string;
}

export interface ApproveActionOptions {
  action: string;
  payload: unknown;
  rpId?: string;
  allowCredentialIds?: string[];
  userVerification?: "required" | "preferred" | "discouraged";
}

export interface UnlockIdentityKeyOptions {
  encryptedIdentity: ArrayBuffer;
  iv: Uint8Array | ArrayBuffer;
  binding: PasskeyBinding;
  challengeContext?: unknown;
}
