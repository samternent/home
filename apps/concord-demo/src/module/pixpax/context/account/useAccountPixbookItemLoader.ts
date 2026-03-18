import { shallowRef, type ShallowRef } from "vue";
import {
  getPixbookSnapshotV1,
  type AccountBook,
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

type CreateAccountPixbookItemLoaderOptions = {
  account: AccountLike;
  activeCollectionId: ReadRef<string>;
  cloudBooks: ShallowRef<AccountBook[]>;
  selectedCloudBookId: ShallowRef<string>;
  selectedCloudProfileId: ShallowRef<string>;
  cloudBookId: ShallowRef<string>;
  cloudSyncStatus: ShallowRef<string>;
  cloudSyncError: ShallowRef<string>;
  refreshCloudLibrary: () => Promise<void>;
  resetCloudLibraryState: () => void;
};

function trim(value: unknown) {
  return String(value || "").trim();
}

export function createAccountPixbookItemLoader(
  options: CreateAccountPixbookItemLoaderOptions
) {
  const cloudSnapshotVersion = shallowRef<number | null>(null);
  const cloudSnapshotAt = shallowRef("");
  const cloudWorkspaceId = shallowRef("");
  const cloudSnapshotLedgerHead = shallowRef("");
  const cloudSnapshotPayload = shallowRef<unknown | null>(null);

  function resetCloudSnapshotState() {
    cloudSnapshotVersion.value = null;
    cloudSnapshotAt.value = "";
    cloudWorkspaceId.value = "";
    options.cloudBookId.value = "";
    cloudSnapshotLedgerHead.value = "";
    cloudSnapshotPayload.value = null;
  }

  function resetCloudReadState() {
    options.cloudSyncStatus.value = "";
    options.cloudSyncError.value = "";
    resetCloudSnapshotState();
  }

  function applySnapshotState({
    accountId,
    requestedBookId,
    snapshot,
  }: {
    accountId: string;
    requestedBookId: string;
    snapshot: {
      version?: number | null;
      createdAt?: string | null;
      ledgerHead?: string | null;
      payload?: unknown;
    } | null;
  }) {
    cloudWorkspaceId.value = accountId;
    options.cloudBookId.value = requestedBookId;
    options.selectedCloudBookId.value = requestedBookId;

    const selectedBook = options.cloudBooks.value.find((entry) => entry.id === requestedBookId);
    if (selectedBook?.managedUserId) {
      options.selectedCloudProfileId.value = selectedBook.managedUserId;
    }

    cloudSnapshotVersion.value = snapshot?.version ?? null;
    cloudSnapshotAt.value = snapshot?.createdAt || "";
    cloudSnapshotLedgerHead.value = trim(snapshot?.ledgerHead);
    cloudSnapshotPayload.value = snapshot?.payload ?? null;
  }

  function clearSelectionForInvalidBook() {
    options.selectedCloudBookId.value = "";
    options.cloudBookId.value = "";
    resetCloudSnapshotState();
  }

  async function refreshCloudSnapshot() {
    if (!options.account.isAuthenticated.value) {
      resetCloudReadState();
      options.resetCloudLibraryState();
      return;
    }

    const accountId = trim(options.account.workspace.value?.workspaceId);
    if (!accountId) {
      resetCloudReadState();
      return;
    }

    const requestedBookId = trim(
      options.selectedCloudBookId.value || options.cloudBookId.value || ""
    );

    if (!requestedBookId) {
      resetCloudSnapshotState();
      await options.refreshCloudLibrary();
      return;
    }

    const selectedBook = options.cloudBooks.value.find((entry) => entry.id === requestedBookId);
    if (!selectedBook) {
      clearSelectionForInvalidBook();
      options.cloudSyncStatus.value =
        "Selected account pixbook is no longer available. Selection was cleared.";
      options.cloudSyncError.value = "";
      await options.refreshCloudLibrary();
      return;
    }

    if (trim(selectedBook.collectionId) !== trim(options.activeCollectionId.value)) {
      clearSelectionForInvalidBook();
      options.cloudSyncStatus.value =
        "Selected account pixbook belongs to another collection. Selection was cleared.";
      options.cloudSyncError.value = "";
      await options.refreshCloudLibrary();
      return;
    }

    options.cloudSyncError.value = "";
    try {
      const response = await getPixbookSnapshotV1(accountId, requestedBookId);
      applySnapshotState({
        accountId,
        requestedBookId,
        snapshot: response.snapshot,
      });
      await options.refreshCloudLibrary();
    } catch (error: unknown) {
      if (error instanceof PixPaxApiError && error.status === 401) {
        resetCloudReadState();
        options.resetCloudLibraryState();
        return;
      }

      if (error instanceof PixPaxApiError && error.status === 404) {
        applySnapshotState({
          accountId,
          requestedBookId,
          snapshot: null,
        });
        options.cloudSyncStatus.value = "No persisted snapshot exists for this pixbook yet.";
        options.cloudSyncError.value = "";
        await options.refreshCloudLibrary();
        return;
      }

      options.cloudSyncError.value = String(
        (error as Error)?.message || "Failed to load persisted pixbook snapshot."
      );
    }
  }

  return {
    cloudSnapshotVersion,
    cloudSnapshotAt,
    cloudWorkspaceId,
    cloudBookId: options.cloudBookId,
    cloudSnapshotLedgerHead,
    cloudSnapshotPayload,
    resetCloudSnapshotState,
    refreshCloudSnapshot,
  };
}
