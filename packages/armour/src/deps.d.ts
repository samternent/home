declare module "@ternent/identity" {
  export type SerializedIdentity = {
    format: "ternent-identity";
    version: "2";
    algorithm: "Ed25519";
    createdAt: string;
    publicKey: string;
    keyId: string;
    material: {
      kind: "seed";
      seed: string;
    };
  };

  export function parseIdentity(
    input: string | SerializedIdentity
  ): SerializedIdentity;

  export function deriveAgeRecipient(
    input: string | SerializedIdentity
  ): Promise<string>;

  export function deriveAgeSecretKey(
    input: string | SerializedIdentity
  ): Promise<string>;
}

declare module "@ternent/rage" {
  export class RageError extends Error {
    readonly code: string;
    readonly cause?: unknown;
  }

  export class RageInitError extends RageError {}
  export class RageValidationError extends RageError {}
  export class RageEncryptionError extends RageError {}
  export class RageDecryptionError extends RageError {}

  export function initRage(): Promise<void>;

  export function encryptWithRecipients(input: {
    recipients: string[];
    data: Uint8Array;
    output?: "armor" | "binary";
  }): Promise<Uint8Array>;

  export function decryptWithIdentity(input: {
    identity: string;
    data: Uint8Array;
  }): Promise<Uint8Array>;

  export function encryptWithPassphrase(input: {
    passphrase: string;
    data: Uint8Array;
    output?: "armor" | "binary";
  }): Promise<Uint8Array>;

  export function decryptWithPassphrase(input: {
    passphrase: string;
    data: Uint8Array;
  }): Promise<Uint8Array>;
}
