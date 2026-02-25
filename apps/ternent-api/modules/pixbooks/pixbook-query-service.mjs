import { notFound } from "../../services/http/errors.mjs";
import {
  sanitizePixbookSnapshotPayload,
  sanitizeReceiptSnapshotPayloads,
} from "./snapshot-sanitizer.mjs";

function trim(value) {
  return String(value || "").trim();
}

function parseReceipt(value) {
  try {
    return JSON.parse(String(value || ""));
  } catch {
    return null;
  }
}

function extractSnapshotPayload(receipt) {
  const candidate =
    receipt?.payload?.snapshot ?? receipt?.payload?.payload ?? receipt?.payload ?? null;
  if (!candidate || typeof candidate !== "object") return null;
  return sanitizePixbookSnapshotPayload(candidate);
}

export function createPixbookQueryService({
  pixbookRepo,
  receiptRepo,
  receiptStore,
}) {
  return {
    async listPixbooks(ctx, { accountId }) {
      const data = await pixbookRepo.listBooksForAccount(ctx.userId, accountId);
      if (!data) {
        throw notFound("ACCOUNT_NOT_FOUND", "Workspace/account not found.");
      }
      return {
        accountId: data.accountId,
        workspaceId: data.workspaceId,
        pixbooks: data.books,
      };
    },

    async getPixbook(ctx, { accountId, bookId }) {
      const resolved = await pixbookRepo.getBookForAccount(ctx.userId, accountId, bookId);
      if (!resolved) {
        throw notFound("BOOK_NOT_FOUND", "Pixbook not found.");
      }
      return {
        accountId: trim(resolved.workspace?.id),
        workspaceId: trim(resolved.workspace?.id),
        managedUser: resolved.managedUser,
        book: resolved.book,
      };
    },

    async getReceipts(ctx, { accountId, bookId, after, limit, includePayload = true }) {
      const resolved = await pixbookRepo.getBookForAccount(ctx.userId, accountId, bookId);
      if (!resolved) {
        throw notFound("BOOK_NOT_FOUND", "Pixbook not found.");
      }

      const indexed = await receiptRepo.listReceipts({
        accountId,
        bookId,
        afterEventId: after,
        limit,
      });

      const receipts = [];
      for (const row of indexed) {
        const base = {
          eventId: row.eventId,
          streamVersion: row.streamVersion,
          type: row.eventType,
          createdAt: row.createdAt,
          prevHash: row.prevHash || null,
          hash: row.hash,
          signingIdentityId: row.signingIdentityId,
          spacesKey: row.spacesKey,
        };

        if (!includePayload) {
          receipts.push(base);
          continue;
        }

        let payload = null;
        try {
          const raw = await receiptStore.getReceiptByKey(row.spacesKey);
          payload = sanitizeReceiptSnapshotPayloads(parseReceipt(raw));
        } catch {
          payload = null;
        }

        receipts.push({
          ...base,
          receipt: payload,
        });
      }

      return {
        accountId: trim(accountId),
        workspaceId: trim(accountId),
        bookId: trim(bookId),
        receipts,
      };
    },

    async getSnapshot(ctx, { accountId, bookId }) {
      const resolved = await pixbookRepo.getBookForAccount(ctx.userId, accountId, bookId);
      if (!resolved) {
        throw notFound("BOOK_NOT_FOUND", "Pixbook not found.");
      }

      const latest = await receiptRepo.getLatestIndexedReceipt({ accountId, bookId });
      if (!latest) {
        return {
          accountId: trim(accountId),
          workspaceId: trim(accountId),
          bookId: trim(bookId),
          snapshot: null,
        };
      }

      const raw = await receiptStore.getReceiptByKey(latest.spacesKey);
      const parsed = parseReceipt(raw);
      const payload = extractSnapshotPayload(parsed);
      if (!payload) {
        return {
          accountId: trim(accountId),
          workspaceId: trim(accountId),
          bookId: trim(bookId),
          snapshot: null,
        };
      }

      return {
        accountId: trim(accountId),
        workspaceId: trim(accountId),
        bookId: trim(bookId),
        snapshot: {
          id: `book-ledger:${trim(bookId)}:v${latest.streamVersion}`,
          bookId: trim(bookId),
          version: latest.streamVersion,
          ledgerHead: latest.hash,
          checksum: latest.hash,
          createdAt: latest.createdAt,
          payload,
          eventId: latest.eventId,
        },
      };
    },
  };
}
