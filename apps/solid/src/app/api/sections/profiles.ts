import type { ProfileRecord, ProfileUpsertInput } from "@/app/plugins";
import type { AppIdentity, AppProfilesApi } from "@/app/api/types";
import type { AppApiSharedContext } from "./shared";

export type ProfilesApiContext = AppApiSharedContext & {
  requireActiveIdentity: (activeIdentity: AppIdentity | null) => AppIdentity;
};

export function createProfilesApi(context: ProfilesApiContext): AppProfilesApi {
  return {
    upsert(input: Omit<ProfileUpsertInput, "actorIdentityKey">) {
      const actor = context.requireActiveIdentity(context.activeIdentity());
      return context.command("profile.upsert", {
        ...input,
        actorIdentityKey: actor.identityKey,
      } satisfies ProfileUpsertInput);
    },
    all() {
      return context.select<ProfileRecord[]>("profiles", "all");
    },
    byIdentityKey(identityKey: string) {
      return context.select<ProfileRecord | null>("profiles", "byIdentityKey", identityKey);
    },
  };
}
