export class ConcordBoundaryError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ConcordBoundaryError";
    this.code = code;
  }
}
