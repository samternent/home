import type { ConcordState } from "@ternent/concord";
import type { PermissionActorInput, PermissionRecord, ProfileRecord, UserRecord } from "@/app/plugins";
import { toDidKeyFromPublicKey } from "@/app/plugins/identityKey";
import type { AppIdentity } from "@/app/api/types";
import type { AppProjectionPlugin, AppRuntime } from "@/app/runtime";

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createInitialState(plugins: AppProjectionPlugin[]): ConcordState {
  return {
    ready: false,
    integrityValid: false,
    stagedCount: 0,
    replay: Object.fromEntries(
      plugins.map((plugin) => [plugin.plugin.id, plugin.plugin.initialState?.()]),
    ),
    verification: null,
  };
}

export function requireSelector(
  plugins: AppProjectionPlugin[],
  pluginId: string,
  selectorId: string,
) {
  const plugin = plugins.find((candidate) => candidate.plugin.id === pluginId);
  if (!plugin) {
    throw new Error(`Unknown plugin id '${pluginId}'.`);
  }

  const selector = plugin.selectors?.[selectorId];
  if (!selector) {
    throw new Error(`Unknown selector '${selectorId}' for plugin '${pluginId}'.`);
  }

  return selector;
}

export function buildPermissionActor(activeIdentity: AppIdentity | null): PermissionActorInput {
  if (!activeIdentity) {
    throw new Error("Active identity is required.");
  }

  return {
    memberId: activeIdentity.identityKey,
    memberLabel: activeIdentity.label,
  };
}

export function requireActiveIdentity(activeIdentity: AppIdentity | null): AppIdentity {
  if (!activeIdentity) {
    throw new Error("Active identity is required.");
  }

  return activeIdentity;
}

export function requireProjectedUser(
  lookup: (identityKey: string) => UserRecord | null,
  identityKey: string,
): UserRecord {
  const user = lookup(identityKey);
  if (!user) {
    throw new Error(
      `User '${identityKey}' is not available in users projection. Add it from the users area first.`,
    );
  }

  return user;
}

export function toAppIdentity(input: {
  identityId: string;
  label: string;
  publicKey: string;
}): AppIdentity {
  return {
    identityId: input.identityId,
    identityKey: toDidKeyFromPublicKey(input.publicKey),
    label: input.label,
  };
}

function isFreshLedger(resolvedRuntime: AppRuntime): boolean {
  const users = resolvedRuntime.select<UserRecord[]>("users", "all");
  const profiles = resolvedRuntime.select<ProfileRecord[]>("profiles", "all");
  const permissions = resolvedRuntime.select<PermissionRecord[]>("permissions", "all");
  const snapshot = resolvedRuntime.getState();

  return (
    snapshot.stagedCount === 0 &&
    users.length === 0 &&
    profiles.length === 0 &&
    permissions.length === 0
  );
}

export async function ensureCreatorUserBootstrap(
  resolvedRuntime: AppRuntime,
  currentIdentity: AppIdentity | null,
): Promise<void> {
  if (!currentIdentity || !isFreshLedger(resolvedRuntime)) {
    return;
  }

  await resolvedRuntime.commandWithReplay("user.create", {
    identityKey: currentIdentity.identityKey,
    actorIdentityKey: currentIdentity.identityKey,
  });
  await resolvedRuntime.commitWithReplay({
    metadata: {
      message: "Bootstrap creator user",
    },
  });
}
