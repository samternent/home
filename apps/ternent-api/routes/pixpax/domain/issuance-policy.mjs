export class IssuancePolicyError extends Error {
  constructor(statusCode, payload) {
    super(String(payload?.error || "Issuance policy rejected request."));
    this.name = "IssuancePolicyError";
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

function isNoSuchKeyError(error) {
  return String(error?.message || "").startsWith("NoSuchKey:");
}

function toIsoWeek(isoDate = new Date()) {
  const date = new Date(
    Date.UTC(isoDate.getUTCFullYear(), isoDate.getUTCMonth(), isoDate.getUTCDate())
  );
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function createCuratedRandomPolicy(params) {
  const isDevUntracked = params.wantsDevUntrackedPack === true;
  const dropId = isDevUntracked
    ? String(params.requestedDropId || `dev-${Date.parse(params.issuedAt)}`).trim()
    : String(params.requestedDropId || `week-${toIsoWeek(new Date(params.issuedAt))}`).trim();

  const count = params.wantsOverride
    ? params.clampPackCardCount(params.requestedCount)
    : params.defaultPackCount;

  if (!Number.isInteger(count) || count < 1 || count > 50) {
    throw new IssuancePolicyError(400, {
      error: "count must be an integer between 1 and 50.",
    });
  }

  if (isDevUntracked && !params.allowDevUntrackedPacks) {
    throw new IssuancePolicyError(403, {
      error: "Dev untracked pack issuance is disabled.",
    });
  }

  return {
    name: "CuratedRandomPolicy",
    kind: "curated-random",
    mode: isDevUntracked ? "dev-untracked" : "override",
    dropId,
    count,
    override: !isDevUntracked,
    untracked: isDevUntracked,
    requiresAdmin: !isDevUntracked,
    codeId: null,
    bindToUser: null,
    async beforeIssue() {
      return { reusedResponse: null };
    },
    async afterIssue() {
      return { reusedResponse: null, events: [] };
    },
  };
}

function createWeeklyDeterministicPolicy(params) {
  const dropId = String(params.requestedDropId || `week-${toIsoWeek(new Date(params.issuedAt))}`).trim();
  const count = params.defaultPackCount;

  return {
    name: "WeeklyDeterministicPolicy",
    kind: "weekly-deterministic",
    mode: "weekly",
    dropId,
    count,
    override: false,
    untracked: false,
    requiresAdmin: false,
    codeId: null,
    bindToUser: null,
    async beforeIssue(context) {
      try {
        const existingClaim = await context.store.getPackClaim(
          context.collectionId,
          context.version,
          dropId,
          context.issuedTo
        );
        if (existingClaim?.response) {
          return {
            reusedResponse: {
              ...existingClaim.response,
              issuance: {
                mode: "weekly",
                reused: true,
                override: false,
                dropId,
              },
            },
          };
        }
      } catch (error) {
        if (!isNoSuchKeyError(error)) throw error;
      }
      return { reusedResponse: null };
    },
    async afterIssue(context) {
      try {
        const existingClaim = await context.store.getPackClaim(
          context.collectionId,
          context.version,
          dropId,
          context.issuedTo
        );
        if (existingClaim?.response) {
          return {
            reusedResponse: {
              ...existingClaim.response,
              issuance: {
                mode: "weekly",
                reused: true,
                override: false,
                dropId,
              },
            },
            events: [],
          };
        }
      } catch (error) {
        if (!isNoSuchKeyError(error)) throw error;
      }

      await context.emitEvent("pack.claimed", {
        packId: context.packId,
        collectionId: String(context.collectionId),
        collectionVersion: String(context.version),
        dropId,
        issuedTo: context.issuedTo,
        mode: "weekly",
      });

      const claimResult = await context.store.putPackClaimIfAbsent(
        context.collectionId,
        context.version,
        dropId,
        context.issuedTo,
        {
          createdAt: context.issuedAt,
          response: context.responsePayload,
        }
      );
      if (!claimResult.created) {
        const existingClaim = await context.store.getPackClaim(
          context.collectionId,
          context.version,
          dropId,
          context.issuedTo
        );
        if (existingClaim?.response) {
          return {
            reusedResponse: {
              ...existingClaim.response,
              issuance: {
                mode: "weekly",
                reused: true,
                override: false,
                dropId,
              },
            },
            events: [],
          };
        }
      }
      return { reusedResponse: null, events: [] };
    },
  };
}

export function resolveIssuancePolicy(params) {
  if (params.wantsDevUntrackedPack && params.wantsOverride) {
    throw new IssuancePolicyError(400, {
      error: "dev-untracked issuance cannot be combined with override flags.",
    });
  }

  if (params.wantsOverride || params.wantsDevUntrackedPack) {
    return createCuratedRandomPolicy(params);
  }
  return createWeeklyDeterministicPolicy(params);
}
