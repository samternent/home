import { computed, shallowRef, type ShallowRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import {
  listAccountManagedUsers,
  listPixbooksV1,
  type AccountBook,
  type AccountManagedUser,
  PixPaxApiError,
} from "../../api/client";

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

type CreateAccountListLoaderOptions = {
  account: AccountLike;
  activeCollectionId: ReadRef<string>;
  cloudBookId: ShallowRef<string>;
};

export function createAccountListLoader(options: CreateAccountListLoaderOptions) {
  const cloudProfiles = shallowRef<AccountManagedUser[]>([]);
  const cloudBooks = shallowRef<AccountBook[]>([]);
  const selectedCloudProfileId = useLocalStorage(
    "pixpax/pixbook/cloudSelectedProfileId",
    ""
  );
  const selectedCloudBookId = useLocalStorage(
    "pixpax/pixbook/cloudSelectedBookId",
    ""
  );
  const cloudLibraryLoading = shallowRef(false);
  const cloudLibraryError = shallowRef("");

  const selectedCloudProfile = computed(() => {
    if (!selectedCloudProfileId.value) return null;
    return (
      cloudProfiles.value.find((entry) => entry.id === selectedCloudProfileId.value) ||
      null
    );
  });

  const filteredCloudBooks = computed(() => {
    const profileId = String(selectedCloudProfileId.value || "").trim();
    return cloudBooks.value.filter((entry) => {
      if (String(entry.collectionId || "").trim() !== options.activeCollectionId.value) {
        return false;
      }
      if (!profileId) return true;
      return entry.managedUserId === profileId;
    });
  });

  function resetCloudLibraryState() {
    cloudProfiles.value = [];
    cloudBooks.value = [];
    selectedCloudProfileId.value = "";
    selectedCloudBookId.value = "";
    cloudLibraryError.value = "";
  }

  function deriveProfilesFromBooks(books: AccountBook[], existingUsers: AccountManagedUser[] = []) {
    const existingById = new Map<string, AccountManagedUser>();
    for (const user of existingUsers) {
      const id = String(user.id || "").trim();
      if (!id) continue;
      existingById.set(id, user);
    }
    const grouped = new Map<string, AccountManagedUser>();
    for (const book of books) {
      const managedUserId = String(book.managedUserId || "").trim();
      if (!managedUserId) continue;
      if (grouped.has(managedUserId)) continue;
      const displayName = String(book.managedUserDisplayName || "").trim();
      const existing = existingById.get(managedUserId);
      grouped.set(managedUserId, {
        id: managedUserId,
        displayName: displayName || String(existing?.displayName || managedUserId),
        avatarPublicId: existing?.avatarPublicId || null,
        userKey: String(existing?.userKey || managedUserId),
        profileId: existing?.profileId || null,
        identityPublicKey: existing?.identityPublicKey || null,
        identityKeyFingerprint: existing?.identityKeyFingerprint || null,
        status: String(existing?.status || "active"),
        createdAt: existing?.createdAt,
        updatedAt: existing?.updatedAt,
      });
    }
    return [...grouped.values()].sort((a, b) =>
      String(a.displayName || a.id).localeCompare(String(b.displayName || b.id))
    );
  }

  async function refreshCloudLibrary() {
    if (!options.account.isAuthenticated.value) return;
    cloudLibraryLoading.value = true;
    cloudLibraryError.value = "";
    try {
      const accountId = options.account.workspace.value?.workspaceId || "";
      if (!accountId) {
        cloudProfiles.value = [];
        cloudBooks.value = [];
        return;
      }
      const booksRes = await listPixbooksV1(accountId);
      cloudBooks.value = booksRes.pixbooks || [];
      let existingUsers: AccountManagedUser[] = [];
      try {
        const usersRes = await listAccountManagedUsers(accountId);
        existingUsers = usersRes.users || [];
      } catch {
        existingUsers = [];
      }
      cloudProfiles.value = deriveProfilesFromBooks(cloudBooks.value, existingUsers);

      if (selectedCloudProfileId.value) {
        const stillPresent = cloudProfiles.value.some(
          (entry) => entry.id === selectedCloudProfileId.value
        );
        if (!stillPresent) selectedCloudProfileId.value = "";
      }

      if (!selectedCloudProfileId.value && options.cloudBookId.value) {
        const activeBook = cloudBooks.value.find(
          (entry) => entry.id === options.cloudBookId.value
        );
        if (activeBook) selectedCloudProfileId.value = activeBook.managedUserId;
      }

      if (selectedCloudBookId.value) {
        const stillPresent = cloudBooks.value.some(
          (entry) => entry.id === selectedCloudBookId.value
        );
        if (!stillPresent) selectedCloudBookId.value = "";
      }

      if (!selectedCloudBookId.value && options.cloudBookId.value) {
        const activeBookPresent = cloudBooks.value.some(
          (entry) => entry.id === options.cloudBookId.value
        );
        if (activeBookPresent) {
          selectedCloudBookId.value = options.cloudBookId.value;
        }
      }

    } catch (error: unknown) {
      if (
        error instanceof PixPaxApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        cloudLibraryError.value =
          "Account pixbook persistence is not available for this session.";
      } else {
        cloudLibraryError.value = String(
          (error as Error)?.message || "Failed to load persisted pixbooks."
        );
      }
    } finally {
      cloudLibraryLoading.value = false;
    }
  }

  return {
    cloudProfiles,
    cloudBooks,
    selectedCloudProfileId,
    selectedCloudBookId,
    selectedCloudProfile,
    filteredCloudBooks,
    cloudLibraryLoading,
    cloudLibraryError,
    resetCloudLibraryState,
    refreshCloudLibrary,
  };
}
