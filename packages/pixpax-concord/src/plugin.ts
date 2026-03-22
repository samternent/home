import type { LedgerReplayEntry } from "@ternent/ledger";
import type { ConcordReplayPlugin } from "@ternent/concord";
import {
  PIXPAX_COMMAND_CLAIM_PACK,
  PIXPAX_COMMAND_RECORD_TRANSFER,
  PIXPAX_COMMAND_RECORD_PACK_OPENED,
  PIXPAX_COMMAND_SET_DISPLAY_PROFILE,
  assertValidClaimPackCommandInput,
  assertValidRecordTransferCommandInput,
  assertValidRecordPackOpenedCommandInput,
  assertValidSetDisplayProfileCommandInput,
  createInitialPixbookReplayState,
  createReplayStateFromClaims,
  type PixbookClaimPackCommandInput,
  type PixbookRecordTransferCommandInput,
  type PixbookReplayState,
  type PixbookSetDisplayProfileCommandInput,
  type PixbookRecordPackOpenedCommandInput,
  type PixpaxCollectionCatalog,
} from "@ternent/pixpax-core";

export type CreatePixbookPluginOptions = {
  catalogs?: PixpaxCollectionCatalog[];
  getCatalogs?: () => PixpaxCollectionCatalog[];
  now?: () => string;
  verifyProofs?: boolean;
  verifyPackIssuanceProof?: (input: {
    artifact: PixbookClaimPackCommandInput["artifact"];
  }) => Promise<{
    ok: boolean;
    errors: string[];
  }>;
  verifyTransferProof?: (input: {
    artifact: PixbookRecordTransferCommandInput["offerArtifact"];
  }) => Promise<{
    ok: boolean;
    errors: string[];
  }>;
  verifyTransferAcceptanceProof?: (input: {
    artifact: PixbookRecordTransferCommandInput["acceptanceArtifact"];
  }) => Promise<{
    ok: boolean;
    errors: string[];
  }>;
};

let verifierPromise: Promise<
  typeof import("@ternent/pixpax-issuer").verifyPackIssuanceProof
> | null = null;
let transferVerifierPromise: Promise<
  typeof import("@ternent/pixpax-issuer").verifyTransferProof
> | null = null;
let transferAcceptanceVerifierPromise: Promise<
  typeof import("@ternent/pixpax-issuer").verifyTransferAcceptanceProof
> | null = null;

async function loadPackIssuanceVerifier() {
  if (!verifierPromise) {
    verifierPromise = import("@ternent/pixpax-issuer").then(
      (module) => module.verifyPackIssuanceProof,
    );
  }
  return await verifierPromise;
}

async function loadTransferVerifier() {
  if (!transferVerifierPromise) {
    transferVerifierPromise = import("@ternent/pixpax-issuer").then(
      (module) => module.verifyTransferProof,
    );
  }
  return await transferVerifierPromise;
}

async function loadTransferAcceptanceVerifier() {
  if (!transferAcceptanceVerifierPromise) {
    transferAcceptanceVerifierPromise = import("@ternent/pixpax-issuer").then(
      (module) => module.verifyTransferAcceptanceProof,
    );
  }
  return await transferAcceptanceVerifierPromise;
}

function cloneState(state: PixbookReplayState): PixbookReplayState {
  return {
    ...state,
    claimedPacksByEntryId: { ...state.claimedPacksByEntryId },
    openedPacksByClaimEntryId: { ...state.openedPacksByClaimEntryId },
    transfersByEntryId: { ...state.transfersByEntryId },
    ownedCardInstancesById: { ...state.ownedCardInstancesById },
    duplicateCountsByCardId: { ...state.duplicateCountsByCardId },
    spareCountsByCardId: { ...state.spareCountsByCardId },
    completionByCollectionKey: { ...state.completionByCollectionKey },
    completionBySeriesKey: { ...state.completionBySeriesKey },
    verificationByClaimEntryId: { ...state.verificationByClaimEntryId },
    transferHistory: {
      outgoing: [...state.transferHistory.outgoing],
      incoming: [...state.transferHistory.incoming],
    },
    ledgerHealth: {
      claimedPackCount: state.ledgerHealth.claimedPackCount,
      openedPackCount: state.ledgerHealth.openedPackCount,
      lastEntryId: state.ledgerHealth.lastEntryId,
      invalidEntries: [...state.ledgerHealth.invalidEntries],
    },
  };
}

