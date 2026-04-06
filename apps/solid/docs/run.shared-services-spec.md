# Shared Services Spec

Status: phase 1 runtime contract for `run.ternent.dev`, implemented inside `apps/solid`.

## Purpose

The shared services layer exists to explain and orchestrate runtime truth that is not owned by a specific surface or hosted app.

It sits above:

- storage discovery
- ledger access
- replay inputs and outputs
- workspace selection state

It sits below:

- explorer
- terminal
- hosted Concord apps
- route-level Vue components

Shared services are not UI helpers. They are workspace-aware runtime contracts that multiple interfaces consume in the same way.

## Core Rule

- services do not mutate storage directly
- services do not derive domain meaning
- services expose reusable runtime semantics over workspace state
- surfaces call services, not storage adapters
- hosted apps consume service outputs, not raw Solid paths

## Scope

Phase 1 services should own:

- workspace action semantics
- terminal command language
- verification summaries
- history inspection
- resource facts and explainers
- capability and open-with resolution

Phase 1 services should not own:

- route-local state
- design/system presentation logic
- schema-specific reducers
- app-specific workflows
- raw Solid session boot

## Service Model

Every shared service should follow the same shape:

```ts
type RunServiceStatus = "idle" | "ready" | "loading" | "error";

type RunServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

type RunWorkspaceService<TState, TActions> = {
  status: ComputedRef<RunServiceStatus>;
  state: ComputedRef<TState>;
  actions: TActions;
};
```

Rules:

- services expose explicit state and explicit actions
- services may compose other services
- services may read workspace, storage, ledger, and replay layers
- services must not hide their trust assumptions
- services must return enough metadata for explorer, terminal, and hosted apps to render the same truth

## Canonical Service Context

All shared services should conceptually operate on the same context:

```ts
type RunServiceContext = {
  workspace: WorkspaceState;
  activeProjectionId: string | null;
  activeResourceId: string | null;
  activeLedgerIds: string[];
  trustPolicy: TrustPolicy;
};
```

This does not need to be one literal singleton object yet, but all services should be expressible in terms of this context.

## Shared Services

### 1. Workspace Actions Service

Purpose:

- provide canonical mutation and navigation semantics over the workspace
- prevent surfaces from calling storage adapters directly

Current implementation home:

- `src/modules/run/services/useRunWorkspaceActions.ts`

Own here:

- scope switching
- navigate up
- navigate to container
- select resource
- create folder
- create ledger
- open hosted app
- close hosted app

Contract:

```ts
type RunWorkspaceActions = {
  navigateToScope(scope: SolidWorkspaceScope): Promise<void>;
  navigateUp(): Promise<RunServiceResult<{ url: string }>>;

  resolveTarget(target: string): Promise<SolidWorkspaceEntry | null>;

  navigateTarget(target: string): Promise<RunServiceResult<{ entry: SolidWorkspaceEntry }>>;
  navigateEntryByUrl(url: string): Promise<RunServiceResult<{ entry: SolidWorkspaceEntry }>>;

  selectTarget(target: string): Promise<RunServiceResult<{ entry: SolidWorkspaceEntry }>>;
  selectEntryByUrl(url: string): Promise<RunServiceResult<{ entry: SolidWorkspaceEntry }>>;

  openTarget(target: string): Promise<RunOpenEntryResult>;
  openEntryByUrl(url: string): Promise<RunOpenEntryResult>;

  createFolder(name: string): Promise<RunServiceResult<{ entry: SolidWorkspaceEntry }>>;
  createLedger(name: string): Promise<RunServiceResult<{ entry: SolidWorkspaceEntry }>>;

  openApp(appId?: string): Promise<
    RunServiceResult<{
      appId: string | null;
      ledgerId: string | null;
      projectionId: string | null;
    }>
  >;
  closeApp(): Promise<void>;
};
```

Rules:

- `navigate*` is for containers only
- `select*` is for files and ledgers only
- `open*` is a convenience contract used by terminal language and future open-with flows
- all commands that mutate workspace state should eventually pass through this service

### 2. Terminal Language Service

Purpose:

- define the runtime command language independently of terminal UI
- let `xterm.js`, plain input fields, and future agents all execute the same commands

Current implementation home:

- `src/modules/run/services/useRunTerminalLanguage.ts`

Own here:

- tokenization
- command grammar
- usage errors
- action dispatch
- command output chunks

Contract:

```ts
type RunTerminalLanguageChunk = {
  kind: "output" | "error";
  lines: string[];
};

type RunTerminalLanguageResult = {
  handled: boolean;
  clear: boolean;
  chunks: RunTerminalLanguageChunk[];
};

type RunTerminalLanguage = {
  execute(input: string): Promise<RunTerminalLanguageResult>;
};
```

Phase 1 command set:

- `help`
- `clear`
- `pwd`
- `ls`
- `mounts`
- `status`
- `cd`
- `open`
- `select`
- `mkdir`
- `mkledger`
- `app open`
- `app close`

Rules:

- command execution must go through shared services, not route-local handlers
- command output should be presentation-neutral
- command results should be useful to both humans and future agent callers

### 3. Verification Service

Purpose:

- expose runtime validity and trust explanations
- make strict verification visible and inspectable

Planned implementation home:

- `src/modules/run/services/useRunVerificationService.ts`

