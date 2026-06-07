import type { UserCreateInput, UserRecord } from "@/app/plugins";
import type { AppIdentity, AppUsersApi } from "@/app/api/types";
import type { AppApiSharedContext } from "./shared";

export type UsersApiContext = AppApiSharedContext & {
  requireActiveIdentity: (activeIdentity: AppIdentity | null) => AppIdentity;
};

export function createUsersApi(context: UsersApiContext): AppUsersApi {
  return {
    create(input: Omit<UserCreateInput, "actorIdentityKey">) {
      const actor = context.requireActiveIdentity(context.activeIdentity());
      return context.command("user.create", {
        ...input,
        actorIdentityKey: actor.identityKey,
      } satisfies UserCreateInput);
    },
    all() {
      return context.select<UserRecord[]>("users", "all");
    },
    byIdentityKey(identityKey: string) {
      return context.select<UserRecord | null>("users", "byIdentityKey", identityKey);
    },
  };
}
