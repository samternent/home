import { computed, shallowRef, type ShallowRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import {
  listAccountBooks,
  listAccountManagedUsers,
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

  async function refreshCloudLibrary() {
    if (!options.account.isAuthenticated.value) return;
    cloudLibraryLoading.value = true;
    cloudLibraryError.value = "";
    try {
      const workspaceId = options.account.workspace.value?.workspaceId || undefined;
      const [usersRes, booksRes] = await Promise.all([
        listAccountManagedUsers(workspaceId),
        listAccountBooks(workspaceId),
      ]);

      cloudProfiles.value = usersRes.users || [];
      cloudBooks.value = booksRes.books || [];

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

      if (!selectedCloudProfileId.value && cloudProfiles.value.length > 0) {
        selectedCloudProfileId.value = cloudProfiles.value[0].id;
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

      if (!selectedCloudBookId.value && filteredCloudBooks.value.length > 0) {
        selectedCloudBookId.value = filteredCloudBooks.value[0].id;
      }
    } catch (error: unknown) {
      if (
        error instanceof PixPaxApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        cloudLibraryError.value =
          "Workspace identity/pixbook management is not available for this session.";
      } else {
        cloudLibraryError.value = String(
          (error as Error)?.message || "Failed to load cloud library."
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
