export type RageOutputFormat = "armor" | "binary";

export type RageErrorCode =
  | "RAGE_INIT_FAILED"
  | "RAGE_EMPTY_DATA"
  | "RAGE_EMPTY_RECIPIENTS"
  | "RAGE_INVALID_RECIPIENT"
  | "RAGE_INVALID_IDENTITY"
  | "RAGE_EMPTY_PASSPHRASE"
  | "RAGE_DATA_TOO_LARGE"
  | "RAGE_ENCRYPT_FAILED"
  | "RAGE_DECRYPT_FAILED";

export interface RageKeyPair {
  type: "x25519";
  privateKey: string;
  publicKey: string;
}

export interface EncryptWithRecipientsInput {
  recipients: string[];
  data: Uint8Array;
  output?: RageOutputFormat;
}

export interface DecryptWithIdentityInput {
  identity: string;
  data: Uint8Array;
}

export interface EncryptWithPassphraseInput {
  passphrase: string;
  data: Uint8Array;
  output?: RageOutputFormat;
}

export interface DecryptWithPassphraseInput {
  passphrase: string;
  data: Uint8Array;
}

export interface EncryptTextWithRecipientsInput {
  recipients: string[];
  text: string;
}

export interface DecryptTextWithIdentityInput {
  identity: string;
  data: string | Uint8Array;
}

export interface EncryptTextWithPassphraseInput {
  passphrase: string;
  text: string;
}

export interface DecryptTextWithPassphraseInput {
  passphrase: string;
  data: string | Uint8Array;
}
