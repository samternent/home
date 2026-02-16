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
      return {
        reusedResponse: null,
        events: [
          {
            type: "pack.claimed",
            payload: {
              packId: context.packId,
              collectionId: String(context.collectionId),
              collectionVersion: String(context.version),
              dropId,
              issuedTo: context.issuedTo,
              mode: "weekly",
            },
          },
        ],
      };
    },
  };
}

function createGiftCodePolicy(params) {
  const payload = params.overridePayload;
  if (!payload) {
    throw new IssuancePolicyError(400, { error: "Invalid override code." });
  }

  const dropId = String(payload.dropId || "").trim();
  if (params.requestedDropId && params.requestedDropId !== dropId) {
    throw new IssuancePolicyError(400, { error: "dropId does not match override code." });
  }

  const count = Number(payload.count);
  if (!Number.isInteger(count) || count < 1 || count > 50) {
    throw new IssuancePolicyError(400, {
      error: "count must be an integer between 1 and 50.",
    });
  }

  return {
    name: "GiftCodePolicy",
    kind: "giftcode",
    mode: "override-code",
    dropId,
    count,
    override: true,
    untracked: false,
    requiresAdmin: false,
    codeId: String(payload.codeId || ""),
    bindToUser: payload.bindToUser ?? null,
    async beforeIssue(context) {
      if (
        String(payload.collectionId) !== String(context.collectionId) ||
        String(payload.version) !== String(context.version)
      ) {
        throw new IssuancePolicyError(403, {
          error: "Override code scope does not match collection/version.",
        });
      }
      if (payload.bindToUser && String(payload.issuedTo) !== context.issuedTo) {
        throw new IssuancePolicyError(403, {
          error: "Override code is not valid for this user.",
        });
      }
      try {
        const existingUse = await context.store.getOverrideCodeUse(
          context.collectionId,
          context.version,
          payload.codeId
        );
        if (existingUse) {
          throw new IssuancePolicyError(409, {
            error: "Override code has already been used.",
            codeId: payload.codeId,
            usedAt: existingUse.usedAt || null,
            packId: existingUse.packId || null,
          });
        }
      } catch (error) {
        if (error instanceof IssuancePolicyError) throw error;
        if (!isNoSuchKeyError(error)) throw error;
      }
      return { reusedResponse: null };
    },
    async afterIssue(context) {
      const codeUseResult = await context.store.putOverrideCodeUseIfAbsent(
        context.collectionId,
        context.version,
        payload.codeId,
        {
          usedAt: context.issuedAt,
          packId: context.packId,
          dropId,
          issuedTo: context.issuedTo,
          count: context.cardsCount,
        }
      );
      if (!codeUseResult.created) {
        const existingUse = await context.store.getOverrideCodeUse(
          context.collectionId,
          context.version,
          payload.codeId
        );
        throw new IssuancePolicyError(409, {
          error: "Override code has already been used.",
          codeId: payload.codeId,
          usedAt: existingUse?.usedAt || null,
          packId: existingUse?.packId || null,
        });
      }
      return {
        reusedResponse: null,
        events: [
          {
            type: "giftcode.redeemed",
            payload: {
              codeId: String(payload.codeId),
              packId: context.packId,
              collectionId: String(context.collectionId),
              version: String(context.version),
              issuedTo: context.issuedTo,
              dropId,
            },
          },
        ],
      };
    },
  };
}

export function resolveIssuancePolicy(params) {
  if (params.wantsOverride && params.overrideCodeRaw) {
    throw new IssuancePolicyError(400, {
      error: "Provide either override=true or overrideCode, not both.",
    });
  }
  if (params.wantsDevUntrackedPack && (params.wantsOverride || params.overrideCodeRaw)) {
    throw new IssuancePolicyError(400, {
      error: "dev-untracked issuance cannot be combined with override flags.",
    });
  }

  if (params.overridePayload) {
    return createGiftCodePolicy(params);
  }
  if (params.wantsOverride || params.wantsDevUntrackedPack) {
    return createCuratedRandomPolicy(params);
  }
  return createWeeklyDeterministicPolicy(params);
}
