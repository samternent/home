export {
  ArmourDecryptionError,
  ArmourEncryptionError,
  ArmourError,
  ArmourIdentityError,
  ArmourInitError,
  ArmourValidationError,
} from "./errors.js";
export {
  decryptBinaryWithIdentity,
  decryptBinaryWithPassphrase,
  encryptBinaryForIdentities,
  encryptBinaryWithPassphrase,
} from "./files.js";
export {
  assertIdentityCapabilityRoot,
  recipientFromIdentity,
  resolveIdentity,
  secretKeyFromIdentity,
} from "./identity.js";
export {
  decryptWithPassphrase,
  encryptWithPassphrase,
} from "./passphrase.js";
export {
  decryptWithIdentity,
  decryptWithSecretKey,
  encryptForIdentities,
  encryptForRecipients,
  recipientsFromIdentities,
} from "./recipients.js";
export {
  decryptTextWithIdentity,
  decryptTextWithPassphrase,
  encryptTextForIdentities,
  encryptTextWithPassphrase,
} from "./text.js";
export { initArmour } from "./init.js";
export type { SerializedIdentity } from "@ternent/identity";
export type {
  ArmourBinaryInput,
  ArmourErrorCode,
  ArmourIdentityInput,
  ArmourOutputFormat,
  DecryptBinaryWithIdentityInput,
  DecryptBinaryWithPassphraseInput,
  DecryptTextWithIdentityInput,
  DecryptTextWithPassphraseInput,
  DecryptWithIdentityInput,
  DecryptWithPassphraseInput,
  DecryptWithSecretKeyInput,
  EncryptBinaryForIdentitiesInput,
  EncryptBinaryWithPassphraseInput,
  EncryptForIdentitiesInput,
  EncryptForRecipientsInput,
  EncryptTextForIdentitiesInput,
  EncryptTextWithPassphraseInput,
  EncryptWithPassphraseInput,
} from "./types.js";
