export class PasskeyUnsupportedError extends Error {
  constructor(message = "Passkeys are not supported in this runtime.") {
    super(message);
    this.name = "PasskeyUnsupportedError";
  }
}

export class PasskeyCreateRejectedError extends Error {
  constructor(message = "Passkey registration was rejected by the user or platform.") {
    super(message);
    this.name = "PasskeyCreateRejectedError";
  }
}

export class PasskeyGetRejectedError extends Error {
  constructor(message = "Passkey approval was rejected by the user or platform.") {
    super(message);
    this.name = "PasskeyGetRejectedError";
  }
}

export class PasskeyVerificationError extends Error {
  constructor(message = "Passkey approval verification failed.") {
    super(message);
    this.name = "PasskeyVerificationError";
  }
}

export class PasskeyOriginMismatchError extends Error {
  constructor(message = "Passkey approval origin did not match the expected origin.") {
    super(message);
    this.name = "PasskeyOriginMismatchError";
  }
}

export class PasskeyRpIdMismatchError extends Error {
  constructor(message = "Passkey approval RP ID did not match the expected RP ID.") {
    super(message);
    this.name = "PasskeyRpIdMismatchError";
  }
}

export class PasskeyUserVerificationRequiredError extends Error {
  constructor(message = "Passkey approval did not include user verification.") {
    super(message);
    this.name = "PasskeyUserVerificationRequiredError";
  }
}

export class PasskeyUserPresenceRequiredError extends Error {
  constructor(message = "Passkey approval did not include user presence.") {
    super(message);
    this.name = "PasskeyUserPresenceRequiredError";
  }
}

export class PasskeySerializationError extends Error {
  constructor(message = "Invalid passkey serialization input.") {
    super(message);
    this.name = "PasskeySerializationError";
  }
}
