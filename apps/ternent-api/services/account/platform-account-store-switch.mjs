import * as v1 from "./platform-account-store.mjs";
import * as v2 from "./platform-account-store-v2.mjs";
import { getAccountSchemaFlags } from "./account-schema-flags.mjs";

function resolveReadStore(flags) {
  return flags.readsV2 ? v2 : v1;
}

function resolveWriteStores(flags) {
  const primary = flags.writesV2 ? v2 : v1;
  let mirror = null;
  if (flags.dualWrite) {
    mirror = flags.writesV2 ? v1 : v2;
  } else {
    const readStore = resolveReadStore(flags);
    if (readStore !== primary) {
      mirror = readStore;
    }
  }
  return { primary, mirror };
}

function normalizeCompare(value) {
  if (value == null) return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function logDualWriteIssue(operation, kind, payload) {
  console.error(
    "[account-schema-dual-write]",
    JSON.stringify({
      operation,
      kind,
      payload,
      timestamp: new Date().toISOString(),
    })
  );
}

async function runRead(operation, args) {
  const flags = getAccountSchemaFlags();
  const store = resolveReadStore(flags);
  return store[operation](...args);
}

async function runWrite(operation, args, options = {}) {
  const flags = getAccountSchemaFlags();
  const { primary, mirror } = resolveWriteStores(flags);

  const primaryResult = await primary[operation](...args);
  if (!mirror) {
    return primaryResult;
  }

  let mirrorArgs = args;
  if (typeof options.buildMirrorArgs === "function") {
    mirrorArgs = options.buildMirrorArgs({ args, primaryResult }) || args;
  }

  try {
    const mirrorResult = await mirror[operation](...mirrorArgs);

    const primaryComparable = normalizeCompare(primaryResult);
    const mirrorComparable = normalizeCompare(mirrorResult);
    if (JSON.stringify(primaryComparable) !== JSON.stringify(mirrorComparable)) {
      logDualWriteIssue(operation, "result-mismatch", {
        primary: primaryComparable,
        mirror: mirrorComparable,
      });
    }
  } catch (error) {
    logDualWriteIssue(operation, "mirror-error", {
      error: error?.message || String(error),
    });
  }

  return primaryResult;
}

export const BookSnapshotConflictError = v1.BookSnapshotConflictError;
export const derivePersonalPixbookUserKey = v1.derivePersonalPixbookUserKey;

export async function getPrimaryWorkspaceForUser(...args) {
  return runRead("getPrimaryWorkspaceForUser", args);
}

export async function ensureWorkspaceForUser(...args) {
  return runWrite("ensureWorkspaceForUser", args, {
    buildMirrorArgs: ({ args: [session], primaryResult }) => [
      session,
      {
        workspaceId: primaryResult?.id,
        memberId: primaryResult?.member_id,
      },
    ],
  });
}

export async function resolveWorkspaceForUser(...args) {
  return runRead("resolveWorkspaceForUser", args);
}

export async function listCapabilitiesForMember(...args) {
  return runRead("listCapabilitiesForMember", args);
}

export async function userHasCapability(...args) {
  return runRead("userHasCapability", args);
}

export async function getWorkspaceSummary(...args) {
  return runRead("getWorkspaceSummary", args);
}

export async function renameWorkspace(...args) {
  return runWrite("renameWorkspace", args);
}

export async function listManagedUsers(...args) {
  return runRead("listManagedUsers", args);
}

export async function resetManagedIdentityData(...args) {
  return runWrite("resetManagedIdentityData", args);
}

export async function createManagedUser(...args) {
  return runWrite("createManagedUser", args, {
    buildMirrorArgs: ({ args: [userId, workspaceId, input], primaryResult }) => [
      userId,
      workspaceId,
      {
        ...(input || {}),
        ...(primaryResult?.id ? { id: primaryResult.id } : {}),
      },
    ],
  });
}

export async function updateManagedUser(...args) {
  return runWrite("updateManagedUser", args);
}

export async function listBooks(...args) {
  return runRead("listBooks", args);
}

export async function getBookForWorkspace(...args) {
  return runRead("getBookForWorkspace", args);
}

export async function createBook(...args) {
  return runWrite("createBook", args, {
    buildMirrorArgs: ({ args: [userId, workspaceId, input], primaryResult }) => [
      userId,
      workspaceId,
      {
        ...(input || {}),
        ...(primaryResult?.id ? { id: primaryResult.id } : {}),
      },
    ],
  });
}

export async function updateBook(...args) {
  return runWrite("updateBook", args);
}

export async function removeBook(...args) {
  return runWrite("removeBook", args);
}

export async function ensurePersonalPixbook(...args) {
  return runWrite("ensurePersonalPixbook", args, {
    buildMirrorArgs: ({ args: [userId, workspaceId, defaults, binding, options], primaryResult }) => [
      userId,
      workspaceId,
      defaults,
      binding,
      {
        ...(options || {}),
        ...(primaryResult?.managedUser?.id ? { managedUserId: primaryResult.managedUser.id } : {}),
        ...(primaryResult?.book?.id ? { bookId: primaryResult.book.id } : {}),
      },
    ],
  });
}

export async function removeManagedUserIdentity(...args) {
  return runWrite("removeManagedUserIdentity", args);
}

export async function getLatestBookSnapshot(...args) {
  return runRead("getLatestBookSnapshot", args);
}

export async function saveBookSnapshot(...args) {
  return runWrite("saveBookSnapshot", args, {
    buildMirrorArgs: ({ args: [userId, workspaceId, bookId, input], primaryResult }) => [
      userId,
      workspaceId,
      bookId,
      {
        ...(input || {}),
        ...(primaryResult?.id ? { snapshotId: primaryResult.id } : {}),
        ...(primaryResult?.createdAt ? { savedAt: primaryResult.createdAt } : {}),
      },
    ],
  });
}
