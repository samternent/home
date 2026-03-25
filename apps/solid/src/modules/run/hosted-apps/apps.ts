import type { ConcordReplayPlugin } from "@ternent/concord";
import type { RunCoreProjectionState } from "@/modules/run/core";

export type RunHostedAppDefinition = {
  id: string;
  label: string;
  description: string;
  createPlugins(): ConcordReplayPlugin[];
  supportsProjection(projection: RunCoreProjectionState): {
    supported: boolean;
    reason: string | null;
    isDefault: boolean;
  };
};

const hostedApps: RunHostedAppDefinition[] = [];

export function getRunHostedApps(): RunHostedAppDefinition[] {
  return hostedApps;
}

export function getRunHostedApp(appId: string): RunHostedAppDefinition | null {
  return hostedApps.find((app) => app.id === appId) ?? null;
}

export function resolveRunHostedAppsForProjection(
  projection: RunCoreProjectionState | null | undefined,
): RunHostedAppDefinition[] {
  if (!projection || !projection.openContext) {
    return [];
  }

  return hostedApps.filter((app) => app.supportsProjection(projection).supported);
}

export function resolveDefaultRunHostedApp(
  projection: RunCoreProjectionState | null | undefined,
): RunHostedAppDefinition | null {
  const supportedApps = resolveRunHostedAppsForProjection(projection);

  return (
    supportedApps.find((app) => app.supportsProjection(projection!).isDefault) ??
    supportedApps[0] ??
    null
  );
}
