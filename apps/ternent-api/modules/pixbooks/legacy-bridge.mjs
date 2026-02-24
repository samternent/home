import { getPixbookServices } from "./service-factory.mjs";

function trim(value) {
  return String(value || "").trim();
}

export function applyLegacyDeprecationHeaders(res) {
  res.setHeader("Deprecation", "true");
  res.setHeader("Sunset", "Wed, 30 Sep 2026 00:00:00 GMT");
  res.setHeader(
    "Link",
    '</docs/pixpax-migration/pixbook-commands>; rel="deprecation"; type="text/markdown"'
  );
}

function buildCtx(req, userId) {
  return {
    requestId: req?.requestId || "",
    userId: trim(userId),
    signer: getPixbookServices().signer,
  };
}

export async function getLegacyPixbookSnapshot({
  req,
  userId,
  accountId,
  bookId,
}) {
  const data = await getPixbookServices().queryService.getSnapshot(
    buildCtx(req, userId),
    {
      accountId: trim(accountId),
      bookId: trim(bookId),
    }
  );
  return data?.snapshot || null;
}

export async function saveLegacyPixbookSnapshot({
  req,
  userId,
  accountId,
  bookId,
  payload,
  ledgerHead,
  expectedVersion,
  expectedLedgerHead,
  signingIdentityId,
}) {
  const idempotencyKey =
    trim(req?.headers?.["idempotency-key"]) ||
    `legacy:${trim(req?.requestId)}:${trim(bookId)}`;
  const input = {
    accountId: trim(accountId),
    bookId: trim(bookId),
    idempotencyKey,
    signingIdentityId: trim(signingIdentityId),
    body: {
      payload,
      ledgerHead: trim(ledgerHead) || null,
      expectedVersion:
        expectedVersion === null || expectedVersion === undefined
          ? null
          : Number(expectedVersion),
      expectedLedgerHead:
        expectedLedgerHead === null || expectedLedgerHead === undefined
          ? null
          : trim(expectedLedgerHead),
    },
  };
  const command = await getPixbookServices().commandService.savePixbook(
    buildCtx(req, userId),
    input
  );
  const snapshot = await getLegacyPixbookSnapshot({
    req,
    userId,
    accountId,
    bookId,
  });
  return {
    command: command?.data || null,
    snapshot,
  };
}