Own here:

- verification summaries per resource and projection
- trust policy exposure
- invalid/unverified reason reporting
- author validation summaries

Contract:

```ts
type RunVerificationFact = {
  label: string;
  value: string;
  severity: "info" | "warning" | "error";
};

type RunVerificationState = {
  trustPolicy: TrustPolicy;
  activeProjectionId: string | null;
  activeResourceId: string | null;
  status: RunVerificationStatus;
  summary: string;
  facts: RunVerificationFact[];
  includedCommitIds: string[];
  excludedCommitIds: string[];
  invalidAuthorIds: string[];
};

type RunVerificationService = RunWorkspaceService<
  RunVerificationState,
  {
    inspectProjection(projectionId: string): Promise<void>;
    inspectResource(resourceId: string): Promise<void>;
  }
>;
```

Phase 1 trust rules:

- verified-only
- Solid-authenticated Concord identity is required
- unverified commits are excluded from valid replay
- excluded commits must be explainable

### 4. History Service

Purpose:

- expose ordered history truth over the active resource or projection
- support explorer details, terminal inspection, and hosted-app explainers

Planned implementation home:

- `src/modules/run/services/useRunHistoryService.ts`

Own here:

- commit feed summaries
- projection provenance summaries
- commit inspection selection
- timeline cursors and pagination

Contract:

```ts
type RunHistoryEntry = {
  commitId: string;
  ledgerId: string;
  timestamp: string | null;
  authorId: string | null;
  verified: boolean;
  kind: string | null;
  summary: string;
};

type RunHistoryState = {
  activeProjectionId: string | null;
  activeResourceId: string | null;
  entries: RunHistoryEntry[];
  selectedCommitId: string | null;
};

type RunHistoryService = RunWorkspaceService<
  RunHistoryState,
  {
    inspectCommit(commitId: string): Promise<void>;
    clearSelection(): void;
  }
>;
```

Rules:

- history service explains commit truth, not domain meaning
- history entries should be compact and terminal-safe
- explorer and hosted apps may layer richer renderers on top

### 5. Capability Service

Purpose:

- resolve what operations and surfaces are valid for a resource or projection
- centralize open-with and app availability decisions

Planned implementation home:

- `src/modules/run/services/useRunCapabilityService.ts`

Own here:

- capability resolution for resource types
- app compatibility resolution
- open-with descriptors
- hostability checks

Contract:

```ts
type RunCapabilityDescriptor = {
  capability: Capability;
  available: boolean;
  reason: string | null;
};

type RunOpenWithOption = {
  appId: string;
  label: string;
  capabilities: Capability[];
  available: boolean;
  reason: string | null;
};

type RunCapabilityState = {
  activeResourceId: string | null;
  activeProjectionId: string | null;
  capabilities: RunCapabilityDescriptor[];
  openWith: RunOpenWithOption[];
};

type RunCapabilityService = RunWorkspaceService<
  RunCapabilityState,
  {
    refresh(): Promise<void>;
  }
>;
```

Rules:

- storage must not resolve app compatibility
- hosted apps should be activated from capability/open-with outputs, not by ad hoc route logic

### 6. Resource Facts Service

Purpose:

- provide shared metadata summaries for explorer, diagnostics panels, and terminal explainers

Planned implementation home:

- `src/modules/run/services/useRunResourceFactsService.ts`

Own here:

- display-safe facts
- verification-facing details
- canonical labels for resource summaries

Contract:

```ts
type RunResourceFact = {
  key: string;
  label: string;
  value: string;
};

type RunResourceFactsState = {
  activeResourceId: string | null;
  facts: RunResourceFact[];
};
```

Rules:

- this service produces facts, not prose-heavy UI copy
- route-level “details panel” content should ultimately come from here plus verification/history services

## Phase 1 Service Graph

```text
workspace source
  -> workspace state
  -> storage catalog
  -> replay state
  -> hosted app runtime

workspace actions service
  -> terminal language service
  -> explorer surface
  -> core facade

verification service
history service
capability service
resource facts service
  -> explorer
  -> terminal
  -> hosted apps
  -> diagnostics facade
```

## Surface Consumption Rules

Explorer should consume:

- workspace actions service
- verification service
- history service
- resource facts service
- capability service

Terminal should consume:

- terminal language service
- verification service
- history service
- capability service

Hosted apps should consume:

- projection state
- capability service
- verification service
- history service

Core facade should consume:

- service summaries and selected state
- not raw storage logic beyond what is needed for composition

## What Exists Today

Already implemented:

- workspace actions service
- terminal language service

Partially implemented:

- explorer and terminal surfaces consuming shared services

Not yet implemented:

- verification service
- history service
- capability service
- resource facts service

## Recommended Build Order

1. `useRunVerificationService`
2. `useRunResourceFactsService`
3. `useRunHistoryService`
4. `useRunCapabilityService`
5. route-level details panel integration
6. terminal commands for `verify`, `history`, and `open-with`

## AI Guardrails

- if a feature explains runtime truth, prefer shared services
- if a feature mutates workspace state, route it through workspace actions
- if a feature only changes rendering, keep it out of services
- do not let explorer and terminal derive parallel verification or history logic
- do not let hosted apps read raw Solid paths when a service contract can express the same thing