async function recomputeState(
  state: PixbookReplayState,
  catalogs: PixpaxCollectionCatalog[],
): Promise<PixbookReplayState> {
  const rebuilt = await createReplayStateFromClaims({
    claimsByEntryId: state.claimedPacksByEntryId,
    openedByClaimEntryId: state.openedPacksByClaimEntryId,
    transfersByEntryId: state.transfersByEntryId,
    catalogs,
  });

  rebuilt.displayProfile = state.displayProfile;
  rebuilt.verificationByClaimEntryId = Object.fromEntries(
    Object.entries(state.claimedPacksByEntryId).map(([claimEntryId, claim]) => [
      claimEntryId,
      claim.verification ?? null,
    ]),
  );
  rebuilt.ledgerHealth.invalidEntries = [...state.ledgerHealth.invalidEntries];
  rebuilt.ledgerHealth.lastEntryId = state.ledgerHealth.lastEntryId;
  return rebuilt;
}

function appendInvalidEntry(state: PixbookReplayState, entryId: string): PixbookReplayState {
  if (state.ledgerHealth.invalidEntries.includes(entryId)) {
    return state;
  }
  return {
    ...state,
    ledgerHealth: {
      ...state.ledgerHealth,
      invalidEntries: [...state.ledgerHealth.invalidEntries, entryId],
    },
  };
}

function isPlainEntryPayload(
  entry: LedgerReplayEntry,
): entry is LedgerReplayEntry & {
  payload: {
    type: "plain";
    data: Record<string, unknown>;
  };
} {
  return entry.payload.type === "plain";
}

