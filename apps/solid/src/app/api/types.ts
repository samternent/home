import type {
  ConcordCommandResult,
  ConcordCommitInput,
  ConcordCommitResult,
  ConcordReplayOptions,
  ConcordState,
} from "@ternent/concord";
import type { Ref } from "vue";
import type {
  PermissionCreateInput,
  PermissionGrantInput,
  PermissionRecord,
  PermissionRevokeInput,
  UserCreateInput,
  UserEncryptionGroupInput,
  UserRecord,
  UserUpdateProfileInput,
} from "@/app/plugins";

export type AppStatus = "restoring" | "ready" | "error";

export type AppIdentity = {
  identityId: string;
  label: string;
};

export type AppUsersApi = {
  create(input: UserCreateInput): Promise<ConcordCommandResult>;
  updateProfile(input: UserUpdateProfileInput): Promise<ConcordCommandResult>;
  addToEncryptionGroup(input: UserEncryptionGroupInput): Promise<ConcordCommandResult>;
  removeFromEncryptionGroup(input: UserEncryptionGroupInput): Promise<ConcordCommandResult>;
  all(): UserRecord[];
  byId(identityId: string): UserRecord | null;
};

export type AppPermissionsApi = {
  create(input: Omit<PermissionCreateInput, "actor">): Promise<ConcordCommandResult>;
  grant(input: Omit<PermissionGrantInput, "actor">): Promise<ConcordCommandResult>;
  revoke(input: Omit<PermissionRevokeInput, "actor">): Promise<ConcordCommandResult>;
  all(): PermissionRecord[];
  byId(permissionId: string): PermissionRecord | null;
};

export type AppApi = {
  status: Readonly<Ref<AppStatus>>;
  state: Readonly<Ref<Readonly<ConcordState>>>;
  lastError: Readonly<Ref<string | null>>;
  identity: {
    status: Readonly<Ref<AppStatus>>;
    activeIdentity: Readonly<Ref<AppIdentity | null>>;
    getActiveIdentity(): AppIdentity | null;
    ensureActiveIdentity(): Promise<AppIdentity>;
  };
  users: AppUsersApi;
  permissions: AppPermissionsApi;
  load(): Promise<void>;
  command<TInput = unknown>(type: string, input: TInput): Promise<ConcordCommandResult>;
  commit(input?: ConcordCommitInput): Promise<ConcordCommitResult>;
  discard(): Promise<void>;
  replay(options?: ConcordReplayOptions): Promise<void>;
  getState(): Readonly<ConcordState>;
  getPluginState<TState = unknown>(pluginId: string): TState;
  select<TValue = unknown>(pluginId: string, selectorId: string, ...args: unknown[]): TValue;
  subscribe(listener: (state: Readonly<ConcordState>) => void): () => void;
  destroy(): Promise<void>;
};
