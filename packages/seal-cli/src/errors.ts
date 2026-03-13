export const EXIT_SUCCESS = 0;
export const EXIT_FAILURE = 1;
export const EXIT_HASH_MISMATCH = 2;
export const EXIT_SIGNATURE_INVALID = 3;
export const EXIT_INVALID_PROOF = 4;
export const EXIT_KEY_CONFIG = 5;

export class SealCliError extends Error {
  exitCode: number;

  constructor(message: string, exitCode = EXIT_FAILURE) {
    super(message);
    this.name = "SealCliError";
    this.exitCode = exitCode;
  }
}

export function getExitCode(error: unknown): number {
  if (error instanceof SealCliError) {
    return error.exitCode;
  }
  return EXIT_FAILURE;
}
