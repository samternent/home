import { useLocalStorage } from "@vueuse/core";
import { type ShallowRef } from "vue";
import {
  createAccountBook,
  createAccountManagedUser,
  getPixbookCloudState,
  removeAccountBook,
  removeAccountManagedIdentity,
  resetAccountManagedIdentities,
  savePixbookCloudSnapshot,
  updateAccountManagedUser,
  type AccountBook,
  type AccountManagedUser,
  type PixbookCloudBinding,
  PixPaxApiError,
} from "../../api/client";
import { type PixbookExport, type PixpaxContextStore } from "../usePixpaxContextStore";

type ReadRef<T> = {
  readonly value: T;
};

type WorkspaceRef = {
  workspaceId: string;
} | null;

type AccountLike = {
  isAuthenticated: ReadRef<boolean>;
  workspace: ReadRef<WorkspaceRef>;
};

type CreateAccountItemActionsOptions = {
  account: AccountLike;
  context: PixpaxContextStore;
  activeCollectionId: ReadRef<string>;
  canCloudSync: ReadRef<boolean>;
  cloudBinding: ReadRef<PixbookCloudBinding | null>;
  cloudProfiles: ShallowRef<AccountManagedUser[]>;
  cloudBooks: ShallowRef<AccountBook[]>;
  selectedCloudProfileId: ShallowRef<string>;
  selectedCloudBookId: ShallowRef<string>;
  cloudBookId: ShallowRef<string>;
  cloudSnapshotVersion: ShallowRef<number | null>;
  cloudSnapshotAt: ShallowRef<string>;
  cloudWorkspaceId: ShallowRef<string>;
  cloudSnapshotLedgerHead: ShallowRef<string>;
  cloudSnapshotPayload: ShallowRef<unknown | null>;
  cloudSyncing: ShallowRef<boolean>;
  cloudSyncStatus: ShallowRef<string>;
  cloudSyncError: ShallowRef<string>;
  identityDirectorySyncing: ShallowRef<boolean>;
  identityDirectorySyncError: ShallowRef<string>;
  identityDirectorySyncStatus: ShallowRef<string>;
  refreshCloudLibrary: () => Promise<void>;
  refreshCloudSnapshot: () => Promise<void>;
};

const PIXBOOK_FORMAT = "pixpax-pixbook";
const PIXBOOK_VERSION = "1.0";
const DEFAULT_COLLECTION_ID = "primary";

