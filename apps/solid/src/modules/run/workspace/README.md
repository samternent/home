# Workspace Layer

Purpose:

- orchestrate providers, mounts, selection, open contexts, active surfaces, and runtime state

Canonical output:

```ts
type WorkspaceState = {
  session: {
    webId: string | null;
    concordIdentityId: string | null;
    selectedPodUrl: string | null;
    status: "anonymous" | "restoring" | "ready" | "error";
  };
  mounts: Mount[];
  resources: Record<string, Resource>;
  selection: {
    activeResourceId: string | null;
    activeLedgerIds: string[];
    activeMountId: string | null;
  };
  projections: Record<string, Projection>;
  openContexts: WorkspaceContext[];
  services: {
    history: { activeProjectionId: string | null };
    verification: {
      activeProjectionId: string | null;
      trustPolicy: TrustPolicy;
    };
    compare: {
      leftProjectionId: string | null;
      rightProjectionId: string | null;
    };
  };
};
```

Own here:

- provider registration and connection orchestration
- active mount inventory above providers
- provider-agnostic browse/selection state
- current workspace context
- selected resource and scope
- active app contexts and tabs
- mounted source inventory
- shell-level state shared by all surfaces
- provider and mount selection above specific provider implementations

Do not own here:

- low-level provider client details
- schema reducer internals
- domain app presentation

Current seam:

- `useRunProviderRegistry.ts`: registry of connected storage providers
- `useRunMountRegistry.ts`: browsable mount inventory across providers
- `useRunWorkspaceRuntime.ts`: provider-agnostic browse and selection runtime
- `useRunWorkspaceRuntime.ts#reset()`: hard reset seam used when the active identity changes
- `useRunWorkspaceSource.ts`: temporary Solid compatibility shim only
