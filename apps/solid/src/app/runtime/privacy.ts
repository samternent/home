import type { LedgerAppendInput } from "@ternent/ledger";
import { deriveAgeRecipient } from "@ternent/identity";
import {
  hasActivePermissionMembership,
  hasHistoricalPermissionGrant,
  type PermissionRecord,
  type PermissionsState,
} from "@/app/plugins/permissions";
import { identityKeyToPublicKeyBytes } from "@/app/plugins/identityKey";

export type RuntimeAudienceType = "everyone" | "user" | "permission";

export type RuntimeAudienceSelector = {
  audienceType: RuntimeAudienceType;
  audienceId: string | null;
};

export type RuntimeAudienceActor = {
  identityKey: string;
};

export type RuntimePrivacyService = {
  resolveProtection(
    audience: RuntimeAudienceSelector,
    state: PermissionsState,
  ): Promise<LedgerAppendInput["protection"]>;
  canReadAudience(
    audience: RuntimeAudienceSelector,
    actor: RuntimeAudienceActor,
    state: PermissionsState,
  ): boolean;
  canWriteAudience(
    audience: RuntimeAudienceSelector,
    actor: RuntimeAudienceActor,
    state: PermissionsState,
  ): boolean;
  listReadableAudiences(
    state: PermissionsState,
    viewerIdentityKey: string | null | undefined,
    viewerIdentityId?: string | null | undefined,
  ): PermissionRecord[];
  getReplayDecryptionKeys(state: PermissionsState): string[];
};

async function deriveAgeRecipientFromIdentityKey(identityKey: string): Promise<string> {
  const publicKeyBytes = identityKeyToPublicKeyBytes(identityKey);
  return await deriveAgeRecipient(publicKeyBytes);
}

async function resolveIdentityRecipients(identityKeys: string[]): Promise<string[]> {
  const recipients = new Set<string>();

  for (const identityKey of identityKeys) {
    recipients.add(await deriveAgeRecipientFromIdentityKey(identityKey));
  }

  return [...recipients];
}

function resolveViewerCandidates(
  viewerIdentityKey: string | null | undefined,
  viewerIdentityId: string | null | undefined,
): Set<string> {
  const candidates = new Set<string>();

  if (typeof viewerIdentityKey === "string" && viewerIdentityKey.trim()) {
    candidates.add(viewerIdentityKey.trim());
  }

  if (typeof viewerIdentityId === "string" && viewerIdentityId.trim()) {
    const identityId = viewerIdentityId.trim();
    candidates.add(identityId);
    candidates.add(`did:key:${identityId}`);
  }

  return candidates;
}

export function createRuntimePrivacyService(): RuntimePrivacyService {
  return {
    async resolveProtection(audience, state) {
      if (audience.audienceType === "everyone") {
        return {
          type: "none",
        };
      }

      if (audience.audienceType === "user") {
        if (!audience.audienceId) {
          throw new Error("User audience id is required.");
        }

        const recipients = await resolveIdentityRecipients([audience.audienceId]);
        return {
          type: "recipients",
          recipients,
          encoding: "armor",
        };
      }

      if (!audience.audienceId) {
        throw new Error("Permission audience id is required.");
      }

      const permission = state.byId[audience.audienceId];
      if (!permission) {
        throw new Error("Permission does not exist.");
      }

      if (permission.publicKey) {
        return {
          type: "recipients",
          recipients: [permission.publicKey],
          encoding: "armor",
        };
      }

      const activeMemberIds = Object.keys(
        state.activeMemberIdsByPermissionId[audience.audienceId] ?? {},
      );
      if (activeMemberIds.length === 0) {
        throw new Error("Permission does not have writable members.");
      }

      const recipients = await resolveIdentityRecipients(activeMemberIds);
      return {
        type: "recipients",
        recipients,
        encoding: "armor",
      };
    },
    canReadAudience(audience, actor, state) {
      if (audience.audienceType === "everyone") {
        return true;
      }

      if (audience.audienceType === "user") {
        return Boolean(audience.audienceId && audience.audienceId === actor.identityKey);
      }

      if (!audience.audienceId) {
        return false;
      }

      return Boolean(state.localGroupPrivateKeysByPermissionId[audience.audienceId]);
    },
    canWriteAudience(audience, actor, state) {
      if (audience.audienceType === "everyone") {
        return true;
      }

      if (audience.audienceType === "user") {
        return Boolean(audience.audienceId && audience.audienceId === actor.identityKey);
      }

      if (!audience.audienceId) {
        return false;
      }

      return hasActivePermissionMembership(state, audience.audienceId, actor.identityKey);
    },
    listReadableAudiences(state, viewerIdentityKey, viewerIdentityId) {
      const candidates = resolveViewerCandidates(viewerIdentityKey, viewerIdentityId);
      if (candidates.size === 0) {
        return [];
      }

      return state.order
        .map((permissionId) => state.byId[permissionId])
        .filter((record): record is NonNullable<typeof record> => Boolean(record))
        .map((record) => {
          let viewerIdentityCandidate: string | null = null;
          for (const candidate of candidates) {
            if (
              hasActivePermissionMembership(state, record.id, candidate) &&
              hasHistoricalPermissionGrant(state, record.id, candidate)
            ) {
              viewerIdentityCandidate = candidate;
              break;
            }
          }

          if (!viewerIdentityCandidate) {
            return null;
          }

          const viewerGrantId =
            state.latestGrantIdByPermissionAndIdentity[record.id]?.[viewerIdentityCandidate] ?? null;
          const viewerHasKey = Boolean(
            viewerGrantId && state.localGroupPrivateKeysByPermissionId[record.id],
          );

          if (
            !viewerHasKey ||
            !viewerGrantId ||
            !record.title ||
            !record.updatedAt ||
            !record.createdBy
          ) {
            return null;
          }

          return {
            id: record.id,
            publicKey: record.publicKey,
            createdAt: record.createdAt,
            title: record.title,
            scope: record.scope,
            createdBy: record.createdBy,
            members: record.members.map((member) => ({ ...member })),
            updatedAt: record.updatedAt,
            grantCount: state.grantsByPermissionId[record.id]?.length ?? 0,
            viewerHasKey: true,
            viewerGrantId,
          } satisfies PermissionRecord;
        })
        .filter((record): record is PermissionRecord => Boolean(record));
    },
    getReplayDecryptionKeys(state) {
      return Object.values(state.localGroupPrivateKeysByPermissionId).filter(
        (value): value is string => typeof value === "string" && value.length > 0,
      );
    },
  };
}
