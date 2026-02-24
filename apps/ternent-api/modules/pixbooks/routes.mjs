import { requireSession } from "../../services/auth/platform-auth.mjs";
import { getPixbookServices } from "./service-factory.mjs";
import {
  parseCreateCommand,
  parseGetPixbookParams,
  parseListReceiptsQuery,
  parsePixbookListQuery,
  parseSaveCommand,
} from "./validators.mjs";

function ctx(req) {
  return {
    requestId: req.requestId,
    userId: String(req?.platformSession?.user?.id || "").trim(),
    signer: getPixbookServices().signer,
  };
}

function ok(res, req, data, statusCode = 200) {
  res.status(statusCode).send({
    ok: true,
    data,
    requestId: req.requestId,
  });
}

function retryAfterFor(result) {
  const fromBody = Number(result?.data?.retryAfterSeconds);
  if (Number.isFinite(fromBody) && fromBody > 0) {
    return Math.trunc(fromBody);
  }
  const fromEnv = Number.parseInt(String(process.env.IDEMPOTENCY_RETRY_AFTER_SECONDS || ""), 10);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 2;
}

export default function pixbookRoutes(router) {
  router.get("/v1/pixbooks", requireSession, async (req, res, next) => {
    try {
      const input = parsePixbookListQuery(req);
      const data = await getPixbookServices().queryService.listPixbooks(ctx(req), input);
      ok(res, req, data, 200);
    } catch (error) {
      next(error);
    }
  });

  router.get("/v1/pixbooks/:id", requireSession, async (req, res, next) => {
    try {
      const input = parseGetPixbookParams(req);
      const data = await getPixbookServices().queryService.getPixbook(ctx(req), input);
      ok(res, req, data, 200);
    } catch (error) {
      next(error);
    }
  });

  router.get("/v1/pixbooks/:id/receipts", requireSession, async (req, res, next) => {
    try {
      const input = parseListReceiptsQuery(req);
      const includePayload = String(req?.query?.includePayload || "true").toLowerCase() !== "false";
      const data = await getPixbookServices().queryService.getReceipts(ctx(req), {
        ...input,
        includePayload,
      });
      ok(res, req, data, 200);
    } catch (error) {
      next(error);
    }
  });

  router.get("/v1/pixbooks/:id/snapshot", requireSession, async (req, res, next) => {
    try {
      const input = parseGetPixbookParams(req);
      const data = await getPixbookServices().queryService.getSnapshot(ctx(req), input);
      ok(res, req, data, 200);
    } catch (error) {
      next(error);
    }
  });

  router.post("/v1/pixbooks/commands/create", requireSession, async (req, res, next) => {
    try {
      const input = parseCreateCommand(req);
      const result = await getPixbookServices().commandService.createPixbook(ctx(req), input);
      if (result.httpStatus === 202) {
        res.setHeader("Retry-After", String(retryAfterFor(result)));
        res.setHeader("Idempotency-Key", input.idempotencyKey);
      }
      ok(res, req, result.data, result.httpStatus);
    } catch (error) {
      next(error);
    }
  });

  router.post("/v1/pixbooks/:id/commands/save", requireSession, async (req, res, next) => {
    try {
      const input = parseSaveCommand(req);
      const result = await getPixbookServices().commandService.savePixbook(ctx(req), input);
      if (result.httpStatus === 202) {
        res.setHeader("Retry-After", String(retryAfterFor(result)));
        res.setHeader("Idempotency-Key", input.idempotencyKey);
      }
      ok(res, req, result.data, result.httpStatus);
    } catch (error) {
      next(error);
    }
  });
}
