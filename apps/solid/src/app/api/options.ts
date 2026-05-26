import type { SerializedIdentity } from "@ternent/identity";
import type { LedgerStorageAdapter } from "@ternent/ledger";
import type {
  AppProjectionPlugin,
  EncryptedIdentityBlobV2,
  IdentityBootstrapMode,
  LocalStorageLike,
} from "@/app/runtime";

export type CreateAppApiOptions = {
  identity?: SerializedIdentity;
  encryptedIdentity?: EncryptedIdentityBlobV2 | string;
  identityBootstrapMode?: IdentityBootstrapMode;
  identityStorage?: LocalStorageLike;
  identityStorageKey?: string;
  devSessionUnlockBypass?: boolean;
  rpName?: string;
  concordStorage?: LocalStorageLike;
  concordStorageKey?: string;
  storage?: LedgerStorageAdapter;
  plugins?: AppProjectionPlugin[];
};
