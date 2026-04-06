# run.ternent.dev Spec

Status: `apps/solid` is the current implementation home, but this app is being shaped toward `run.ternent.dev`.

## References

- Product direction: `/Users/sam/dev/samternent/agent-os/local/projects/run.ternent.dev.md`
- Concord architecture: `/Users/sam/dev/samternent/agent-os/local/projects/concord.md`
- Current app: `/Users/sam/dev/samternent/home/apps/solid`

## Product Statement

`run.ternent.dev` is a workspace runtime for mounted ledger-backed resources.

It is not a desktop skin and not a file browser with a terminal bolted on.

It is a Concord-aligned runtime where:

- storage providers expose mounts and resources
- ledgers remain the source of truth
- replay produces usable state
- schemas define meaning
- the workspace orchestrates context
- shared services expose and explain history, trust, and comparison
- explorer, terminal, and hosted apps are different interfaces over the same workspace state

## Core Principle

- All mutations happen via commands.
- All state is derived via replay.
- All interfaces operate on the same workspace state.
- All Concord history is verified against identity. Unverified history is not valid runtime input.

## Architectural North Star

Given mounted resources and signed history, the system can deterministically rebuild projections, explain how they were derived, and let multiple surfaces act on the same workspace context without duplicating truth.

This follows the Concord rule:

> Given signed history, I can deterministically rebuild any projection I need.

## Current Branch Review

### What is already useful

- Solid session and Pod-root discovery are real.
- The current `run/workspace` source already knows how to browse Solid-managed workspace roots and restore a verified identity.
- The emerging `run/hosted-apps` layer proves hosted Concord apps can be isolated behind runtime contracts instead of route-local wiring.
- Sharing, people, and identity/account flows exist as real platform concerns above the app.

### What is currently off-track

- The branch still mixes two product stories:
  - a Finder/Terminal visual mock
  - a Library/Open/Sharing/People/Account runtime shell
- Route and test drift shows that the shell structure changed faster than the route tree.
- Explorer, terminal, and service layers are still mostly placeholders, so the runtime contracts are ahead of the real interfaces.
- Hosted apps are still loaded too directly from one ledger at a time. The workspace can hold many ledgers, but explorer, terminal, switching, and host contracts are not yet first-class runtime concepts.
- Some system services are present only as UI placeholders rather than stable runtime contracts.

### What should be preserved

- Solid as one storage and mounting plugin, not the required substrate
- Concord as the replay and command runtime
- ternent-ui as the only UI component system
- the current sharing/people/account work as system-level services, not app features
- the command-in / replay-out hosted app contract, but without carrying forward premature product slices

## Core Vocabulary

- Resource: any addressable thing in the workspace
- Mount: a source of resources, such as a Solid Pod root or exported bundle
- Storage provider: a plugin that can expose mounts and optional browse/read/write capabilities
- Ledger: append-only signed history
- Commit: a single signed ledger event
- Projection: deterministic replay output over one or more ledgers
- Schema package: typed command and replay contract
- Plugin package: installable unit that contributes schemas, apps, inspectors, or commands
- Workspace: mounted environment containing resources, projections, services, and surfaces
- Surface: interaction layer such as explorer or terminal
- Hosted app: domain UI over workspace projections that emits commands instead of mutating truth

## Canonical Runtime Types

These are the minimum shared shapes the runtime should converge on. Layer-specific modules may extend them, but they must not invent incompatible parallel versions.

