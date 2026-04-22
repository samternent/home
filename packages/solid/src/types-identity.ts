import type { MnemonicWordCount, SerializedIdentity } from "@ternent/identity";
import type {
  SolidConcordAccessReport,
  SolidConcordResources,
  SolidProfileOptions,
  SolidSessionLike,
} from "./types-profile.js";

export type CreateSolidMnemonicIdentityOptions = {
  words?: MnemonicWordCount;
  passphrase?: string;
  createdAt?: string;
};

export type CreateSolidIdentityFromMnemonicOptions = {
  mnemonic: string;
  passphrase?: string;
  createdAt?: string;
};

export type SolidMnemonicSecret = {
  format: "ternent-solid-mnemonic";
  version: "1";
  createdAt: string;
  webId: string | null;
  keyId: string;
  publicKey: string;
  mnemonic: string;
  mnemonicPassphrase: string | null;
};

export type SolidWalletBackup = {
  format: "ternent-solid-wallet";
  version: "1";
  createdAt: string;
  webId: string | null;
  keyId: string;
  publicKey: string;
  ciphertext: string;
  encryption: {
    scheme: "armour-passphrase";
    encoding: "armor";
  };
};

export type SolidEncryptedIdentityBlob = {
  format: "ternent-solid-encrypted-identity";
  version: "2";
  createdAt: string;
  webId: string | null;
  keyId: string;
  publicKey: string;
  ciphertext: string;
  encryption: {
    scheme: "armour-passphrase";
    encoding: "armor";
    unlockMechanism: "password-passphrase" | "unsafe-static-passphrase" | string;
  };
};

export type SolidVerificationDocument = {
  format: "ternent-solid-verification";
  version: "1";
  createdAt: string;
  webId: string | null;
  keyId: string;
  publicKey: string;
  algorithm: "Ed25519";
  proofPurpose: "assertionMethod";
};

export type CreateSolidWalletBackupOptions = {
  identity: SerializedIdentity | string;
  passphrase: string;
  webId?: string | null;
  createdAt?: string;
};

export type CreateSolidMnemonicSecretOptions = {
  mnemonic: string;
  mnemonicPassphrase?: string;
  webId?: string | null;
  createdAt?: string;
  identity?: SerializedIdentity;
};

export type RestoreSolidIdentityFromMnemonicSecretOptions = {
  secret: SolidMnemonicSecret | string;
  expectedWebId?: string;
};

export type RestoreSolidIdentityFromBackupOptions = {
  backup: SolidWalletBackup | string;
  passphrase: string;
  expectedWebId?: string;
};

export type CreateSolidWalletStorageOptions = {
  contentType?: string;
};

export type CreateSolidMnemonicStorageOptions = {
  contentType?: string;
};

export type CreateSolidEncryptedIdentityStorageOptions = {
  contentType?: string;
};

export type SolidIdentityCacheStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type SolidIdentityCacheLike = {
  name: string;
  key: string;
  load(): Promise<SerializedIdentity | null>;
  save(identity: SerializedIdentity): Promise<void>;
  clear(): Promise<void>;
};

export type SolidIdentityUnlockContext = {
  reason: "encrypt" | "decrypt";
  webId: string | null;
  keyId: string | null;
  storage: "local-cache" | "solid-resource";
  cacheKey?: string;
  resourceUrl?: string;
};

export type SolidIdentityUnlocker = {
  mechanism: "password-passphrase" | "unsafe-static-passphrase" | string;
  unlock(context: SolidIdentityUnlockContext): Promise<string>;
};

export type CreateSolidIdentityCacheOptions = {
  key?: string;
  webId?: string;
  session?: SolidSessionLike;
  storage?: SolidIdentityCacheStorageLike;
  namespace?: string;
  unlocker?: SolidIdentityUnlocker;
};

export type ResolveSolidIdentityInput = {
  identity?: SerializedIdentity;
  cache?: SolidIdentityCacheLike;
  unlocker?: SolidIdentityUnlocker;
  encryptedIdentity?: SolidEncryptedIdentityBlob | string;
  identityUrl?: string;
  encryptedIdentityUrl?: string;
  identityContentType?: string;
  encryptedIdentityContentType?: string;
  mnemonic?: string;
  mnemonicPassphrase?: string;
  walletBackup?: SolidWalletBackup | string;
  walletUrl?: string;
  walletPassphrase?: string;
  walletContentType?: string;
  createdAt?: string;
  expectedWebId?: string;
};

export type ProvisionSolidIdentityOptions = {
  session: SolidSessionLike;
  words?: MnemonicWordCount;
  mnemonicPassphrase?: string;
  createdAt?: string;
  webId?: string | null;
  unlocker?: SolidIdentityUnlocker;
  identityUrl?: string;
  identityContentType?: string;
  walletPassphrase?: string;
  walletUrl?: string;
  walletContentType?: string;
  cache?: SolidIdentityCacheLike;
  profile?: SolidProfileOptions;
};

export type ProvisionSolidIdentityResult = {
  identity: SerializedIdentity;
  mnemonic: string;
  encryptedIdentity: SolidEncryptedIdentityBlob;
  mnemonicSecret: SolidMnemonicSecret;
  walletBackup?: SolidWalletBackup;
  resources?: SolidConcordResources;
  accessReport?: SolidConcordAccessReport;
};
