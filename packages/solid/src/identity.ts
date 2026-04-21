export {
  getSolidWebId,
  createSolidMnemonicIdentity,
  createSolidIdentity,
  isSolidMnemonicSecret,
  serializeSolidMnemonicSecret,
  createSolidMnemonicSecret,
  restoreSolidIdentityFromMnemonicSecret,
  isSolidWalletBackup,
  serializeSolidWalletBackup,
  createSolidWalletBackup,
  restoreSolidIdentityFromBackup,
} from "./identity-mnemonic-wallet.js";

export {
  createStaticSolidIdentityUnlocker,
  createSolidWebAuthnIdentityUnlocker,
  createDefaultSolidIdentityUnlocker,
  resolveSolidIdentityUnlocker,
  isSolidPasskeyBinding,
  normalizePasskeyBinding,
} from "./identity-unlocker.js";

export {
  isSolidEncryptedIdentityBlob,
  serializeSolidEncryptedIdentityBlob,
  createSolidEncryptedIdentityBlob,
  restoreSolidIdentityFromEncryptedBlob,
} from "./identity-encrypted.js";
