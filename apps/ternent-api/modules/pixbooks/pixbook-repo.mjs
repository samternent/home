import {
  asAccountAliasPayload,
} from "../../services/account/account-schema-flags.mjs";
import {
  createBook,
  ensurePersonalPixbook,
  getBookForWorkspace,
  getWorkspaceSummary,
  listBooks,
} from "../../services/account/platform-account-store-switch.mjs";

function trim(value) {
  return String(value || "").trim();
}

function normalizeCollectionId(value) {
  return trim(value) || "primary";
}

export function createPixbookRepo() {
  return {
    async getWorkspaceForUser(userId, accountId) {
      return getWorkspaceSummary(trim(userId), trim(accountId));
    },

    async listBooksForAccount(userId, accountId) {
      const data = await listBooks(trim(userId), trim(accountId));
      if (!data) return null;
      return {
        ...asAccountAliasPayload(data.workspace.id),
        workspace: data.workspace,
        books: data.books || [],
      };
    },

    async getBookForAccount(userId, accountId, bookId) {
      const resolved = await getBookForWorkspace(trim(userId), trim(accountId), trim(bookId));
      if (!resolved) return null;
      return resolved;
    },

    async ensureBookForProfile({
      userId,
      accountId,
      profileBinding,
      profileDefaults,
      collectionId,
      createIfMissing,
      bookId,
    }) {
      if (bookId) {
        return getBookForWorkspace(trim(userId), trim(accountId), trim(bookId));
      }

      return ensurePersonalPixbook(
        trim(userId),
        trim(accountId),
        profileDefaults,
        profileBinding,
        {
          collectionId: normalizeCollectionId(collectionId),
          createIfMissing: Boolean(createIfMissing),
        }
      );
    },

    async createBookForManagedUser({
      id,
      userId,
      accountId,
      managedUserId,
      name,
      collectionId,
    }) {
      const created = await createBook(trim(userId), trim(accountId), {
        id: trim(id) || undefined,
        managedUserId: trim(managedUserId),
        name: trim(name) || "My Pixbook",
        collectionId: normalizeCollectionId(collectionId),
      });
      if (!created?.id) return null;
      return getBookForWorkspace(trim(userId), trim(accountId), created.id);
    },
  };
}
