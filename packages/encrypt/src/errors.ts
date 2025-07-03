// Custom error types for better error handling

export class EncryptionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