```ts
type ResourceType =
  | "ledger"
  | "file"
  | "attachment"
  | "schema"
  | "plugin";

type Capability =
  | "open"
  | "edit"
  | "compare"
  | "verify"
  | "replay"
  | "inspect";

type TrustPolicy = {
  allowUnverified: false;
  allowedAuthors?: string[];
  revokedAuthors?: string[];
};

type ReplayFilter = {
  authors?: string[];
  commitKinds?: string[];
  timeline?: {
    fromCommitId?: string;
    toCommitId?: string;
    fromTimestamp?: string;
    toTimestamp?: string;
  };
  trustPolicy: TrustPolicy;
};

type VerificationSummary = {
  verifiedCommitIds: string[];
  unverifiedCommitIds: string[];
  revokedAuthorIds: string[];
};

type Mount = {
  id: string;
  kind: "solid-pod" | "local-export" | "shared-ledger";
  label: string;
  rootUrl: string;
  writable: boolean;
};

type ResourceRef = {
  id: string;
  mountId: string;
  type: ResourceType;
  url: string;
  path: string;
};

type LedgerResource = ResourceRef & {
  type: "ledger";
  ledgerId: string;
  schemaIds: string[];
};

type FileResource = ResourceRef & {
  type: "file";
  contentType: string | null;
};

type AttachmentResource = ResourceRef & {
  type: "attachment";
  contentType: string | null;
};

type SchemaResource = ResourceRef & {
  type: "schema";
  schemaId: string;
  version: string;
};

type PluginResource = ResourceRef & {
  type: "plugin";
  pluginId: string;
  version: string;
};

type Resource =
  | LedgerResource
  | FileResource
  | AttachmentResource
  | SchemaResource
  | PluginResource;

type AppManifest = {
  id: string;
  label: string;
  supports: {
    schemaIds?: string[];
    resourceTypes?: ResourceType[];
    capabilities: Capability[];
  };
};

type Projection<TState = unknown> = {
  id: string;
  inputs: {
    ledgerIds: string[];
    schemaIds: string[];
    filters: ReplayFilter;
    mergePolicy: "single" | "append" | "schema-defined";
  };
  state: TState;
  meta: {
    includedCommitIds: string[];
    excludedCommitIds: string[];
    verification: VerificationSummary;
  };
};

type WorkspaceContext = {
  id: string;
  appId: string;
  resourceIds: string[];
  projectionId: string;
  capabilities: Capability[];
};

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
    history: {
      activeProjectionId: string | null;
    };
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

## State Model Rules

- `WorkspaceState` is the canonical shared runtime state.
- Surfaces read from it through workspace and service APIs.
- Hosted apps consume projection state and emit commands.
- Storage, replay, and schema layers may maintain internal implementation state, but they must project into the canonical runtime shapes above.
- New features should extend these types rather than inventing parallel state containers.
- Phase 1 supports many verified ledgers in one workspace, but only one active projection at a time. `activeLedgerIds` stay plural because selection and switching are core from the start.
- Storage providers are optional. Workspace state must still be valid when no provider is connected.

## Layered Runtime Model

### 1. Storage layer

Responsibilities:

- provider registration and connection
- mount discovery
- resource addressing
- path and handle abstractions
- attachment access
- local cache and remote sync boundaries

Must not know:

- app semantics
- replay rules
- surface layout

Primary outputs:

- connected storage providers
- `Mount[]`
- `Resource[]`
- addressable `ResourceRef`

Initial implementation home:

- `src/modules/run/storage`

Correction:

- Solid is a storage provider implementation, not the storage layer itself

### 2. Ledger layer

Responsibilities:

- commit identity
- author identity and verification status
- ledger metadata
- history inspection
- trust and integrity reporting

Phase 1 rule:

- only verified commits participate in runtime replay
- Concord identity is required for commit validity
- Solid login provisions the Concord identity used for verification and signing

Must not know:

- UI routes
- domain reducers
- app layout

Primary outputs:

- normalized ledger descriptors
- normalized commit descriptors
- verification summaries consumed by replay and services

Initial implementation home:

- `src/modules/run/ledger`

### 3. Replay layer

Responsibilities:

- active-ledger replay
- future multi-ledger composition
- filtered replay by author, commit kind, trust policy, and timeline cursor
- compare and diff projections
- projection selectors and derived views

Canonical contract:

Inputs:

- ledger ids
- schema ids
- replay filters
- merge policy

Outputs:

- `Projection<TState>`
- included and excluded commit metadata
- verification summary for the projection

Phase 1 focus:

- support switching across many verified ledgers in one workspace
- keep one active projection at a time
- treat multi-ledger composition as a later feature, not an active delivery target
- keep the contract extensible so multi-ledger composition can land without redefining projection shapes

Must not know:

- surface-specific widgets
- Solid session details

Initial implementation home:

- `src/modules/run/replay`

### 4. Schema and command layer

Responsibilities:

- command definitions
- schema manifests
- reducer and projector registration
- migration and compatibility metadata
- app capability declarations

Phase 1 decision:

- plugin packages contain schemas

Phase 1 plugin package shape:

- schemas
- apps
- commands
- inspectors

Rationale:

- one install surface
- simpler developer model
- less early platform indirection

Future option:

- split schemas from plugins later if install and compatibility needs force the distinction

Must not know:

- mount details
- route state

Initial implementation home:

- `src/modules/run/schema`

### 5. Workspace orchestration layer

Responsibilities:

- session-aware runtime boot
- mount selection
- active resource selection
- canonical `WorkspaceState`
- open contexts and tabs
- installed capabilities
- workspace routing state
- shared context for all surfaces

Initial implementation home:

- `src/modules/run/workspace`

### 6. Shared system services

Responsibilities:

- history feed
- commit inspector
- verification state
- replay controls
- compare/diff inspector
- open-with capability resolution
- member and permission services

Service rule:

- services operate over canonical workspace state and projection outputs
- services do not define independent truth models
- verification is mandatory, not optional

Initial implementation home:

- `src/modules/run/services`

### 7. Surfaces

Library responsibilities:

- discover what is here
- show what can open it
- expose metadata and verification state
- pivot between scopes, mounts, and recent work

Terminal responsibilities:

- precise replay and verification operations
- workspace-native commands
- power-user control and automation

Surface rule:

- surfaces must not mutate state directly
- all mutations happen through commands
- surfaces must consume provider capabilities rather than assuming Solid exists

Terminal contract:

```ts
type Command = {
  name: string;
  args: string[];
  execute(ctx: WorkspaceState): CommandResult | Promise<CommandResult>;
};

