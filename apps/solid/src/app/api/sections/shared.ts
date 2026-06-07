import type { AppApi, AppIdentity } from "@/app/api/types";

export type AppApiSharedContext = {
  command: AppApi["command"];
  select: AppApi["select"];
  getPluginState: AppApi["getPluginState"];
  activeIdentity: () => AppIdentity | null;
};

export function resolveViewerIdentity(activeIdentity: AppIdentity | null): {
  viewerIdentityKey: string | null;
  viewerIdentityId: string | null;
} {
  return {
    viewerIdentityKey: activeIdentity?.identityKey ?? null,
    viewerIdentityId: activeIdentity?.identityId ?? null,
  };
}
