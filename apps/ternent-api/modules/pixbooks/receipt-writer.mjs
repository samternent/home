import { createId } from "../../services/platform-db/index.mjs";
import { conflict, serviceUnavailable } from "../../services/http/errors.mjs";

function trim(value) {
  return String(value || "").trim();
}

export function createReceiptWriter({ signer, receiptRepo, receiptStore }) {
  return {
    async appendPixbookReceipt({
      tx,
      accountId,
      bookId,
      eventType,
      payload,
      idempotencyKey,
      signingIdentity,
      expectedPrevHash = null,
    }) {
      const normalizedAccountId = trim(accountId);
      const normalizedBookId = trim(bookId);
      const head = await receiptRepo.getLedgerHead(tx, {
        accountId: normalizedAccountId,
        bookId: normalizedBookId,
      });

      const prevHash = trim(head.lastHash);
      if (expectedPrevHash !== null && trim(expectedPrevHash) !== prevHash) {
        throw conflict(
          "STREAM_HEAD_CONFLICT",
          "Pixbook stream head changed before this write completed.",
          {
            expectedPrevHash: trim(expectedPrevHash),
            currentPrevHash: prevHash,
          }
        );
      }

      const eventId = createId("evt");
      const streamVersion = Number(head.streamVersion || 0) + 1;
      const createdAt = new Date().toISOString();
      const coreReceipt = {
        eventId,
        stream: {
          type: "pixbook",
          accountId: normalizedAccountId,
          bookId: normalizedBookId,
        },
        type: trim(eventType),
        payload: payload ?? {},
        createdAt,
        issuer: {
          signingIdentityId: trim(signingIdentity.id),
          publicKeyId: trim(signingIdentity.publicKeyId),
        },
        idempotencyKey: trim(idempotencyKey),
        prevEventId: trim(head.lastEventId) || null,
        prevHash: prevHash || null,
        schemaVersion: 1,
        streamVersion,
      };

      const hash = signer.hashCanonical(coreReceipt);
      const signed = await signer.signDigest({
        keyName: signingIdentity.vaultKeyName,
        digestHex: hash,
      });
      if (!signer.validateSignatureFormat(signed.signature)) {
        throw serviceUnavailable(
          "SIGNATURE_INVALID",
          "Vault signer returned an invalid signature."
        );
      }

      const receipt = {
        ...coreReceipt,
        hash,
        signature: signed.signature,
        signatureAlgorithm: signed.algorithm,
      };

      const canonicalBody = Buffer.from(signer.canonicalBytes(receipt)).toString("utf8");
      const stored = await receiptStore.putReceipt({
        accountId: normalizedAccountId,
        bookId: normalizedBookId,
        eventId,
        body: canonicalBody,
      });

      await receiptRepo.upsertLedgerHead(tx, {
        accountId: normalizedAccountId,
        bookId: normalizedBookId,
        lastEventId: eventId,
        lastHash: hash,
        streamVersion,
      });

      await receiptRepo.insertReceiptIndex(tx, {
        accountId: normalizedAccountId,
        bookId: normalizedBookId,
        eventId,
        streamVersion,
        eventType: trim(eventType),
        createdAt,
        prevHash: prevHash || null,
        hash,
        spacesKey: stored.key,
        signingIdentityId: trim(signingIdentity.id),
        idempotencyKey: trim(idempotencyKey),
      });

      return {
        eventId,
        streamVersion,
        prevHash: prevHash || null,
        hash,
        spacesKey: stored.key,
        createdAt,
        receipt,
      };
    },
  };
}
