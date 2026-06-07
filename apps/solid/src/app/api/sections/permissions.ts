import type {
  PermissionActorInput,
  PermissionCreateInput,
  PermissionGrantInput,
  PermissionRecord,
  PermissionRevokeInput,
  ProfileRecord,
  UserRecord,
} from "@/app/plugins";
import type { AppIdentity, AppPermissionsApi } from "@/app/api/types";
import type { AppApiSharedContext } from "./shared";
import { resolveViewerIdentity } from "./shared";

export type PermissionsApiContext = AppApiSharedContext & {
  requireActiveIdentity: (activeIdentity: AppIdentity | null) => AppIdentity;
  buildPermissionActor: (activeIdentity: AppIdentity | null) => PermissionActorInput;
  requireProjectedUser: (
    lookup: (identityKey: string) => UserRecord | null,
    identityKey: string,
  ) => UserRecord;
};

export function createPermissionsApi(context: PermissionsApiContext): AppPermissionsApi {
  return {
    create(input: Omit<PermissionCreateInput, "actor">) {
      const actor = context.buildPermissionActor(context.activeIdentity());
      return context.command("permission.create", {
        ...input,
        actor,
      } satisfies PermissionCreateInput);
    },
    createGroup(input: Omit<PermissionCreateInput, "actor">) {
      const actor = context.buildPermissionActor(context.activeIdentity());
      return context.command("permission.group.create", {
        ...input,
        actor,
      } satisfies PermissionCreateInput);
    },
    grant(input: Omit<PermissionGrantInput, "actor">) {
      const actor = context.buildPermissionActor(context.activeIdentity());
      const projectedUser = context.requireProjectedUser(
        (identityKey) => context.select<UserRecord | null>("users", "byIdentityKey", identityKey),
        input.memberId,
      );
      return context.command("permission.grant", {
        ...input,
        memberLabel: projectedUser.label ?? null,
        actor,
      } satisfies PermissionGrantInput);
    },
    issueGrant(input: Omit<PermissionGrantInput, "actor">) {
      const actor = context.buildPermissionActor(context.activeIdentity());
      const projectedUser = context.requireProjectedUser(
        (identityKey) => context.select<UserRecord | null>("users", "byIdentityKey", identityKey),
        input.memberId,
      );
      return context.command("permission.grant.issue", {
        ...input,
        memberLabel: projectedUser.label ?? null,
        actor,
      } satisfies PermissionGrantInput);
    },
    grantFromUser(input: { permissionId: string; identityKey: string }) {
      const active = context.requireActiveIdentity(context.activeIdentity());
      const actor = context.buildPermissionActor(context.activeIdentity());
      const projectedUser = context.requireProjectedUser(
        (identityKey) => context.select<UserRecord | null>("users", "byIdentityKey", identityKey),
        input.identityKey,
      );
      const { viewerIdentityKey, viewerIdentityId } = resolveViewerIdentity(context.activeIdentity());
      const permission = context.select<PermissionRecord | null>(
        "permissions",
        "byId",
        input.permissionId,
        viewerIdentityKey,
        viewerIdentityId,
      );
      if (permission) {
        const alreadyAssigned = permission.members.some((member) => {
          if (member.memberId === projectedUser.identityKey) {
            return true;
          }
          if (projectedUser.identityKey === active.identityKey && member.memberId === active.identityId) {
            // Backward-compat for older permissions that stored actor by keyId.
            return true;
          }
          return false;
        });
        if (alreadyAssigned) {
          throw new Error("User already assigned to this permission.");
        }
      }

      const profile = context.select<ProfileRecord | null>(
        "profiles",
        "byIdentityKey",
        projectedUser.identityKey,
      );
      const resolvedMemberLabel = profile?.displayName ?? projectedUser.label ?? null;

      return context.command("permission.grant.issue", {
        permissionId: input.permissionId,
        memberId: projectedUser.identityKey,
        memberLabel: resolvedMemberLabel,
        actor,
      } satisfies PermissionGrantInput);
    },
    revoke(input: Omit<PermissionRevokeInput, "actor">) {
      const actor = context.buildPermissionActor(context.activeIdentity());
      return context.command("permission.revoke", {
        ...input,
        actor,
      } satisfies PermissionRevokeInput);
    },
    all() {
      const { viewerIdentityKey, viewerIdentityId } = resolveViewerIdentity(context.activeIdentity());
      return context.select<PermissionRecord[]>(
        "permissions",
        "all",
        viewerIdentityKey,
        viewerIdentityId,
      );
    },
    byId(permissionId: string) {
      const { viewerIdentityKey, viewerIdentityId } = resolveViewerIdentity(context.activeIdentity());
      return context.select<PermissionRecord | null>(
        "permissions",
        "byId",
        permissionId,
        viewerIdentityKey,
        viewerIdentityId,
      );
    },
  };
}
