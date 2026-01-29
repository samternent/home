import { getEntrySigningPayload } from "@ternent/concord-protocol";
import {
  validateLedgerEpochs,
  type EpochValidationError,
  type EpochValidationResult,
} from "@ternent/concord-protocol";
import { importPublicKeyFromPem, verify } from "ternent-identity";
import { formatIdentityKey } from "ternent-utils";

export { type EpochValidationError, type EpochValidationResult };

export function validateEpochLedger(ledger: unknown) {
  return validateLedgerEpochs(ledger as any, {
    verifyEntrySignature: async (entry) => {
      if (!entry.signature || !entry.author) return false;
      const authorKey = await importPublicKeyFromPem(
        formatIdentityKey(entry.author)
      );
      const payload = getEntrySigningPayload(entry as any);
      return verify(entry.signature, payload, authorKey);
    },
  });
}