export function createPixbookPlugin(
  options: CreatePixbookPluginOptions = {},
): ConcordReplayPlugin<PixbookReplayState> {
  const catalogs = options.catalogs || [];
  const getCatalogs = options.getCatalogs ?? (() => catalogs);
  const now = options.now ?? (() => new Date().toISOString());
  const verifyProofs = options.verifyProofs !== false;
  const verifyPackProof =
    options.verifyPackIssuanceProof ??
    (async (input: { artifact: PixbookClaimPackCommandInput["artifact"] }) => {
      const verifier = await loadPackIssuanceVerifier();
      return await verifier(input);
    });
  const verifyTransferProof =
    options.verifyTransferProof ??
    (async (input: { artifact: PixbookRecordTransferCommandInput["offerArtifact"] }) => {
      const verifier = await loadTransferVerifier();
      return await verifier(input);
    });
  const verifyTransferAcceptanceProof =
    options.verifyTransferAcceptanceProof ??
    (async (input: {
      artifact: PixbookRecordTransferCommandInput["acceptanceArtifact"];
    }) => {
      const verifier = await loadTransferAcceptanceVerifier();
      return await verifier(input);
    });

  return {
    id: "pixbook",
    initialState() {
      return createInitialPixbookReplayState();
    },
    commands: {
      [PIXPAX_COMMAND_CLAIM_PACK]: async (
        ctx,
        inputValue: PixbookClaimPackCommandInput,
      ) => {
        const input = await assertValidClaimPackCommandInput(inputValue);
        const current = ctx.getReplayState<PixbookReplayState>("pixbook");
        const duplicateClaim = Object.values(
          current?.claimedPacksByEntryId || {},
        ).some(
          (claim) => claim.artifact.payload.packId === input.artifact.payload.packId,
        );
        if (duplicateClaim) {
          throw new Error(
            `Pack ${input.artifact.payload.packId} is already claimed in this Pixbook.`,
          );
        }
        if (verifyProofs) {
          const verification = await verifyPackProof({
            artifact: input.artifact,
          });
          if (!verification.ok) {
            throw new Error(
              `Pack issuance proof is invalid: ${verification.errors.join(", ")}`,
            );
          }
        }
        return {
          kind: PIXPAX_COMMAND_CLAIM_PACK,
          payload: {
            ...input,
            claimedAt: input.claimedAt || now(),
            verification:
              input.verification || {
                proofValidLocal: true,
                policyConfirmed: null,
                verifiedAt: now(),
                source: "local-proof",
                reason: null,
              },
          },
        };
      },
      [PIXPAX_COMMAND_RECORD_PACK_OPENED]: async (
        _ctx,
        inputValue: PixbookRecordPackOpenedCommandInput,
      ) => {
        const input = assertValidRecordPackOpenedCommandInput(inputValue);
        return {
          kind: PIXPAX_COMMAND_RECORD_PACK_OPENED,
          payload: {
            ...input,
            openedAt: input.openedAt || now(),
          },
        };
      },
      [PIXPAX_COMMAND_SET_DISPLAY_PROFILE]: async (
        _ctx,
        inputValue: PixbookSetDisplayProfileCommandInput,
      ) => {
        const input = assertValidSetDisplayProfileCommandInput(inputValue);
        return {
          kind: PIXPAX_COMMAND_SET_DISPLAY_PROFILE,
          payload: {
            ...input,
            updatedAt: input.updatedAt || now(),
          },
        };
      },
      [PIXPAX_COMMAND_RECORD_TRANSFER]: async (
        ctx,
        inputValue: PixbookRecordTransferCommandInput,
      ) => {
        const input = await assertValidRecordTransferCommandInput(inputValue);
        const current = ctx.getReplayState<PixbookReplayState>("pixbook");
        const offer = input.offerArtifact.payload;
        const currentIdentity = String(ctx.identity.publicKey || "").trim();
        const isSender =
          currentIdentity === String(offer.fromClaimant.normalizedValue || "").trim();
        const isRecipient =
          currentIdentity === String(offer.toClaimant.normalizedValue || "").trim();

        if (!isSender && !isRecipient) {
          throw new Error("Current identity is not part of this swap.");
        }
        if (
          Object.values(current?.transfersByEntryId || {}).some(
            (entry) => entry.transferId === offer.transferId,
          )
        ) {
          throw new Error(`Transfer ${offer.transferId} is already recorded in this Pixbook.`);
        }
        if (isSender && !current?.ownedCardInstancesById?.[offer.cardInstanceId]) {
          throw new Error("You no longer own this card instance.");
        }
        if (verifyProofs) {
          const offerVerification = await verifyTransferProof({
            artifact: input.offerArtifact,
          });
          if (!offerVerification.ok) {
            throw new Error(
              `Transfer offer proof is invalid: ${offerVerification.errors.join(", ")}`,
            );
          }
          const acceptanceVerification = await verifyTransferAcceptanceProof({
            artifact: input.acceptanceArtifact,
          });
          if (!acceptanceVerification.ok) {
            throw new Error(
              `Transfer acceptance proof is invalid: ${acceptanceVerification.errors.join(", ")}`,
            );
          }
        }

        return {
          kind: PIXPAX_COMMAND_RECORD_TRANSFER,
          payload: {
            ...input,
            direction: isSender ? "outgoing" : "incoming",
            recordedAt: input.recordedAt || now(),
          },
        };
      },
    },
    async applyEntry(entry, ctx) {
      if (!isPlainEntryPayload(entry)) {
        return;
      }

      const current = cloneState(ctx.getState() || createInitialPixbookReplayState());

      if (entry.kind === PIXPAX_COMMAND_CLAIM_PACK) {
        const input = await assertValidClaimPackCommandInput(
          entry.payload.data as unknown as PixbookClaimPackCommandInput,
        );
        const duplicateClaim = Object.values(current.claimedPacksByEntryId).some(
          (claim) => claim.artifact.payload.packId === input.artifact.payload.packId,
        );

        if (duplicateClaim) {
          ctx.setState(appendInvalidEntry(current, entry.entryId));
          return;
        }

        current.claimedPacksByEntryId[entry.entryId] = {
          claimEntryId: entry.entryId,
          claimId: `claim:${entry.entryId}`,
          claimedAt: String(input.claimedAt || entry.authoredAt || now()),
          artifact: input.artifact,
          verification: input.verification || null,
        };
        current.ledgerHealth.lastEntryId = entry.entryId;
        ctx.setState(await recomputeState(current, getCatalogs()));
        return;
      }

      if (entry.kind === PIXPAX_COMMAND_RECORD_PACK_OPENED) {
        const input = assertValidRecordPackOpenedCommandInput(
          entry.payload.data as unknown as PixbookRecordPackOpenedCommandInput,
        );
        const claim = current.claimedPacksByEntryId[input.claimEntryId];
        if (!claim || claim.artifact.payload.packId !== input.packId) {
          ctx.setState(appendInvalidEntry(current, entry.entryId));
          return;
        }

        current.openedPacksByClaimEntryId[input.claimEntryId] = {
          openEntryId: entry.entryId,
          claimEntryId: input.claimEntryId,
          packId: input.packId,
          openedAt: String(input.openedAt || entry.authoredAt || now()),
        };
        current.ledgerHealth.lastEntryId = entry.entryId;
        ctx.setState(await recomputeState(current, getCatalogs()));
        return;
      }

      if (entry.kind === PIXPAX_COMMAND_RECORD_TRANSFER) {
        const input = await assertValidRecordTransferCommandInput(
          entry.payload.data as unknown as PixbookRecordTransferCommandInput,
        );
        const transferId = input.offerArtifact.payload.transferId;
        const direction = input.direction;

        if (!direction) {
          ctx.setState(appendInvalidEntry(current, entry.entryId));
          return;
        }
        if (
          Object.values(current.transfersByEntryId).some(
            (transfer) => transfer.transferId === transferId,
          )
        ) {
          ctx.setState(appendInvalidEntry(current, entry.entryId));
          return;
        }
        if (
          direction === "outgoing" &&
          !current.ownedCardInstancesById[input.offerArtifact.payload.cardInstanceId]
        ) {
          ctx.setState(appendInvalidEntry(current, entry.entryId));
          return;
        }

        current.transfersByEntryId[entry.entryId] = {
          transferEntryId: entry.entryId,
          transferId,
          recordedAt: String(input.recordedAt || entry.authoredAt || now()),
          direction,
          offerArtifact: input.offerArtifact,
          acceptanceArtifact: input.acceptanceArtifact,
        };
        current.ledgerHealth.lastEntryId = entry.entryId;
        ctx.setState(await recomputeState(current, getCatalogs()));
        return;
      }

      if (entry.kind === PIXPAX_COMMAND_SET_DISPLAY_PROFILE) {
        const input = assertValidSetDisplayProfileCommandInput(
          entry.payload.data as unknown as PixbookSetDisplayProfileCommandInput,
        );
        current.displayProfile = {
          displayName: String(input.displayName || "").trim(),
          avatarUrl: String(input.avatarUrl || "").trim(),
          updatedAt: String(input.updatedAt || entry.authoredAt || now()),
        };
        current.ledgerHealth.lastEntryId = entry.entryId;
        ctx.setState(current);
      }
    },
    selectors: {
      claimedPackCount(state) {
        return (state as PixbookReplayState).ledgerHealth.claimedPackCount;
      },
      openedPackCount(state) {
        return (state as PixbookReplayState).ledgerHealth.openedPackCount;
      },
    },
  };
}
