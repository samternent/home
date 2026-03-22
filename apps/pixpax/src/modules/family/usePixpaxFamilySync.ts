import { computed, ref, shallowRef, watch } from "vue";
import type {
  AccountBook,
  AccountManagedUser,
  PixbookCloudStateResponse,
} from "@/modules/api/client";
import {
  PixpaxApiError,
  createAccountBook,
  createAccountManagedUser,
  createIdentityBackup,
  getLatestIdentityBackup,
  getPixbookCloudState,
  listAccountBooks,
  listAccountManagedUsers,
  savePixbookCloudSnapshot,
  updateAccountManagedUser,
} from "@/modules/api/client";
import { useIdentityCreate, useIdentitySession, type StoredIdentity } from "@/modules/identity";
import { usePixbookSession } from "@/modules/pixbook/usePixbookSession";
import {
  decryptIdentityBackupEnvelope,
  encryptIdentityBackupEnvelope,
} from "./identity-backup-crypto";
import { usePixpaxFamilyAccount } from "./usePixpaxFamilyAccount";

const FAMILY_COLLECTION_ID = "primary";

type FamilySnapshotState = {
  bookId: string;
  version: number | null;
  ledgerHead: string;
  savedAt: string;
};

function trim(value: unknown) {
  return String(value || "").trim();
}

function extractError(error: unknown, fallback: string) {
  if (error instanceof PixpaxApiError) {
    const body = error.body as { error?: string; code?: string } | null;
    const message = trim(body?.error) || trim(error.message);
    if (message) return message;
  }
  return String((error as Error)?.message || fallback);
}

function createPixbookSnapshotPayload(container: unknown) {
  return {
    format: "pixpax-pixbook-snapshot",
    version: "1.0",
    savedAt: new Date().toISOString(),
    ledger: container,
  };
}

function extractPixbookSnapshotLedger(payload: unknown) {
  const record =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as { ledger?: unknown })
      : null;
  if (record?.ledger) {
    return record.ledger;
  }
  return payload;
}

function matchManagedUserToIdentity(managedUser: AccountManagedUser, identity: StoredIdentity | null) {
  if (!identity) return false;
  const managedUserId = trim(managedUser.id);
  const localManagedUserId = trim(identity.managedUserId);
  if (managedUserId && localManagedUserId && managedUserId === localManagedUserId) {
    return true;
  }
  const profileId = trim(managedUser.profileId);
  if (profileId && profileId === trim(identity.id)) {
    return true;
  }
  const publicKey = trim(managedUser.identityPublicKey);
  return Boolean(publicKey) && publicKey === trim(identity.serializedIdentity.publicKey);
}

const authEmail = ref("");
const authOtp = ref("");
const authBusy = ref(false);
const authMessage = ref("");
const familyLoading = ref(false);
const familyStatus = ref("");
const familyError = ref("");
const recoveryPassphrase = ref("");
const managedUsers = shallowRef<AccountManagedUser[]>([]);
const familyBooks = shallowRef<AccountBook[]>([]);
const localLedgerHead = ref("");
const snapshotState = shallowRef<FamilySnapshotState>({
  bookId: "",
  version: null,
  ledgerHead: "",
  savedAt: "",
});

let refreshPromise: Promise<void> | null = null;

