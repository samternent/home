import { useLocalStorage } from "@vueuse/core";
import { type ShallowRef } from "vue";
import { canonicalStringify } from "@ternent/concord-protocol";
import {
  createIdempotencyKey,
  createAccountBook,
  createAccountManagedUser,
  getPixPaxErrorCode,
  getPixbookSnapshotV1,
  listAccountManagedUsers,
  removeAccountBook,
  removeAccountManagedIdentity,
  resetAccountManagedIdentities,
  savePixbookCommandUntilDoneV1,
  updateAccountManagedUser,
  type AccountBook,
  type AccountManagedUser,
  PixPaxApiError,
} from "../../api/client";
import { type PixpaxContextStore } from "../usePixpaxContextStore";

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

const PERSISTED_LEDGER_FORMAT = "pixpax-ledger-snapshot";
const PERSISTED_LEDGER_VERSION = "1.0";
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
    return getPixPaxErrorCode(error);
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

  const persistIdempotencyKeys = useLocalStorage<Record<string, string>>(
    "pixpax/pixbook/persistIdempotencyKeys",
    {}
  );
  let pendingPersistHead = "";
  let persistLoopInFlight: Promise<boolean> | null = null;

  function trim(value: unknown) {
    return String(value || "").trim();
  }

  function toCanonicalJson<T>(value: unknown, fallback: T): T {
    try {
      return JSON.parse(canonicalStringify(value ?? fallback)) as T;
    } catch {
      return JSON.parse(JSON.stringify(value ?? fallback)) as T;
    }
  }

  function isObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function hasLedgerShape(value: unknown): value is Record<string, unknown> {
    if (!isObject(value)) return false;
    if (isObject(value.ledger)) return true;
    const format = trim(value.format).toLowerCase();
    if (format === "concord-ledger") return true;
    if (isObject(value.commits) || isObject(value.entries)) return true;
    return false;
  }

  function buildPersistedSnapshotPayload() {
    const ledger = options.context.ledger.value;
    if (!isObject(ledger)) {
      throw new Error("Pixbook ledger not available.");
    }
    return {
      format: PERSISTED_LEDGER_FORMAT,
      version: PERSISTED_LEDGER_VERSION,
      ledger: toCanonicalJson<Record<string, unknown>>(ledger, {}),
    };
  }

  function extractPersistedLedger(payload: unknown) {
    if (!isObject(payload)) return null;
    const format = trim(payload.format).toLowerCase();
    if (
      (format === "pixpax-pixbook" || format === PERSISTED_LEDGER_FORMAT) &&
      isObject(payload.ledger)
    ) {
      return toCanonicalJson<Record<string, unknown>>(payload.ledger, {});
    }
    if (isObject(payload.ledger)) {
      return toCanonicalJson<Record<string, unknown>>(payload.ledger, {});
    }
    if (hasLedgerShape(payload)) {
      return toCanonicalJson<Record<string, unknown>>(payload, {});
    }
    return null;
  }

  function currentAccountId() {
    return trim(options.account.workspace.value?.workspaceId);
  }

  function selectedBookId() {
    return trim(options.selectedCloudBookId.value || options.cloudBookId.value);
  }

  function idempotencyScopeKey(bookId: string, ledgerHead: string) {
    return `${trim(bookId)}::${trim(ledgerHead)}`;
  }

  function getOrCreatePersistIdempotencyKey(bookId: string, ledgerHead: string) {
    const scope = idempotencyScopeKey(bookId, ledgerHead);
    const existing = trim(persistIdempotencyKeys.value[scope]);
    if (existing) return existing;
    const created = createIdempotencyKey();
    persistIdempotencyKeys.value = {
      ...persistIdempotencyKeys.value,
      [scope]: created,
    };
    return created;
  }

  function clearPersistIdempotencyKey(bookId: string, ledgerHead: string) {
    const scope = idempotencyScopeKey(bookId, ledgerHead);
    if (!persistIdempotencyKeys.value[scope]) return;
    const next = { ...persistIdempotencyKeys.value };
    delete next[scope];
    persistIdempotencyKeys.value = next;
  }

  async function wait(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
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

      let managedUsersForSync = options.cloudProfiles.value;
      try {
        const usersRes = await listAccountManagedUsers(workspaceId);
        managedUsersForSync = usersRes.users || [];
      } catch {
        managedUsersForSync = options.cloudProfiles.value;
      }

      const existingByBinding = new Map<string, AccountManagedUser>();
      const deletedByBinding = new Map<string, AccountManagedUser>();
      for (const entry of managedUsersForSync) {
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
      let skippedIdentityCount = 0;
      const localIdentities = options.context.identities.value.filter((entry) => {
        if (requestedIdentityIds.size === 0) return true;
        return requestedIdentityIds.has(String(entry.id || "").trim());
      });

      if (requestedIdentityIds.size > 0 && localIdentities.length === 0) {
        throw new Error("Selected identity was not found on this device.");
      }

      for (const identity of localIdentities) {
        const identityId = String(identity.id || "").trim();
        const profileId = String(identity.profileId || "").trim();
        const identityPublicKey = String(identity.publicKeyPEM || "").trim();
        if (!profileId || !identityPublicKey) {
          if (requestedIdentityIds.size === 0 || requestedIdentityIds.has(identityId)) {
            skippedIdentityCount += 1;
          }
          continue;
        }

        const displayName = identityDisplayName(identity);
        const bindingKey = toIdentityBindingKey(profileId, identityPublicKey);
        const explicitlyRequested =
          requestedIdentityIds.size > 0 && requestedIdentityIds.has(identityId);
        if (!bindingKey) {
          if (explicitlyRequested) skippedIdentityCount += 1;
          continue;
        }
        if (isIdentityBindingSuppressed(bindingKey) && !explicitlyRequested) {
          continue;
        }
        if (explicitlyRequested) {
          unsuppressIdentityBinding(bindingKey);
        }
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
      if (
        requestedIdentityIds.size > 0 &&
        createdIdentityCount === 0 &&
        restoredIdentityCount === 0 &&
        createdBookCount === 0
      ) {
        if (skippedIdentityCount > 0) {
          throw new Error(
            "Selected identity is missing required profile/key data and could not be saved."
          );
        }
        options.identityDirectorySyncStatus.value = "Identity already saved to account.";
        options.identityDirectorySyncError.value = "";
        return true;
      }
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

    const identity = options.context.identities.value.find(
      (entry) => String(entry.id || "").trim() === targetId
    );
    if (!identity) {
      options.identityDirectorySyncError.value =
        "Selected identity was not found on this device.";
      return false;
    }

    const bindingKey = toIdentityBindingKey(
      String(identity.profileId || "").trim(),
      String(identity.publicKeyPEM || "").trim()
    );
    unsuppressIdentityBinding(bindingKey);

    return syncLocalIdentitiesToCloud([targetId]);
  }

  async function saveCloudSnapshot() {
    if (!options.canCloudSync.value || !options.context.ledger.value) return false;
    const localLedgerHead = trim(options.context.ledger.value?.head);
    if (!localLedgerHead) return false;
    pendingPersistHead = localLedgerHead;
    if (!persistLoopInFlight) {
      persistLoopInFlight = runPersistLoop();
    }
    return persistLoopInFlight;
  }

  async function runPersistLoop() {
    let ok = true;
    try {
      while (pendingPersistHead) {
        const targetHead = pendingPersistHead;
        pendingPersistHead = "";
        const saved = await saveCloudSnapshotForHead(targetHead);
        if (!saved) {
          ok = false;
          break;
        }
      }
      return ok;
    } finally {
      persistLoopInFlight = null;
    }
  }

  async function saveCloudSnapshotForHead(targetHead: string) {
    if (!options.canCloudSync.value || !options.context.ledger.value) return false;
    const accountId = currentAccountId();
    if (!accountId) {
      options.cloudSyncError.value = "Account context is unavailable.";
      options.cloudSyncStatus.value = "";
      return false;
    }
    const targetBookId = selectedBookId();
    if (!targetBookId) {
      options.cloudSyncError.value = "Select an account pixbook before saving progress.";
      options.cloudSyncStatus.value = "";
      return false;
    }
    if (options.cloudSyncing.value) return false;

    const localLedgerHead = trim(options.context.ledger.value?.head);
    if (!localLedgerHead || (trim(targetHead) && trim(targetHead) !== localLedgerHead)) {
      return true;
    }
    const lastPersistedLocalHead = trim(options.context.activePixbook.value?.lastPersistHead);
    if (localLedgerHead && localLedgerHead === lastPersistedLocalHead) {
      return true;
    }
    const remoteSnapshotHead = trim(
      (options.cloudSnapshotPayload.value as { ledger?: { head?: unknown } } | null)?.ledger?.head
    );
    if (localLedgerHead === remoteSnapshotHead) {
      return true;
    }

    options.cloudSyncing.value = true;
    options.cloudSyncError.value = "";
    options.cloudSyncStatus.value = "Saving progress to account...";

    try {
      const payload = buildPersistedSnapshotPayload();
      const idempotencyKey = getOrCreatePersistIdempotencyKey(targetBookId, localLedgerHead);
      const expectedLedgerHead = trim(options.cloudSnapshotLedgerHead.value) || null;
      const expectedVersion =
        expectedLedgerHead === null && Number.isFinite(Number(options.cloudSnapshotVersion.value))
          ? Number(options.cloudSnapshotVersion.value)
          : null;

      const result = await savePixbookCommandUntilDoneV1(
        {
          accountId,
          bookId: targetBookId,
          payload,
          ledgerHead: localLedgerHead,
          expectedLedgerHead,
          expectedVersion,
          idempotencyKey,
        },
        {
          maxAttempts: 30,
          onPending: (pending) => {
            options.cloudSyncStatus.value = `Save pending. Retrying in ${pending.retryAfterSeconds}s...`;
          },
        }
      );

      options.cloudWorkspaceId.value = accountId;
      options.cloudBookId.value = targetBookId;
      options.selectedCloudBookId.value = targetBookId;
      options.cloudSnapshotVersion.value = result.data.streamVersion;
      options.cloudSnapshotAt.value = result.data.createdAt;
      options.cloudSnapshotLedgerHead.value = trim(result.data.hash);
      options.cloudSnapshotPayload.value = payload;
      clearPersistIdempotencyKey(targetBookId, localLedgerHead);
      await options.context.persistCurrentPixbookSnapshot();
      options.cloudSyncStatus.value = `Progress persisted (v${result.data.streamVersion}).`;
      options.cloudSyncError.value = "";
      return true;
    } catch (error: unknown) {
      clearPersistIdempotencyKey(targetBookId, localLedgerHead);
      if (error instanceof PixPaxApiError && error.status === 409) {
        const code = resolveApiErrorCode(error);
        if (code === "BOOK_SNAPSHOT_CONFLICT" || code === "STREAM_HEAD_CONFLICT") {
          options.cloudSyncStatus.value = "";
          options.cloudSyncError.value =
            "Remote pixbook changed on another device. Re-open this pixbook from account before saving again.";
          return false;
        }
      }
      options.cloudSyncStatus.value = "";
      options.cloudSyncError.value = String(
        (error as Error)?.message || "Failed to persist pixbook progress."
      );
      return false;
    } finally {
      options.cloudSyncing.value = false;
    }
  }

  async function restoreCloudSnapshot(bookId?: string) {
    if (!options.account.isAuthenticated.value) {
      options.cloudSyncError.value = "Sign in to open account pixbooks.";
      return false;
    }

    const accountId = currentAccountId();
    if (!accountId) {
      options.cloudSyncError.value = "Account context is unavailable.";
      return false;
    }

    options.cloudSyncError.value = "";
    options.cloudSyncStatus.value = "Opening persisted pixbook...";

    try {
      const targetBookId = trim(bookId) || selectedBookId();
      if (!targetBookId) {
        throw new Error("No account pixbook is selected.");
      }

      const response = await getPixbookSnapshotV1(accountId, targetBookId);
      const payload = response.snapshot?.payload ?? null;
      const ledger = extractPersistedLedger(payload);
      if (!ledger) {
        options.cloudSyncStatus.value = "No persisted snapshot exists for this pixbook yet.";
        options.cloudSyncError.value = "";
        await options.refreshCloudSnapshot();
        return true;
      }
      await options.context.loadPersistedLedgerSnapshot(ledger);

      options.cloudWorkspaceId.value = accountId;
      options.cloudBookId.value = targetBookId;
      options.selectedCloudBookId.value = targetBookId;
      options.cloudSnapshotVersion.value = response.snapshot?.version ?? null;
      options.cloudSnapshotAt.value = response.snapshot?.createdAt || "";
      options.cloudSnapshotLedgerHead.value = trim(response.snapshot?.ledgerHead);
      options.cloudSnapshotPayload.value = payload;
      options.cloudSyncStatus.value = `Opened persisted pixbook (v${response.snapshot?.version || 0}).`;
      await options.refreshCloudSnapshot();
      return true;
    } catch (error: unknown) {
      options.cloudSyncError.value = String(
        (error as Error)?.message || "Failed to open persisted pixbook."
      );
      options.cloudSyncStatus.value = "";
      return false;
    }
  }

  async function openSelectedCloudBook() {
    const selected = selectedBookId();
    if (!selected) {
      options.cloudSyncError.value = "Select an account pixbook first.";
      return false;
    }

    const selectedBook = options.cloudBooks.value.find(
      (entry) => trim(entry.id) === selected
    );
    if (!selectedBook) {
      options.cloudSyncError.value = "Selected account pixbook was not found.";
      return false;
    }
    if (normalizeCollectionId(selectedBook.collectionId) !== options.activeCollectionId.value) {
      options.cloudSyncError.value =
        "Selected account pixbook belongs to another collection.";
      return false;
    }

    options.selectedCloudProfileId.value = selectedBook.managedUserId;
    options.cloudBookId.value = selectedBook.id;
    return restoreCloudSnapshot(selectedBook.id);
  }

  async function selectCloudProfile(profileId: string) {
    const targetProfileId = trim(profileId);
    if (!targetProfileId) {
      options.cloudSyncError.value = "Identity id is required.";
      return false;
    }

    const targetBooks = options.cloudBooks.value.filter((entry) => {
      return (
        trim(entry.managedUserId) === targetProfileId &&
        trim(entry.status) !== "deleted" &&
        normalizeCollectionId(entry.collectionId) === options.activeCollectionId.value
      );
    });
    if (targetBooks.length === 0) {
      options.cloudSyncError.value =
        "No pixbook is available for this identity in the active collection.";
      return false;
    }

    options.selectedCloudProfileId.value = targetProfileId;
    const currentBookId = selectedBookId();
    const selectedTarget =
      targetBooks.find((entry) => trim(entry.id) === currentBookId) || targetBooks[0];
    options.selectedCloudBookId.value = selectedTarget.id;
    options.cloudBookId.value = selectedTarget.id;
    return restoreCloudSnapshot(selectedTarget.id);
  }

  async function flushPersistQueue(timeoutMs = 2500) {
    const inFlight = persistLoopInFlight;
    if (!inFlight) return true;
    const timeout = Math.max(250, Number(timeoutMs || 0));
    const winner = await Promise.race([
      inFlight.then((ok) => (ok ? "done" : "failed")),
      wait(timeout).then(() => "timeout"),
    ]);
    return winner !== "failed";
  }

  async function importAccountIdentityToDevice(managedUserId: string) {
    void managedUserId;
    options.cloudSyncStatus.value = "";
    options.cloudSyncError.value =
      "Identity import from account snapshots is disabled. Private profile keys are never persisted to account storage.";
    return false;
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
    selectCloudProfile,
    flushPersistQueue,
    importAccountIdentityToDevice,
    removeCloudIdentity,
    resetAccountIdentityData,
    removeCloudPixbook,
  };
}
