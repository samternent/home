import type { SerializedIdentity } from "@ternent/identity";

export type ArmourIdentityInput = string | SerializedIdentity;
export type ArmourOutputFormat = "armor" | "binary";
export type ArmourBinaryInput = Uint8Array | ArrayBuffer | Blob;

export type ArmourErrorCode =
  | "ARMOUR_INIT_FAILED"
  | "ARMOUR_EMPTY_DATA"
  | "ARMOUR_EMPTY_RECIPIENTS"
  | "ARMOUR_INVALID_RECIPIENT"
  | "ARMOUR_INVALID_SECRET_KEY"
  | "ARMOUR_EMPTY_PASSPHRASE"
  | "ARMOUR_DATA_TOO_LARGE"
  | "ARMOUR_INVALID_IDENTITY"
  | "ARMOUR_IDENTITY_DERIVATION_FAILED"
  | "ARMOUR_ENCRYPT_FAILED"
  | "ARMOUR_DECRYPT_FAILED";

export interface EncryptForRecipientsInput {
  recipients: string[];
  data: Uint8Array;
  output?: ArmourOutputFormat;
}

export interface DecryptWithSecretKeyInput {
  secretKey: string;
  data: Uint8Array;
}

export interface EncryptForIdentitiesInput {
  identities: ArmourIdentityInput[];
  data: Uint8Array;
  output?: ArmourOutputFormat;
}

export interface DecryptWithIdentityInput {
  identity: ArmourIdentityInput;
  data: Uint8Array;
}

export interface EncryptWithPassphraseInput {
  passphrase: string;
  data: Uint8Array;
  output?: ArmourOutputFormat;
}

export interface DecryptWithPassphraseInput {
  passphrase: string;
  data: Uint8Array;
}

export interface EncryptTextForIdentitiesInput {
  identities: ArmourIdentityInput[];
  text: string;
}

export interface DecryptTextWithIdentityInput {
  identity: ArmourIdentityInput;
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

export interface EncryptBinaryForIdentitiesInput {
  identities: ArmourIdentityInput[];
  data: ArmourBinaryInput;
  output?: ArmourOutputFormat;
}

export interface DecryptBinaryWithIdentityInput {
  identity: ArmourIdentityInput;
  data: ArmourBinaryInput;
}

export interface EncryptBinaryWithPassphraseInput {
  passphrase: string;
  data: ArmourBinaryInput;
  output?: ArmourOutputFormat;
}

export interface DecryptBinaryWithPassphraseInput {
  passphrase: string;
  data: ArmourBinaryInput;
}