export function createAccountItemActions(options: CreateAccountItemActionsOptions) {
  const suppressedIdentityBindings = useLocalStorage<string[]>(
    "pixpax/pixbook/cloudSuppressedIdentityBindings",
    []
  );

  function normalizeCollectionId(value: unknown) {
    const normalized = String(value || "").trim();
    return normalized || DEFAULT_COLLECTION_ID;
  }

  function resolveApiErrorCode(error: unknown) {
    if (!(error instanceof PixPaxApiError)) return "";
    const body = error.body as { code?: unknown } | null;
    return String(body?.code || "").trim();
  }

  function getCloudBindingOrThrow() {
    const binding = options.cloudBinding.value;
    if (!binding) {
      throw new Error(
        "Cloud account save/restore requires a private Pixbook identity (profile + key)."
      );
    }
    return binding;
  }

  function identityDisplayName(input: { label?: string; metadata?: Record<string, unknown> }) {
    const username = String(input?.metadata?.username || "").trim();
    if (username) return username;
    const label = String(input?.label || "").trim();
    if (label) return label.replace(/^@/, "");
    return "Identity";
  }

  function toIdentityBindingKey(profileId: string, identityPublicKey: string) {
    const normalizedProfileId = String(profileId || "").trim();
    const normalizedIdentityPublicKey = String(identityPublicKey || "").trim();
    if (!normalizedProfileId || !normalizedIdentityPublicKey) return "";
    return `${normalizedProfileId}::${normalizedIdentityPublicKey}`;
  }

  function isIdentityBindingSuppressed(bindingKey: string) {
    if (!bindingKey) return false;
    const suppressed = Array.isArray(suppressedIdentityBindings.value)
      ? suppressedIdentityBindings.value
      : [];
    return suppressed.includes(bindingKey);
  }

  function suppressIdentityBinding(bindingKey: string) {
    if (!bindingKey) return;
    const suppressed = Array.isArray(suppressedIdentityBindings.value)
      ? suppressedIdentityBindings.value
      : [];
    if (suppressed.includes(bindingKey)) return;
    suppressedIdentityBindings.value = [...suppressed, bindingKey];
  }

  function unsuppressIdentityBinding(bindingKey: string) {
    if (!bindingKey) return;
    const suppressed = Array.isArray(suppressedIdentityBindings.value)
      ? suppressedIdentityBindings.value
      : [];
    if (!suppressed.includes(bindingKey)) return;
    suppressedIdentityBindings.value = suppressed.filter(
      (entry) => entry !== bindingKey
    );
  }

  async function syncLocalIdentitiesToCloud(identityIds: string[] = []) {
    if (!options.account.isAuthenticated.value) return false;
    if (options.identityDirectorySyncing.value) return false;

    options.identityDirectorySyncing.value = true;
    options.identityDirectorySyncError.value = "";
    options.identityDirectorySyncStatus.value = "Saving identities to account...";

    try {
      const workspaceId = options.account.workspace.value?.workspaceId || undefined;
      await options.refreshCloudLibrary();

      const existingByBinding = new Map<string, AccountManagedUser>();
      const deletedByBinding = new Map<string, AccountManagedUser>();
      for (const entry of options.cloudProfiles.value) {
        const profileId = String(entry.profileId || "").trim();
        const identityPublicKey = String(entry.identityPublicKey || "").trim();
        if (!profileId || !identityPublicKey) continue;
        const key = toIdentityBindingKey(profileId, identityPublicKey);
        if (!key) continue;
        if (String(entry.status || "").trim() === "deleted") {
          deletedByBinding.set(key, entry);
          continue;
        }
        existingByBinding.set(key, entry);
      }

      const activeBookByManagedUserCollection = new Set<string>();
      for (const book of options.cloudBooks.value) {
        if (String(book.status || "").trim() === "deleted") continue;
        const managedUserId = String(book.managedUserId || "").trim();
        const collectionId = normalizeCollectionId(book.collectionId);
        if (!managedUserId || !collectionId) continue;
        activeBookByManagedUserCollection.add(`${managedUserId}::${collectionId}`);
      }

      const requestedIdentityIds = new Set(
        identityIds.map((entry) => String(entry || "").trim()).filter(Boolean)
      );
      let createdIdentityCount = 0;
      let restoredIdentityCount = 0;
      let createdBookCount = 0;
      const localIdentities = options.context.identities.value.filter((entry) => {
        if (requestedIdentityIds.size === 0) return true;
        return requestedIdentityIds.has(String(entry.id || "").trim());
      });

      for (const identity of localIdentities) {
        const profileId = String(identity.profileId || "").trim();
        const identityPublicKey = String(identity.publicKeyPEM || "").trim();
        if (!profileId || !identityPublicKey) continue;

        const displayName = identityDisplayName(identity);
        const bindingKey = toIdentityBindingKey(profileId, identityPublicKey);
        if (!bindingKey || isIdentityBindingSuppressed(bindingKey)) continue;
        const existing = existingByBinding.get(bindingKey) || null;
        const deleted = deletedByBinding.get(bindingKey) || null;

        let managedUserId = String(existing?.id || "").trim();

        if (existing) {
          unsuppressIdentityBinding(bindingKey);
        } else if (deleted) {
          await updateAccountManagedUser(
            deleted.id,
            { status: "active" },
            workspaceId
          );
          managedUserId = String(deleted.id || "").trim();
          existingByBinding.set(bindingKey, {
            ...deleted,
            status: "active",
          });
          restoredIdentityCount += 1;
          unsuppressIdentityBinding(bindingKey);
        } else {
          const created = await createAccountManagedUser(
            {
              displayName,
              profileId,
              identityPublicKey,
            },
            workspaceId
          );
          managedUserId = String(created?.id || "").trim();
          createdIdentityCount += 1;
          unsuppressIdentityBinding(bindingKey);
        }

        if (!managedUserId) continue;

        const localCollectionIds = new Set<string>();
        for (const pixbook of options.context.pixbooks.value) {
          if (
            String(pixbook.identityId || "").trim() !==
            String(identity.id || "").trim()
          ) {
            continue;
          }
          localCollectionIds.add(normalizeCollectionId(pixbook.collectionId));
        }
        if (localCollectionIds.size === 0) {
          localCollectionIds.add(options.activeCollectionId.value);
        }

        for (const collectionId of localCollectionIds) {
          const bindingCollectionKey = `${managedUserId}::${collectionId}`;
          if (activeBookByManagedUserCollection.has(bindingCollectionKey)) continue;

          await createAccountBook(
            {
              managedUserId,
              name: "My Pixbook",
              collectionId,
            },
            workspaceId
          );
          activeBookByManagedUserCollection.add(bindingCollectionKey);
          createdBookCount += 1;
        }
      }

      await options.refreshCloudLibrary();
      options.identityDirectorySyncStatus.value = `Saved identities: +${createdIdentityCount} created, ${restoredIdentityCount} restored, +${createdBookCount} pixbooks.`;
      return true;
    } catch (error: unknown) {
      options.identityDirectorySyncError.value = String(
        (error as Error)?.message || "Identity save failed."
      );
      options.identityDirectorySyncStatus.value = "";
      return false;
    } finally {
      options.identityDirectorySyncing.value = false;
    }
  }

  async function saveLocalIdentityToCloud(identityId: string) {
    const targetId = String(identityId || "").trim();
    if (!targetId) {
      options.identityDirectorySyncError.value = "Identity id is required.";
      return false;
    }
    return syncLocalIdentitiesToCloud([targetId]);
  }

  async function saveCloudSnapshot() {
    if (!options.canCloudSync.value || !options.context.ledger.value) return false;
    if (options.cloudSyncing.value) return false;

    const targetBookId = String(
      options.selectedCloudBookId.value || options.cloudBookId.value || ""
    ).trim();
    if (!targetBookId) {
      options.cloudSyncError.value =
        "No account pixbook is selected. Save identity to account first.";
      options.cloudSyncStatus.value = "";
      return false;
    }

    options.cloudSyncing.value = true;
    options.cloudSyncStatus.value = "Saving pixbook to cloud...";
    options.cloudSyncError.value = "";

    try {
      const binding = getCloudBindingOrThrow();
      const payload = options.context.buildPixbook("private");
      const response = await savePixbookCloudSnapshot({
        payload,
        ledgerHead: options.context.ledger.value?.head || "",
        expectedVersion: options.cloudSnapshotVersion.value ?? 0,
        expectedLedgerHead: options.cloudSnapshotLedgerHead.value,
        workspaceId: options.account.workspace.value?.workspaceId || undefined,
        bookId: targetBookId,
        collectionId: options.activeCollectionId.value,
        binding,
      });

      options.cloudWorkspaceId.value = response.workspaceId || "";
      options.cloudBookId.value = response.book?.id || "";
      if (options.cloudBookId.value) {
        options.selectedCloudBookId.value = options.cloudBookId.value;
      }
      if (response.book?.managedUserId) {
        options.selectedCloudProfileId.value = response.book.managedUserId;
      }
      options.cloudSnapshotVersion.value = response.snapshot?.version ?? null;
      options.cloudSnapshotAt.value = response.snapshot?.createdAt || "";
      options.cloudSnapshotLedgerHead.value = String(
        response.snapshot?.ledgerHead || ""
      ).trim();
      options.cloudSnapshotPayload.value = response.snapshot?.payload ?? payload;
      options.cloudSyncStatus.value = `Cloud save complete (v${
        options.cloudSnapshotVersion.value ?? 0
      }).`;
      return true;
    } catch (error: unknown) {
      if (error instanceof PixPaxApiError && error.status === 409) {
        const code = resolveApiErrorCode(error);
        if (
          code === "PIXBOOK_BOOK_PROFILE_MISMATCH" ||
          code === "PIXBOOK_BOOK_COLLECTION_MISMATCH"
        ) {
          options.selectedCloudBookId.value = "";
          options.cloudBookId.value = "";
          options.cloudSyncStatus.value = "";
          await options.refreshCloudSnapshot();
          options.cloudSyncError.value =
            "Selected account pixbook is no longer valid for this identity. Selection was cleared.";
          return false;
        }
        options.cloudSyncStatus.value = "";
        options.cloudSyncError.value =
          "Cloud snapshot conflict detected. Load latest cloud snapshot before saving again.";
        await options.refreshCloudSnapshot();
        return false;
      }
      options.cloudSyncError.value = String(
        (error as Error)?.message || "Cloud save failed."
      );
      return false;
    } finally {
      options.cloudSyncing.value = false;
    }
  }

  async function restoreCloudSnapshot() {
    if (!options.account.isAuthenticated.value) {
      options.cloudSyncError.value = "Sign in to restore cloud pixbooks.";
      return false;
    }

    const binding = options.cloudBinding.value;
    if (!binding) {
      options.cloudSyncError.value =
        "Cloud restore requires your private Pixbook identity in this browser.";
      return false;
    }

    options.cloudSyncError.value = "";
    options.cloudSyncStatus.value = "Loading cloud snapshot...";

    try {
      const targetBookId = String(
        options.selectedCloudBookId.value || options.cloudBookId.value || ""
      ).trim();
      if (!targetBookId) {
        throw new Error(
          "No account pixbook is selected. Save identity to account first."
        );
      }

      const response = await getPixbookCloudState(
        options.account.workspace.value?.workspaceId || undefined,
        binding,
        targetBookId,
        options.activeCollectionId.value
      );

      const payload = response.snapshot?.payload as PixbookExport | null;
      if (!payload || typeof payload !== "object") {
        throw new Error("No cloud snapshot found yet.");
      }
      if (payload.format !== PIXBOOK_FORMAT || payload.version !== PIXBOOK_VERSION) {
        throw new Error("Cloud snapshot format is invalid.");
      }

      const file = new File([JSON.stringify(payload)], "cloud-pixbook.json", {
        type: "application/json",
      });
      const ok = await options.context.importPixbookFile(file, { confirm: false });
      if (!ok) {
        throw new Error(options.context.uploadError.value || "Cloud restore failed.");
      }

      if (payload.kind === "public") {
        options.cloudSyncStatus.value = "Public cloud pixbook loaded (read-only).";
      } else {
        options.cloudSyncStatus.value = `Cloud pixbook restored (v${
          response.snapshot?.version || 0
        }).`;
      }

      await options.refreshCloudSnapshot();
      return true;
    } catch (error: unknown) {
      options.cloudSyncError.value = String(
        (error as Error)?.message || "Cloud restore failed."
      );
      options.cloudSyncStatus.value = "";
      return false;
    }
  }

  async function openSelectedCloudBook() {
    if (!options.selectedCloudBookId.value) {
      options.cloudSyncError.value = "Select a cloud pixbook first.";
      return false;
    }

    const selectedBook = options.cloudBooks.value.find(
      (entry) =>
        String(entry.id || "").trim() ===
        String(options.selectedCloudBookId.value || "").trim()
    );
    if (!selectedBook) {
      options.cloudSyncError.value = "Selected cloud pixbook was not found.";
      return false;
    }
    if (normalizeCollectionId(selectedBook.collectionId) !== options.activeCollectionId.value) {
      options.cloudSyncError.value =
        "Selected cloud pixbook belongs to another collection.";
      return false;
    }

    const binding = options.cloudBinding.value;
    if (!binding) {
      options.cloudSyncError.value =
        "Private cloud restore requires your active identity in this browser.";
      return false;
    }
    const boundManagedUser = options.cloudProfiles.value.find((entry) => {
      return (
        String(entry.profileId || "").trim() === String(binding.profileId || "").trim() &&
        String(entry.identityPublicKey || "").trim() ===
          String(binding.identityPublicKey || "").trim() &&
        String(entry.status || "").trim() !== "deleted"
      );
    });
    if (!boundManagedUser || boundManagedUser.id !== selectedBook.managedUserId) {
      options.cloudSyncError.value =
        "Private cross-identity cloud restore is blocked. Switch identity first.";
      return false;
    }

    options.cloudBookId.value = options.selectedCloudBookId.value;
    return restoreCloudSnapshot();
  }

  async function importAccountIdentityToDevice(managedUserId: string) {
    if (!options.account.isAuthenticated.value) {
      options.cloudSyncError.value = "Sign in to import identities from your account.";
      return false;
    }

    const targetManagedUserId = String(managedUserId || "").trim();
    if (!targetManagedUserId) {
      options.cloudSyncError.value = "Identity id is required.";
      return false;
    }

    const targetProfile = options.cloudProfiles.value.find(
      (entry) =>
        String(entry.id || "").trim() === targetManagedUserId &&
        String(entry.status || "").trim() !== "deleted"
    );
    if (!targetProfile) {
      options.cloudSyncError.value = "Account identity not found.";
      return false;
    }

    const targetBook = options.cloudBooks.value.find(
      (entry) =>
        String(entry.managedUserId || "").trim() === targetManagedUserId &&
        String(entry.status || "").trim() !== "deleted" &&
        normalizeCollectionId(entry.collectionId) === options.activeCollectionId.value
    );
    if (!targetBook) {
      options.cloudSyncError.value =
        "No saved pixbook exists for this identity in the active collection.";
      return false;
    }

    options.cloudSyncError.value = "";
    options.cloudSyncStatus.value = "Importing identity from account...";

    try {
      const response = await getPixbookCloudState(
        options.account.workspace.value?.workspaceId || undefined,
        undefined,
        targetBook.id,
        options.activeCollectionId.value
      );

      const payload = response.snapshot?.payload as PixbookExport | null;
      if (!payload || typeof payload !== "object") {
        throw new Error("No saved snapshot exists for this identity yet.");
      }
      if (payload.kind !== "private") {
        throw new Error(
          "Only private pixbook snapshots can be imported as device identities."
        );
      }
      if (payload.format !== PIXBOOK_FORMAT || payload.version !== PIXBOOK_VERSION) {
        throw new Error("Saved snapshot format is invalid.");
      }

      const file = new File([JSON.stringify(payload)], "account-identity.json", {
        type: "application/json",
      });
      const ok = await options.context.importPixbookFile(file, { confirm: false });
      if (!ok) {
        throw new Error(options.context.uploadError.value || "Identity import failed.");
      }

      options.cloudSyncStatus.value = "Identity imported to this device.";
      await options.refreshCloudLibrary();
      return true;
    } catch (error: unknown) {
      options.cloudSyncError.value = String(
        (error as Error)?.message || "Failed to import identity from account."
      );
      options.cloudSyncStatus.value = "";
      return false;
    }
  }

  async function removeCloudIdentity(managedUserId: string) {
    if (!options.account.isAuthenticated.value) {
      options.cloudSyncError.value = "Sign in to remove identities from your account.";
      return false;
    }

    const targetId = String(managedUserId || "").trim();
    if (!targetId) {
      options.cloudSyncError.value = "Identity id is required.";
      return false;
    }

    options.cloudSyncError.value = "";
    options.cloudSyncStatus.value = "Removing identity from account...";

    try {
      const workspaceId = options.account.workspace.value?.workspaceId || undefined;
      const profileToRemove = options.cloudProfiles.value.find(
        (entry) => String(entry.id || "").trim() === targetId
      );
      const bindingKey = toIdentityBindingKey(
        String(profileToRemove?.profileId || "").trim(),
        String(profileToRemove?.identityPublicKey || "").trim()
      );
      const removed = await removeAccountManagedIdentity(targetId, workspaceId);

      suppressIdentityBinding(bindingKey);

      if (options.selectedCloudProfileId.value === targetId) {
        options.selectedCloudProfileId.value = "";
        options.selectedCloudBookId.value = "";
      }

      if (
        Array.isArray(removed?.removedBookIds) &&
        removed.removedBookIds.includes(options.cloudBookId.value)
      ) {
        options.cloudBookId.value = "";
      }

      await options.refreshCloudLibrary();
      options.cloudSyncStatus.value = "Identity removed from account.";
      return true;
    } catch (error: unknown) {
      options.cloudSyncError.value = String(
        (error as Error)?.message || "Failed to remove identity from account."
      );
      options.cloudSyncStatus.value = "";
      return false;
    }
  }

  async function resetAccountIdentityData() {
    if (!options.account.isAuthenticated.value) {
      options.cloudSyncError.value = "Sign in to reset account identities.";
      return false;
    }

    options.cloudSyncError.value = "";
    options.cloudSyncStatus.value = "Resetting account identity data...";

    try {
      const workspaceId = options.account.workspace.value?.workspaceId || undefined;
      const removed = await resetAccountManagedIdentities(workspaceId);

      options.selectedCloudProfileId.value = "";
      options.selectedCloudBookId.value = "";
      options.cloudBookId.value = "";
      options.cloudSnapshotVersion.value = null;
      options.cloudSnapshotAt.value = "";
      options.cloudWorkspaceId.value = "";
      options.cloudSnapshotLedgerHead.value = "";
      options.cloudSnapshotPayload.value = null;

      await options.refreshCloudLibrary();

      options.cloudSyncStatus.value = `Account reset complete (${removed.removedManagedUsers || 0} identities, ${removed.removedBooks || 0} pixbooks removed).`;
      return true;
    } catch (error: unknown) {
      options.cloudSyncError.value = String(
        (error as Error)?.message || "Failed to reset account identity data."
      );
      options.cloudSyncStatus.value = "";
      return false;
    }
  }

  async function removeCloudPixbook(bookId: string) {
    if (!options.account.isAuthenticated.value) {
      options.cloudSyncError.value = "Sign in to remove pixbooks from your account.";
      return false;
    }

    const targetId = String(bookId || "").trim();
    if (!targetId) {
      options.cloudSyncError.value = "Pixbook id is required.";
      return false;
    }

    options.cloudSyncError.value = "";
    options.cloudSyncStatus.value = "Removing pixbook from account...";

    try {
      const workspaceId = options.account.workspace.value?.workspaceId || undefined;
      await removeAccountBook(targetId, workspaceId);

      if (options.selectedCloudBookId.value === targetId) {
        options.selectedCloudBookId.value = "";
      }
      if (options.cloudBookId.value === targetId) {
        options.cloudBookId.value = "";
      }

      await options.refreshCloudLibrary();
      options.cloudSyncStatus.value = "Pixbook removed from account.";
      return true;
    } catch (error: unknown) {
      options.cloudSyncError.value = String(
        (error as Error)?.message || "Failed to remove pixbook from account."
      );
      options.cloudSyncStatus.value = "";
      return false;
    }
  }

  return {
    syncLocalIdentitiesToCloud,
    saveLocalIdentityToCloud,
    saveCloudSnapshot,
    restoreCloudSnapshot,
    openSelectedCloudBook,
    importAccountIdentityToDevice,
    removeCloudIdentity,
    resetAccountIdentityData,
    removeCloudPixbook,
  };
}
