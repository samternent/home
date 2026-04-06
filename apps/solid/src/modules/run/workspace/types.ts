import type { ComputedRef } from "vue";
import type {
  RunBrowseEntry,
  RunBrowseResult,
  RunMountDescriptor,
  RunSigningIdentityRef,
  RunStorageCapability,
  RunStorageProvider,
  RunStorageProviderRecord,
  RunWorkspaceScope,
} from "@/modules/run/storage/types";

export type RunProviderRegistry = {
  providers: ComputedRef<RunStorageProviderRecord[]>;
  getProvider(providerId: string | null | undefined): RunStorageProvider | null;
  connectProvider(providerId: string): Promise<void>;
  disconnectProvider(providerId: string): Promise<void>;
  connectAll(): Promise<void>;
};

export type RunMountRegistry = {
  mounts: ComputedRef<RunMountDescriptor[]>;
  browsableMounts: ComputedRef<RunMountDescriptor[]>;
  getMount(mountId: string | null | undefined): RunMountDescriptor | null;
  getMountProvider(mountId: string | null | undefined): RunStorageProvider | null;
  refresh(): Promise<void>;
};

export type RunWorkspaceRuntimeStatus = "idle" | "loading" | "ready" | "error";

export type RunWorkspaceRuntimeSelection = {
  activeProviderId: string | null;
  activeMountId: string | null;
  activeBrowseUrl: string | null;
  activeResourceId: string | null;
  activeLedgerIds: string[];
  activeScope: RunWorkspaceScope | null;
};

export type RunWorkspaceRuntime = {
  status: ComputedRef<RunWorkspaceRuntimeStatus>;
  error: ComputedRef<string | null>;
  providers: ComputedRef<RunStorageProviderRecord[]>;
  mounts: ComputedRef<RunMountDescriptor[]>;
  currentBrowse: ComputedRef<RunBrowseResult | null>;
  browseCache: ComputedRef<Record<string, RunBrowseResult>>;
  selectedEntry: ComputedRef<RunBrowseEntry | null>;
  selection: ComputedRef<RunWorkspaceRuntimeSelection>;
  availableCapabilities: ComputedRef<RunStorageCapability[]>;
  hasBrowsableMounts: ComputedRef<boolean>;
  init(): Promise<void>;
  selectMount(mountId: string): Promise<void>;
  selectScope(scope: RunWorkspaceScope): Promise<void>;
  navigateTo(url: string): Promise<void>;
  selectEntry(entry: RunBrowseEntry | null): Promise<void>;
  openEntry(entry: RunBrowseEntry): Promise<void>;
  lookupEntry(url: string): Promise<RunBrowseEntry | null>;
  createFolder(name: string): Promise<RunBrowseEntry | null>;
  createLedger(name: string, signer: RunSigningIdentityRef): Promise<RunBrowseEntry | null>;
  reset(): Promise<void>;
};