type CommandResult = {
  output: string[];
  projectionId?: string;
  resourceIds?: string[];
};
```

Initial command groups:

- navigation
- workspace
- ledger
- replay
- verify
- compare
- plugin
- app

Phase 1 focus:

- terminal operations should target inspection, verification, replay, and command execution for a single active ledger context
- terminal core commands should work without any storage provider connected

Initial implementation home:

- `src/modules/run/surfaces`

### 8. Hosted apps

Responsibilities:

- declare supported schemas and resources
- read workspace projections
- emit commands
- present domain-specific UI

Must not own:

- truth
- storage access policy
- verification logic
- generic history UI

Hosted app contract:

- declare supported schemas, resource types, and capabilities through `AppManifest`
- read `Projection<TState>` plus workspace services
- emit commands instead of mutating shared state directly

Initial implementation home:

- `src/modules/run/hosted-apps`

## Proposed Code Structure

```text
apps/solid/src/
  modules/
    run/
      core/                   # initial workspace runtime assembly
      storage/                # mount discovery, handles, adapters
      ledger/                 # commit models, verification views, history access
      replay/                 # projection engine, selectors, compare modes
      schema/                 # schema packages, manifests, compatibility registry
      workspace/              # orchestration, routing context, open contexts
      services/               # history, audit, verify, open-with, compare
      surfaces/               # explorer and terminal surfaces
      hosted-apps/            # app registry, app contracts, app feature slices
  routes/
    app/
      RouteApp.vue
```

## Route Model

Canonical route model for this phase:

- `/`
- `/app` → redirect to `/`
- `/auth/redirect`

The root route is the auth and core-runtime entrypoint.
Legacy shell surfaces are intentionally removed from the active route model until the runtime contracts are stable.

## Runtime Data Flow

### Open a ledger in a hosted app

1. Storage resolves the mounted resource.
2. Workspace identifies the selected resource and its scope.
3. Schema/app registry resolves compatible hosted apps.
4. Hosted app requests one or more replay plugins.
5. Replay produces a `Projection<TState>`.
6. Shared services expose history, verification, and compare state beside the app.
7. App emits commands back through Concord.

Phase 1 note:

- this flow assumes one active verified projection
- the workspace may discover and switch between many ledgers
- compare and multi-ledger composition stay out of the critical path until switching and host contracts feel complete

### Multi-ledger compare

1. Workspace selects more than one ledger source.
2. Replay creates a composed projection with a declared merge policy.
3. Trust policy and identity filters are applied before projection output is surfaced.
4. Services expose:
   - included and excluded commits
   - verification status
   - projection diff
   - filtered author timeline

Status:

- deferred until after ledger switching, explorer, terminal, and host contracts are solid

## UI Rules

- All UI uses `ternent-ui` primitives and patterns.
- Route components stay thin and compose workspace modules.
- Generic system UI explains ledger truth.
- Hosted app UI explains domain meaning.
- Surface chrome is shared and stable across explorer, terminal, and hosted apps.
- Surfaces never mutate truth directly.

## Delivery Plan

### Phase 0: align the shell

- make `/` the canonical authenticated entry
- reduce the app to auth plus a minimal core-runtime surface
- stop treating Finder/Terminal or app-facing shell UI as the product core

### Phase 1: formalize the runtime boundaries

- create the `src/modules/run` structure
- move shared concepts into layer-owned modules
- keep the root route thin and push all runtime behavior into `run/*`

### Phase 2: harden the workspace model

- separate mounts/resources from ledgers/projections
- define workspace context, open contexts, and selection state explicitly
- promote capability resolution and open-with into shared services

### Phase 3: expand the core runtime

- materialize the core layer as the first real runtime assembly
- make `WorkspaceState` the real runtime contract
- move hosted app boot from direct storage wiring to active-projection wiring
- harden resource and ledger switching across the workspace
- harden mandatory verification and identity-driven history inspection
- remove Solid as a top-level runtime dependency by introducing storage provider contracts

### Phase 4: upgrade replay from active-projection host to workspace replay

- add replay scopes
- add timeline cursor
- add author and trust filters
- add compare and diff support for multi-ledger composition

### Phase 5: expand hosted app contracts

- add the first real hosted app only after explorer, terminal, and core workspace contracts are stable
- add app manifests and schema compatibility declarations
- ensure hosted apps consume services rather than rebuilding them

## Immediate Open Questions

- Should terminal commands be a product-native command grammar first, or a thin command layer over workspace services?
- Which system services must ship before the second hosted app is allowed to land?

## Definition Of Done For This Planning Slice

- the route model is coherent
- the target runtime layers exist in the tree
- each runtime layer has explicit ownership rules
- future implementation work can be delegated into those layers without re-deciding architecture
- the runtime can evolve inside `run/*` without reintroducing a monolithic shell module
- storage providers can be reasoned about as plugins rather than the runtime substrate
