export {
  PasskeyCreateRejectedError,
  PasskeyGetRejectedError,
  PasskeyOriginMismatchError,
  PasskeyRpIdMismatchError,
  PasskeySerializationError,
  PasskeyUnsupportedError,
  PasskeyUserPresenceRequiredError,
  PasskeyUserVerificationRequiredError,
  PasskeyVerificationError,
} from "./errors.js";

export { isSupported, requireSupport } from "./support.js";
export { register } from "./register.js";
export { approve } from "./approve.js";
export { deriveEphemeralApprovalKey, deriveUnlockKey } from "./derive.js";
export { buildChallenge } from "./challenge.js";
export { validateApprovalContext, verifyApproval } from "./verify.js";
export {
  serializeRegistration,
  serializeApproval,
  deserializeRegistration,
  deserializeApproval,
} from "./serialize.js";
export {
  registerForIdentity,
  approveAction,
  unlockIdentityKey,
} from "./bindings.js";

export type {
  ApproveActionOptions,
  ApproveOptions,
  BytesLike,
  ChallengeInput,
  DeriveUnlockKeyOptions,
  IdentityPasskeyProfile,
  PasskeyApproval,
  PasskeyApprovalRecord,
  PasskeyBinding,
  PasskeyRegistration,
  PasskeyRegistrationRecord,
  RegisterForIdentityOptions,
  RegisterOptions,
  SerializedPasskeyApproval,
  SerializedPasskeyRegistration,
  UnlockIdentityKeyOptions,
  VerifyApprovalOptions,
  VerifyApprovalResult,
} from "./types.js";
