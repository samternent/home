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

  function resolveApiErrorCode(error: unknown) {
    if (!(error instanceof PixPaxApiError)) return "";
    const body = error.body as { code?: unknown } | null;
    const code = String(body?.code || "").trim();
    return code;
  }

  function applyCloudState(
    response: Awaited<ReturnType<typeof getPixbookCloudState>>
  ) {
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
    cloudSnapshotLedgerHead.value = String(response.snapshot?.ledgerHead || "").trim();
    cloudSnapshotPayload.value = response.snapshot?.payload ?? null;
  }

  function clearInvalidBookSelection() {
    options.selectedCloudBookId.value = "";
    options.cloudBookId.value = "";
    options.selectedCloudProfileId.value = "";
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
      applyCloudState(response);
      await options.refreshCloudLibrary();
    } catch (error: unknown) {
      if (error instanceof PixPaxApiError && error.status === 401) {
        resetCloudReadState();
        options.resetCloudLibraryState();
        return;
      }
      if (
        error instanceof PixPaxApiError &&
        error.status === 409 &&
        (
          resolveApiErrorCode(error) === "PIXBOOK_BOOK_PROFILE_MISMATCH" ||
          resolveApiErrorCode(error) === "PIXBOOK_BOOK_COLLECTION_MISMATCH"
        )
      ) {
        const mismatchCode = resolveApiErrorCode(error);
        clearInvalidBookSelection();
        options.cloudSyncStatus.value =
          mismatchCode === "PIXBOOK_BOOK_COLLECTION_MISMATCH"
            ? "Active collection changed. Account pixbook selection was cleared."
            : "Active identity changed. Account pixbook selection was cleared.";
        options.cloudSyncError.value = "";
        await options.refreshCloudLibrary();
        try {
          const fallback = await getPixbookCloudState(
            options.account.workspace.value?.workspaceId || undefined,
            binding,
            undefined,
            options.activeCollectionId.value
          );
          applyCloudState(fallback);
          options.cloudSyncStatus.value =
            "Account pixbook switched to the active identity.";
          await options.refreshCloudLibrary();
          return;
        } catch (fallbackError: unknown) {
          if (
            fallbackError instanceof PixPaxApiError &&
            fallbackError.status === 404
          ) {
            options.cloudSyncStatus.value =
              "No cloud pixbook found for this identity. Save identity to account first.";
            options.cloudSyncError.value = "";
            return;
          }
          if (
            fallbackError instanceof PixPaxApiError &&
            fallbackError.status === 401
          ) {
            resetCloudReadState();
            options.resetCloudLibraryState();
            return;
          }
          options.cloudSyncError.value = String(
            (fallbackError as Error)?.message || "Failed to load cloud state."
          );
          return;
        }
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
        (error as Error)?.message || "Failed to load cloud state."
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
