export class HttpError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(String(message || "Request failed."));
    this.name = "HttpError";
    this.statusCode = Number(statusCode || 500);
    this.code = String(code || "INTERNAL_ERROR");
    this.details = details;
  }
}

export function badRequest(code, message, details = null) {
  return new HttpError(400, code, message, details);
}

export function unauthorized(code, message, details = null) {
  return new HttpError(401, code, message, details);
}

export function forbidden(code, message, details = null) {
  return new HttpError(403, code, message, details);
}

export function notFound(code, message, details = null) {
  return new HttpError(404, code, message, details);
}

export function conflict(code, message, details = null) {
  return new HttpError(409, code, message, details);
}

export function serviceUnavailable(code, message, details = null) {
  return new HttpError(503, code, message, details);
}