export function usePixpaxFamilySync() {
  const account = usePixpaxFamilyAccount();
  const identitySession = useIdentitySession();
  const identityCreator = useIdentityCreate();
  const pixbook = usePixbookSession();

  const activeIdentity = computed(() => identitySession.identity.value);
  const localIdentities = computed(() => identitySession.identities.value);
  const activeManagedUser = computed(
    () =>
      managedUsers.value.find((entry) => matchManagedUserToIdentity(entry, activeIdentity.value)) ||
      null,
  );
  const activeBook = computed(
    () =>
      familyBooks.value.find(
        (entry) =>
          trim(entry.collectionId) === FAMILY_COLLECTION_ID &&
          trim(entry.managedUserId) === trim(activeManagedUser.value?.id),
      ) || null,
  );
  const recoverableManagedIdentities = computed(() => {
    const localManagedUserIds = new Set(
      localIdentities.value.map((entry) => trim(entry.managedUserId)).filter(Boolean),
    );
    return managedUsers.value.filter((entry) => !localManagedUserIds.has(trim(entry.id)));
  });
  const familySession = computed(() => ({
    user: account.user.value,
    workspace: account.workspace.value,
    authenticated: account.isAuthenticated.value,
  }));
  const recoveryPassphraseUnlocked = computed(
    () => trim(recoveryPassphrase.value).length > 0,
  );
  const isSnapshotDirty = computed(() => {
    if (!localLedgerHead.value) return false;
    if (!snapshotState.value.ledgerHead) return true;
    return localLedgerHead.value !== snapshotState.value.ledgerHead;
  });

  async function refreshLocalLedgerHead() {
    try {
      await pixbook.ensureReady();
      localLedgerHead.value = await pixbook.getLedgerHead();
    } catch {
      localLedgerHead.value = "";
    }
  }

  async function refreshFamilyDirectory() {
    if (!account.isAuthenticated.value) {
      managedUsers.value = [];
      familyBooks.value = [];
      snapshotState.value = {
        bookId: "",
        version: null,
        ledgerHead: "",
        savedAt: "",
      };
      familyError.value = "";
      familyStatus.value = "";
      return;
    }

    if (!refreshPromise) {
      refreshPromise = (async () => {
        familyLoading.value = true;
        familyError.value = "";
        try {
          const [usersResponse, booksResponse] = await Promise.all([
            listAccountManagedUsers(),
            listAccountBooks(),
          ]);
          managedUsers.value = Array.isArray(usersResponse.users) ? usersResponse.users : [];
          familyBooks.value = Array.isArray(booksResponse.books) ? booksResponse.books : [];
          await refreshActiveSnapshotState();
        } catch (error: unknown) {
          familyError.value = extractError(error, "Unable to load family data.");
        } finally {
          familyLoading.value = false;
          refreshPromise = null;
        }
      })();
    }

    return refreshPromise;
  }

  async function ensureManagedUser(identity: StoredIdentity) {
    await refreshFamilyDirectory();
    const existing =
      managedUsers.value.find((entry) => matchManagedUserToIdentity(entry, identity)) || null;
    if (existing) {
      if (
        trim(existing.displayName) !== trim(identity.displayName) &&
        trim(identity.displayName)
      ) {
        await updateAccountManagedUser(existing.id, {
          displayName: trim(identity.displayName),
          profileId: identity.id,
          identityPublicKey: identity.serializedIdentity.publicKey,
        });
        await refreshFamilyDirectory();
      }
      if (trim(identity.managedUserId) !== trim(existing.id)) {
        identitySession.updateIdentity(identity.id, { managedUserId: existing.id });
      }
      return existing;
    }

    const created = await createAccountManagedUser({
      displayName: trim(identity.displayName) || "Child collector",
      profileId: identity.id,
      identityPublicKey: identity.serializedIdentity.publicKey,
      userKey: `pixpax:${identity.id}`,
    });
    const managedUser =
      created.user ||
      managedUsers.value.find((entry) => trim(entry.id) === trim(created.id)) ||
      null;
    identitySession.updateIdentity(identity.id, { managedUserId: trim(created.id) || null });
    await refreshFamilyDirectory();
    return managedUser || managedUsers.value.find((entry) => trim(entry.id) === trim(created.id)) || null;
  }

  async function ensureFamilyBook(identity: StoredIdentity, managedUserId: string) {
    await refreshFamilyDirectory();
    const existing = familyBooks.value.find(
      (entry) =>
        trim(entry.managedUserId) === trim(managedUserId) &&
        trim(entry.collectionId) === FAMILY_COLLECTION_ID,
    );
    if (existing) {
      return existing;
    }

    const created = await createAccountBook({
      managedUserId,
      collectionId: FAMILY_COLLECTION_ID,
      name: `${trim(identity.displayName) || "Child"}'s Pixbook`,
    });
    await refreshFamilyDirectory();
    return (
      familyBooks.value.find((entry) => trim(entry.id) === trim(created.id)) ||
      familyBooks.value.find(
        (entry) =>
          trim(entry.managedUserId) === trim(managedUserId) &&
          trim(entry.collectionId) === FAMILY_COLLECTION_ID,
      ) ||
      null
    );
  }

  async function refreshActiveSnapshotState() {
    if (!account.isAuthenticated.value || !activeIdentity.value) {
      snapshotState.value = {
        bookId: "",
        version: null,
        ledgerHead: "",
        savedAt: "",
      };
      return null;
    }

    const binding = {
      profileId: activeIdentity.value.id,
      identityPublicKey: activeIdentity.value.serializedIdentity.publicKey,
      profileDisplayName: trim(activeIdentity.value.displayName) || "Child collector",
    };

    try {
      const response = await getPixbookCloudState(undefined, binding, activeBook.value?.id, FAMILY_COLLECTION_ID);
      snapshotState.value = {
        bookId: trim(response.book?.id),
        version: Number.isFinite(Number(response.snapshot?.version))
          ? Number(response.snapshot?.version)
          : null,
        ledgerHead: trim(response.snapshot?.ledgerHead),
        savedAt: trim(response.snapshot?.createdAt),
      };
      return response;
    } catch (error: unknown) {
      if (error instanceof PixpaxApiError && error.status === 404) {
        snapshotState.value = {
          bookId: "",
          version: null,
          ledgerHead: "",
          savedAt: "",
        };
        return null;
      }
      throw error;
    }
  }

  async function createLocalChild(displayName = "") {
    const created = await identityCreator.create();
    if (trim(displayName)) {
      identitySession.updateIdentity(created.id, { displayName: trim(displayName) });
    }
    familyStatus.value = "Created a new local child profile on this device.";
    familyError.value = "";
    return created;
  }

  async function saveLocalIdentityToFamily(identityId?: string) {
    if (!account.isAuthenticated.value) {
      familyError.value = "Sign in to save children to your family space.";
      return false;
    }
    const identity =
      localIdentities.value.find((entry) => trim(entry.id) === trim(identityId)) ||
      activeIdentity.value;
    if (!identity) {
      familyError.value = "No local child identity is selected.";
      return false;
    }

    try {
      const managedUser = await ensureManagedUser(identity);
      if (!managedUser?.id) {
        throw new Error("Managed child record was not created.");
      }
      await ensureFamilyBook(identity, managedUser.id);
      familyStatus.value = `${trim(identity.displayName) || "Child"} is now saved in your family space.`;
      familyError.value = "";
      return true;
    } catch (error: unknown) {
      familyError.value = extractError(error, "Unable to save child to family.");
      familyStatus.value = "";
      return false;
    }
  }

  async function backupLocalIdentityToFamily(identityId?: string) {
    if (!account.isAuthenticated.value) {
      familyError.value = "Sign in to back up child identities.";
      return false;
    }
    if (!recoveryPassphraseUnlocked.value) {
      familyError.value = "Set a recovery passphrase before backing up child identities.";
      return false;
    }
    const identity =
      localIdentities.value.find((entry) => trim(entry.id) === trim(identityId)) ||
      activeIdentity.value;
    if (!identity) {
      familyError.value = "No local child identity is selected.";
      return false;
    }
    try {
      const managedUser = await ensureManagedUser(identity);
      if (!managedUser?.id) {
        throw new Error("Managed child record was not created.");
      }

      const envelope = await encryptIdentityBackupEnvelope({
        accountId: trim(account.workspace.value?.workspaceId),
        managedUserId: managedUser.id,
        profileId: identity.id,
        identityPublicKey: identity.serializedIdentity.publicKey,
        identityKeyFingerprint: identity.fingerprint,
        label: trim(identity.displayName) || "Child collector",
        metadata: {
          source: "pixpax-v2",
        },
        clearPayload: identity,
        passphrase: recoveryPassphrase.value,
      });

      await createIdentityBackup({
        managedUserId: managedUser.id,
        backupNonce: crypto.randomUUID(),
        envelope,
      });

      familyStatus.value = `Backed up ${trim(identity.displayName) || "child"} for family recovery.`;
      familyError.value = "";
      return true;
    } catch (error: unknown) {
      familyError.value = extractError(error, "Unable to back up child identity.");
      familyStatus.value = "";
      return false;
    }
  }

  async function saveActivePixbookSnapshot() {
    if (!account.isAuthenticated.value) {
      familyError.value = "Sign in to save this Pixbook to your family space.";
      return false;
    }
    if (!activeIdentity.value) {
      familyError.value = "No child identity is active.";
      return false;
    }

    try {
      await pixbook.ensureReady();
      const managedUser = await ensureManagedUser(activeIdentity.value);
      if (!managedUser?.id) {
        throw new Error("Managed child record was not created.");
      }
      const book = await ensureFamilyBook(activeIdentity.value, managedUser.id);
      if (!book?.id) {
        throw new Error("Family Pixbook record was not created.");
      }
      const container = await pixbook.exportLedger();
      const response = await savePixbookCloudSnapshot({
        bookId: book.id,
        collectionId: FAMILY_COLLECTION_ID,
        binding: {
          profileId: activeIdentity.value.id,
          identityPublicKey: activeIdentity.value.serializedIdentity.publicKey,
          profileDisplayName: trim(activeIdentity.value.displayName) || "Child collector",
        },
        payload: createPixbookSnapshotPayload(container),
        ledgerHead: trim(container.head),
        expectedVersion: snapshotState.value.version,
        expectedLedgerHead: snapshotState.value.ledgerHead || null,
      });
      await refreshLocalLedgerHead();
      snapshotState.value = {
        bookId: trim(response.book?.id),
        version: Number.isFinite(Number(response.snapshot?.version))
          ? Number(response.snapshot?.version)
          : null,
        ledgerHead: trim(response.snapshot?.ledgerHead),
        savedAt: trim(response.snapshot?.createdAt),
      };
      familyStatus.value = "Saved this Pixbook to your family space.";
      familyError.value = "";
      return true;
    } catch (error: unknown) {
      if (error instanceof PixpaxApiError && error.status === 409) {
        familyError.value =
          "Family copy changed on another device. Open the latest family copy before saving again.";
      } else {
        familyError.value = extractError(error, "Unable to save Pixbook to family.");
      }
      familyStatus.value = "";
      return false;
    }
  }

  async function importFamilyIdentityToDevice(managedUserId: string) {
    if (!account.isAuthenticated.value) {
      familyError.value = "Sign in to recover child identities.";
      return false;
    }
    if (!recoveryPassphraseUnlocked.value) {
      familyError.value = "Set your recovery passphrase first.";
      return false;
    }

    try {
      const latest = await getLatestIdentityBackup(managedUserId);
      const recovered = await decryptIdentityBackupEnvelope({
        envelope: latest.backup.envelope,
        passphrase: recoveryPassphrase.value,
      });
      identitySession.setIdentity(
        {
          ...recovered.identity,
          managedUserId,
        },
        { makeActive: true },
      );
      familyStatus.value = "Recovered this child to the current device.";
      familyError.value = "";
      await refreshFamilyDirectory();
      return true;
    } catch (error: unknown) {
      familyError.value = extractError(error, "Unable to recover child identity.");
      familyStatus.value = "";
      return false;
    }
  }

  async function openFamilyChildOnDevice(managedUserId: string) {
    let localIdentity =
      localIdentities.value.find((entry) => trim(entry.managedUserId) === trim(managedUserId)) || null;

    if (!localIdentity) {
      const recovered = await importFamilyIdentityToDevice(managedUserId);
      if (!recovered) {
        return false;
      }
      localIdentity =
        localIdentities.value.find((entry) => trim(entry.managedUserId) === trim(managedUserId)) ||
        identitySession.identity.value;
    }

    if (!localIdentity) {
      familyError.value = "Recovered child identity could not be opened on this device.";
      return false;
    }

    identitySession.setActiveIdentity(localIdentity.id);

    try {
      await pixbook.ensureReady();
      const response = await getPixbookCloudState(
        undefined,
        {
          profileId: localIdentity.id,
          identityPublicKey: localIdentity.serializedIdentity.publicKey,
          profileDisplayName: trim(localIdentity.displayName) || "Child collector",
        },
        undefined,
        FAMILY_COLLECTION_ID,
      );
      const ledger = extractPixbookSnapshotLedger(response.snapshot?.payload);
      if (ledger) {
        await pixbook.importLedger(ledger as Awaited<ReturnType<typeof pixbook.exportLedger>>);
      } else {
        await pixbook.resetPixbook();
      }
      await refreshLocalLedgerHead();
      snapshotState.value = {
        bookId: trim(response.book?.id),
        version: Number.isFinite(Number(response.snapshot?.version))
          ? Number(response.snapshot?.version)
          : null,
        ledgerHead: trim(response.snapshot?.ledgerHead),
        savedAt: trim(response.snapshot?.createdAt),
      };
      familyStatus.value = `Opened ${trim(localIdentity.displayName) || "child"} on this device.`;
      familyError.value = "";
      return true;
    } catch (error: unknown) {
      if (error instanceof PixpaxApiError && error.status === 404) {
        await pixbook.resetPixbook();
        await refreshLocalLedgerHead();
        familyStatus.value = `Opened ${trim(localIdentity.displayName) || "child"} on this device. No family snapshot exists yet.`;
        familyError.value = "";
        return true;
      }
      familyError.value = extractError(error, "Unable to open family Pixbook.");
      familyStatus.value = "";
      return false;
    }
  }

  function unlockRecoveryPassphrase(passphrase: string) {
    const normalized = String(passphrase || "").normalize("NFC");
    recoveryPassphrase.value = normalized;
    if (normalized) {
      familyStatus.value = "Recovery passphrase unlocked for this session.";
      familyError.value = "";
      return true;
    }
    familyError.value = "Passphrase is required.";
    familyStatus.value = "";
    return false;
  }

  function clearRecoveryPassphrase() {
    recoveryPassphrase.value = "";
    familyStatus.value = "Recovery passphrase cleared.";
    familyError.value = "";
  }

  async function sendOtpCode() {
    authBusy.value = true;
    authMessage.value = "";
    try {
      await account.requestLoginOtp(authEmail.value);
      authMessage.value = "Verification code sent.";
    } catch (error: unknown) {
      authMessage.value = extractError(error, "Unable to send email verification code.");
    } finally {
      authBusy.value = false;
    }
  }

  async function submitOtpCode() {
    authBusy.value = true;
    authMessage.value = "";
    try {
      const ok = await account.loginWithOtp({
        email: authEmail.value,
        otp: authOtp.value,
      });
      if (ok) {
        authMessage.value = "Signed in to your family space.";
        authOtp.value = "";
        await refreshFamilyDirectory();
      }
      return ok;
    } catch (error: unknown) {
      authMessage.value = extractError(error, "Unable to verify code.");
      return false;
    } finally {
      authBusy.value = false;
    }
  }

  async function signInWithPasskey() {
    authBusy.value = true;
    authMessage.value = "";
    try {
      const ok = await account.loginWithPasskey();
      if (ok) {
        authMessage.value = "Signed in with passkey.";
        await refreshFamilyDirectory();
      }
      return ok;
    } catch (error: unknown) {
      authMessage.value = extractError(error, "Unable to sign in with passkey.");
      return false;
    } finally {
      authBusy.value = false;
    }
  }

  async function registerPasskeyForAccount() {
    authBusy.value = true;
    authMessage.value = "";
    try {
      await account.registerPasskey();
      authMessage.value = "Passkey added for this device.";
      return true;
    } catch (error: unknown) {
      authMessage.value = extractError(error, "Unable to add passkey.");
      return false;
    } finally {
      authBusy.value = false;
    }
  }

  async function signOutAccount() {
    authBusy.value = true;
    authMessage.value = "";
    try {
      await account.logout();
      authMessage.value = "Signed out of family backup.";
      await refreshFamilyDirectory();
    } catch (error: unknown) {
      authMessage.value = extractError(error, "Unable to sign out.");
    } finally {
      authBusy.value = false;
    }
  }

  watch(
    () => account.isAuthenticated.value,
    async () => {
      await refreshFamilyDirectory();
    },
    { immediate: true },
  );

  watch(
    () => activeIdentity.value?.id,
    async () => {
      await refreshLocalLedgerHead();
      await refreshActiveSnapshotState().catch((error: unknown) => {
        familyError.value = extractError(error, "Unable to refresh family snapshot state.");
      });
    },
    { immediate: true },
  );

  watch(
    () => pixbook.replayState.value,
    async () => {
      await refreshLocalLedgerHead();
    },
    { deep: true },
  );

  return {
    account,
    authEmail,
    authOtp,
    authBusy,
    authMessage,
    familySession,
    familyLoading: computed(() => familyLoading.value),
    familyStatus,
    familyError,
    recoveryPassphrase,
    recoveryPassphraseUnlocked,
    localIdentities,
    managedIdentities: computed(() => managedUsers.value),
    familyBooks: computed(() => familyBooks.value),
    recoverableManagedIdentities,
    activeManagedUser,
    activeBook,
    snapshotState: computed(() => snapshotState.value),
    isSnapshotDirty,
    createLocalChild,
    saveLocalIdentityToFamily,
    backupLocalIdentityToFamily,
    saveActivePixbookSnapshot,
    importFamilyIdentityToDevice,
    openFamilyChildOnDevice,
    unlockRecoveryPassphrase,
    clearRecoveryPassphrase,
    refreshFamilyDirectory,
    sendOtpCode,
    submitOtpCode,
    signInWithPasskey,
    registerPasskeyForAccount,
    signOutAccount,
  };
}
