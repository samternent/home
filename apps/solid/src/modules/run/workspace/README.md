# Workspace Layer

Purpose:

- orchestrate mounts, selection, open contexts, active surfaces, and session-aware runtime state

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

- current workspace context
- selected resource and scope
- active app contexts and tabs
- mounted source inventory
- shell-level state shared by all surfaces

Do not own here:

- low-level Solid client details
- schema reducer internals
- domain app presentation
