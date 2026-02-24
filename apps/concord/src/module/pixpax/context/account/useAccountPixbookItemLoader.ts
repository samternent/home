import { shallowRef, type ShallowRef } from "vue";
import {
  getPixbookCloudState,
  type PixbookCloudBinding,
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
  cloudBinding: ReadRef<PixbookCloudBinding | null>;
  selectedCloudBookId: ShallowRef<string>;
  selectedCloudProfileId: ShallowRef<string>;
  cloudBookId: ShallowRef<string>;
  cloudSyncStatus: ShallowRef<string>;
  cloudSyncError: ShallowRef<string>;
  refreshCloudLibrary: () => Promise<void>;
  resetCloudLibraryState: () => void;
};

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

  async function refreshCloudSnapshot() {
    if (!options.account.isAuthenticated.value) {
      resetCloudReadState();
      options.resetCloudLibraryState();
      return;
    }

    const binding = options.cloudBinding.value;
    if (!binding) {
      resetCloudReadState();
      return;
    }

    const requestedBookId = String(
      options.selectedCloudBookId.value || options.cloudBookId.value || ""
    ).trim();

    if (!requestedBookId) {
      resetCloudReadState();
      await options.refreshCloudLibrary();
      return;
    }

    options.cloudSyncError.value = "";
    try {
      const response = await getPixbookCloudState(
        options.account.workspace.value?.workspaceId || undefined,
        binding,
        requestedBookId,
        options.activeCollectionId.value
      );

      cloudWorkspaceId.value = response.workspaceId || "";
      options.cloudBookId.value = response.book?.id || "";
      if (options.cloudBookId.value) {
        options.selectedCloudBookId.value = options.cloudBookId.value;
      }
      if (response.book?.managedUserId) {
        options.selectedCloudProfileId.value = response.book.managedUserId;
      }

      cloudSnapshotVersion.value = response.snapshot?.version ?? null;
      cloudSnapshotAt.value = response.snapshot?.createdAt || "";
      cloudSnapshotLedgerHead.value = String(
        response.snapshot?.ledgerHead || ""
      ).trim();
      cloudSnapshotPayload.value = response.snapshot?.payload ?? null;

      await options.refreshCloudLibrary();
    } catch (error: unknown) {
      if (error instanceof PixPaxApiError && error.status === 401) {
        resetCloudReadState();
        options.resetCloudLibraryState();
        return;
      }
      if (error instanceof PixPaxApiError && error.status === 404) {
        resetCloudSnapshotState();
        options.cloudSyncStatus.value =
          "No cloud pixbook found for this identity. Save identity to account first.";
        options.cloudSyncError.value = "";
        await options.refreshCloudLibrary();
        return;
      }

      options.cloudSyncError.value = String(
        (error as Error)?.message || "Failed to load cloud snapshot."
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
