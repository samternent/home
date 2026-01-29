import { validateEpochLedger } from "./epochValidator";

export async function migrateLedgerToGenesisEpoch(ledger: unknown) {
  const validation = await validateEpochLedger(ledger);
  if (validation.ok) {
    return { ok: true, ledger };
  }

  if (validation.legacyEpochPlacement) {
    return {
      ok: false,
      reason:
        "Legacy ledger requires re-signing to move the first epoch into genesis.",
    };
  }

  return {
    ok: false,
    reason: "Ledger does not satisfy epoch invariants.",
  };
}
