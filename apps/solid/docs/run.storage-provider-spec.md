# Storage Provider Spec

Status: architecture correction for `run.ternent.dev` while `apps/solid` remains the implementation home.

## Why This Exists

The runtime currently behaves as if Solid is the workspace substrate.

That is too narrow for the product.

The target runtime must be able to operate:

- without Solid
- with multiple storage backends available at once
- with storage-specific explorer and terminal affordances appearing only when the provider supports them

This means:

- Solid is a storage plugin
- not a required runtime dependency
- not the root workspace abstraction

## Core Product Shift

The product is not:

- a SolidOS-style shell with Concord inside it

The product is:

- a Concord runtime with pluggable storage providers

Concord remains the truth and replay layer.
Storage remains persistence and access.
Storage providers may come and go without changing runtime truth.

## Core Rule

- storage is optional
- replay is core
- verification is core
- hosted app boot is core
- storage plugins expose mounts and capabilities
- explorer and terminal consume provider capabilities, not provider assumptions

## New Architecture

### 1. Core Runtime

Always available, even with no storage provider connected.

Own here:

- workspace state
- projection state
- verification
- history
- hosted app boot
- capability resolution
- command registry

Core runtime must not require:

- Solid auth
- Pod discovery
- provider-specific browse semantics

### 2. Storage Provider Registry

Own here:

- provider registration
- provider connection state
- provider capability discovery
- provider mount inventory

Example providers:

- memory
- local filesystem
- IndexedDB / localStorage
- Solid
- Dropbox
- Google Drive

### 3. Mount Registry

Own here:

- active mounts across all connected providers
- mount metadata
- provider ownership of each mount
- active mount selection

### 4. Surface Capability Layer

Explorer and terminal should not ask “is Solid available?”

They should ask:

- what mounts exist?
- which mounts are browsable?
- which commands are registered?
- which create/read/write capabilities are available?

## Storage Provider Contract

```ts
type RunStorageProviderId =
  | "memory"
  | "local-fs"
  | "indexed-db"
  | "solid"
  | "dropbox"
  | "google-drive";

type RunStorageCapability =
  | "mount"
  | "browse"
  | "stat"
  | "read"
  | "write"
  | "create-folder"
  | "create-ledger"
  | "delete"
  | "provider-auth";

type RunStorageProviderStatus =
  | "idle"
  | "connecting"
  | "ready"
  | "error";

type RunStorageProviderManifest = {
  id: RunStorageProviderId;
  label: string;
  capabilities: RunStorageCapability[];
};

type RunMountDescriptor = {
  id: string;
  providerId: RunStorageProviderId;
  label: string;
  rootUrl: string;
  writable: boolean;
  browsable: boolean;
};

type RunBrowseEntry = {
  id: string;
  mountId: string;
  providerId: RunStorageProviderId;
  url: string;
  path: string;
  name: string;
  kind: "container" | "file" | "ledger";
  contentType: string | null;
  writable: boolean;
};

type RunBrowseResult = {
  mountId: string;
  url: string;
  path: string;
  parentUrl: string | null;
  entries: RunBrowseEntry[];
};

type RunStorageProvider = {
  manifest: RunStorageProviderManifest;
  status: ComputedRef<RunStorageProviderStatus>;
  error: ComputedRef<string | null>;

  connect(): Promise<void>;
  disconnect(): Promise<void>;

  listMounts(): Promise<RunMountDescriptor[]>;

  browse?(mountId: string, url: string): Promise<RunBrowseResult>;
  stat?(mountId: string, url: string): Promise<RunBrowseEntry | null>;

  createFolder?(
    mountId: string,
    parentUrl: string,
    name: string,
  ): Promise<RunBrowseEntry>;

  createLedger?(
    mountId: string,
    parentUrl: string,
    name: string,
  ): Promise<RunBrowseEntry>;
};
```

Rules:

- providers expose capability truth explicitly
- missing capabilities are normal
- no provider is required for runtime boot
- providers must not own replay or verification logic

## Workspace Runtime Contract

The workspace layer should stop being a provider implementation and become provider orchestration.

```ts
type RunWorkspaceRuntimeState = {
  providers: Record<
    string,
    {
      id: string;
      status: RunStorageProviderStatus;
      capabilities: RunStorageCapability[];
      error: string | null;
    }
  >;
  mounts: RunMountDescriptor[];
  selection: {
    activeProviderId: string | null;
    activeMountId: string | null;
    activeBrowseUrl: string | null;
    activeResourceId: string | null;
    activeLedgerIds: string[];
  };
};
```

This state belongs above provider implementations.

## Explorer Contract

Explorer is not “the Solid browser”.

Explorer is a surface over browsable mounts.

Explorer should only be available when:

- at least one connected provider exposes `browse`

Explorer surface contract should converge on:

```ts
type RunExplorerSurface = {
  available: ComputedRef<boolean>;
  activeMountId: ComputedRef<string | null>;
  currentUrl: ComputedRef<string | null>;
  currentPath: ComputedRef<string>;
  parentUrl: ComputedRef<string | null>;
  items: ComputedRef<RunExplorerItem[]>;
  canGoUp: ComputedRef<boolean>;

  navigateItem(url: string): Promise<boolean>;
  selectItem(url: string): Promise<boolean>;
  goUp(): Promise<boolean>;
  createFolder(name: string): Promise<boolean>;
  createLedger(name: string): Promise<boolean>;
};
```

Rules:

- explorer should render provider-backed browse results
- explorer should hide create controls when active mount lacks those capabilities
- explorer should not contain Solid-specific language

## Terminal Layering

Terminal must be layered.

### Terminal core

Always available.

Own here:

- `help`
- `status`
- `verify`
- `history`
- `projection`
- `app open`
- `app close`

These commands should work even when no storage provider is connected.

### Provider commands

Available only when a provider or mount supports them.

Examples:

- `mounts`
- `ls`
- `cd`
- `mkdir`
- `mkledger`
- provider-specific connect/auth commands later

## Command Provider Contract

```ts
type RunCommandContext = {
  workspace: WorkspaceState;
  activeMountId: string | null;
  activeProjectionId: string | null;
  providerCapabilities: Record<string, RunStorageCapability[]>;
};

type RunCommandDescriptor = {
  name: string;
  usage: string;
  description: string;
};

type RunCommand = {
  descriptor: RunCommandDescriptor;
  execute(
    args: string[],
    ctx: RunCommandContext,
  ): Promise<RunTerminalLanguageResult>;
};

type RunCommandProvider = {
  id: string;
  when(ctx: RunCommandContext): boolean;
  commands(): RunCommand[];
};
```

Rules:

- terminal language becomes a command registry and dispatcher
- core runtime contributes core commands
- each storage provider may contribute provider commands
- command availability should be discoverable by `help`

## Identity and Verification

A major correction:

- verification identity must not depend on Solid existing

Phase 1 can still keep Solid identity provisioning as one implementation path, but the architecture must change to:

- core Concord identity service
- provider-specific auth/session adapters

Solid provider may do:

- provider auth
- provider-backed identity cache

But the runtime should be expressible without it.

## Current Coupling To Remove

### Current root coupling

File:

- `src/modules/run/workspace/useRunWorkspaceSource.ts`

Current problem:

- boot, browse, provider auth, pod discovery, identity provisioning, and mutation all live in one Solid-specific source

Target:

- this file should stop being the root workspace abstraction
- it should become `src/modules/run/storage/providers/solid/useRunSolidProvider.ts`

### Current storage coupling

File:

- `src/modules/run/storage/useRunStorageCatalog.ts`

Current problem:

- storage catalog assumes one upstream workspace source

Target:

- derive resources and ledgers from a provider-backed mount registry

### Current terminal coupling

File:

- `src/modules/run/services/useRunTerminalLanguage.ts`

Current problem:

- storage commands are treated as globally available

Target:

- terminal language dispatches core commands plus provider command providers

### Current explorer coupling

Files:

- `src/modules/run/surfaces/useRunExplorerSurface.ts`
- `src/routes/home/RouteAppExplorer.vue`

Current problem:

- explorer assumes one active browse source

Target:

- explorer is driven by active mount and provider capabilities

## Proposed Module Layout

```text
src/modules/run/
  core/
  workspace/
    useRunWorkspaceRuntime.ts
    useRunMountRegistry.ts
    useRunProviderRegistry.ts
  storage/
    providers/
      solid/
        useRunSolidProvider.ts
      memory/
        useRunMemoryProvider.ts
      indexed-db/
        useRunIndexedDbProvider.ts
  services/
    useRunWorkspaceActions.ts
    useRunTerminalLanguage.ts
    useRunCommandRegistry.ts
    useRunVerificationService.ts
    useRunHistoryService.ts
    useRunCapabilityService.ts
```

## Migration Plan

### Phase 1: Architecture split

1. Introduce storage provider types and registry.
2. Rename `useRunWorkspaceSource.ts` responsibilities into a Solid provider implementation.
3. Introduce a provider-agnostic workspace runtime above it.

### Phase 2: Mount and browse abstraction

1. Move browse state out of the Solid source and into a workspace/mount runtime.
2. Make explorer read active mount browse state.
3. Add capability flags for browse/create support.

### Phase 3: Terminal layering

1. Introduce command providers.
2. Move current storage commands behind a “browsable mount available” condition.
3. Add core runtime-only commands that do not require storage.

### Phase 4: Identity correction

1. Introduce a core Concord identity service.
2. Move Solid-specific identity provisioning/caching behind the Solid provider.
3. Keep verification mandatory but decouple it from Solid login.

### Phase 5: Additional providers

1. Add a memory provider for local/dev boot.
2. Add IndexedDB/localStorage provider.
3. Only then consider external providers like Dropbox or Google Drive.

## Immediate Refactor Targets

The next concrete files to change should be:

1. `src/modules/run/workspace/useRunWorkspaceSource.ts`
   Replace as root runtime source with provider-specific Solid implementation.

2. `src/modules/run/storage/useRunStorageCatalog.ts`
   Rebuild around provider and mount registries.

3. `src/modules/run/services/useRunTerminalLanguage.ts`
   Split into command registry plus command providers.

4. `src/modules/run/surfaces/useRunExplorerSurface.ts`
   Drive explorer from active mount browse state, not a single provider source.

## Non-Negotiable Rules

- do not let “Solid session” remain a top-level runtime requirement
- do not let explorer be a Solid-specific browser
- do not let terminal assume storage commands are globally available
- do not let provider auth become the same thing as runtime identity
- do not move replay or verification down into providers
