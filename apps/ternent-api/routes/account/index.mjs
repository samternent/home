import { requireSession, upsertAuthUserShadow } from "../../services/auth/platform-auth.mjs";
import { requirePermission } from "../../services/auth/permissions.mjs";
import {
  BookSnapshotConflictError,
  createBook,
  createManagedUser,
  derivePersonalPixbookUserKey,
  ensurePersonalPixbook,
  ensureWorkspaceForUser,
  getBookForWorkspace,
  getLatestBookSnapshot,
  getWorkspaceSummary,
  listBooks,
  listManagedUsers,
  removeManagedUserIdentity,
  renameWorkspace,
  saveBookSnapshot,
  updateBook,
  updateManagedUser,
} from "../../services/account/platform-account-store.mjs";

const DEFAULT_COLLECTION_ID = "primary";

function resolveWorkspaceId(req) {
  const header = String(req?.headers?.["x-workspace-id"] || "").trim();
  if (header) return header;
  return String(req?.query?.workspaceId || req?.body?.workspaceId || "").trim();
}

function sessionUserId(req) {
  return String(req?.platformSession?.user?.id || "").trim();
}

function resolveBookId(req) {
  return String(
    req?.headers?.["x-book-id"] ||
      req?.query?.bookId ||
      req?.body?.bookId ||
      ""
  ).trim();
}

function resolveCollectionId(req) {
  return (
    String(
      req?.headers?.["x-pixbook-collection-id"] ||
        req?.query?.collectionId ||
        req?.body?.collectionId ||
        ""
    ).trim() || DEFAULT_COLLECTION_ID
  );
}

function resolveProfileBinding(req) {
  const profileId = String(
    req?.headers?.["x-pixbook-profile-id"] ||
      req?.query?.profileId ||
      req?.body?.profileId ||
      ""
  ).trim();
  const identityPublicKey = String(
    req?.headers?.["x-pixbook-identity-key"] ||
      req?.query?.identityPublicKey ||
      req?.body?.identityPublicKey ||
      ""
  ).trim();
  const profileDisplayName = String(
    req?.headers?.["x-pixbook-profile-name"] ||
      req?.query?.profileDisplayName ||
      req?.body?.profileDisplayName ||
      ""
  ).trim();
  return {
    profileId,
    identityPublicKey,
    profileDisplayName,
    isBound: Boolean(profileId && identityPublicKey),
  };
}

export default function accountRoutes(router) {
  router.get("/v1/account/session", requireSession, async (req, res) => {
    try {
      await upsertAuthUserShadow(req.platformSession);
      await ensureWorkspaceForUser(req.platformSession);
    } catch (error) {
      console.error("[account] ensure session workspace failed:", error);
    }

    const user = req.platformSession?.user || null;
    const workspace = await getWorkspaceSummary(sessionUserId(req), resolveWorkspaceId(req));

    res.status(200).send({
      ok: true,
      user,
      workspace,
    });
  });

  router.get(
    "/v1/account/workspace",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      const workspace = await getWorkspaceSummary(sessionUserId(req), resolveWorkspaceId(req));
      if (!workspace) {
        res.status(404).send({ ok: false, error: "Workspace not found." });
        return;
      }
      res.status(200).send({ ok: true, workspace });
    }
  );

  router.patch(
    "/v1/account/workspace",
    requirePermission("platform.workspace.manage"),
    async (req, res) => {
      try {
        const workspace = await renameWorkspace(
          sessionUserId(req),
          resolveWorkspaceId(req),
          req.body?.name
        );
        if (!workspace) {
          res.status(404).send({ ok: false, error: "Workspace not found." });
          return;
        }
        res.status(200).send({ ok: true, workspace });
      } catch (error) {
        res.status(400).send({ ok: false, error: error?.message || "Unable to update workspace." });
      }
    }
  );

  router.get("/v1/account/users", requirePermission("platform.account.manage"), async (req, res) => {
    const data = await listManagedUsers(sessionUserId(req), resolveWorkspaceId(req));
    if (!data) {
      res.status(404).send({ ok: false, error: "Workspace not found." });
      return;
    }
    res.status(200).send({
      ok: true,
      workspaceId: data.workspace.id,
      users: data.users,
    });
  });

  router.post("/v1/account/users", requirePermission("platform.account.manage"), async (req, res) => {
    try {
      const created = await createManagedUser(sessionUserId(req), resolveWorkspaceId(req), req.body);
      if (!created) {
        res.status(404).send({ ok: false, error: "Workspace not found." });
        return;
      }
      res.status(201).send({
        ok: true,
        id: created.id,
      });
    } catch (error) {
      res.status(400).send({ ok: false, error: error?.message || "Unable to create managed user." });
    }
  });

  router.patch(
    "/v1/account/users/:userId",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      try {
        const updated = await updateManagedUser(
          sessionUserId(req),
          resolveWorkspaceId(req),
          req.params?.userId,
          req.body
        );
        if (!updated) {
          res.status(404).send({ ok: false, error: "Managed user not found." });
          return;
        }
        res.status(200).send({ ok: true, id: updated.id });
      } catch (error) {
        res.status(400).send({ ok: false, error: error?.message || "Unable to update managed user." });
      }
    }
  );

  router.delete(
    "/v1/account/users/:userId/identity",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      try {
        const removed = await removeManagedUserIdentity(
          sessionUserId(req),
          resolveWorkspaceId(req),
          req.params?.userId
        );
        if (!removed) {
          res.status(404).send({ ok: false, error: "Managed user not found." });
          return;
        }
        res.status(200).send({
          ok: true,
          id: removed.id,
          removedBookIds: removed.removedBookIds || [],
        });
      } catch (error) {
        res.status(400).send({
          ok: false,
          error: error?.message || "Unable to remove managed identity.",
        });
      }
    }
  );

  router.get("/v1/account/books", requirePermission("platform.account.manage"), async (req, res) => {
    const data = await listBooks(sessionUserId(req), resolveWorkspaceId(req));
    if (!data) {
      res.status(404).send({ ok: false, error: "Workspace not found." });
      return;
    }
    res.status(200).send({
      ok: true,
      workspaceId: data.workspace.id,
      books: data.books,
    });
  });

  router.post("/v1/account/books", requirePermission("platform.account.manage"), async (req, res) => {
    try {
      const created = await createBook(sessionUserId(req), resolveWorkspaceId(req), req.body);
      if (!created) {
        res.status(404).send({ ok: false, error: "Workspace not found." });
        return;
      }
      res.status(201).send({
        ok: true,
        id: created.id,
      });
    } catch (error) {
      res.status(400).send({ ok: false, error: error?.message || "Unable to create book." });
    }
  });

  router.patch(
    "/v1/account/books/:bookId",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      try {
        const updated = await updateBook(
          sessionUserId(req),
          resolveWorkspaceId(req),
          req.params?.bookId,
          req.body
        );
        if (!updated) {
          res.status(404).send({ ok: false, error: "Book not found." });
          return;
        }
        res.status(200).send({ ok: true, id: updated.id });
      } catch (error) {
        res.status(400).send({ ok: false, error: error?.message || "Unable to update book." });
      }
    }
  );

  router.get("/v1/account/pixbook", requireSession, async (req, res) => {
    try {
      await upsertAuthUserShadow(req.platformSession);
      await ensureWorkspaceForUser(req.platformSession);
    } catch (error) {
      console.error("[account] ensure pixbook workspace failed:", error);
    }

    const profileBinding = resolveProfileBinding(req);
    const requestedBookId = resolveBookId(req);
    const requestedCollectionId = resolveCollectionId(req);
    if (!profileBinding.isBound) {
      res.status(400).send({
        ok: false,
        error: "profileId and identityPublicKey are required for pixbook profile resolution.",
        code: "PIXBOOK_PROFILE_BINDING_REQUIRED",
      });
      return;
    }

    const resolved = requestedBookId
      ? await getBookForWorkspace(sessionUserId(req), resolveWorkspaceId(req), requestedBookId)
      : await ensurePersonalPixbook(
          sessionUserId(req),
          resolveWorkspaceId(req),
          {
            displayName:
              profileBinding.profileDisplayName ||
              req.platformSession?.user?.name ||
              req.platformSession?.user?.email ||
              "My Pixbook",
            email: req.platformSession?.user?.email || "",
          },
          profileBinding,
          { collectionId: requestedCollectionId }
        );

    if (!resolved) {
      res.status(404).send({ ok: false, error: "Pixbook not found." });
      return;
    }

    const expectedUserKey = derivePersonalPixbookUserKey(
      sessionUserId(req),
      profileBinding
    );
    const matchesIdentityBinding =
      String(resolved.managedUser.profileId || "") === profileBinding.profileId &&
      String(resolved.managedUser.identityKeyFingerprint || "") ===
        profileBinding.identityKeyFingerprint;
    if (resolved.managedUser.userKey !== expectedUserKey && !matchesIdentityBinding) {
      res.status(409).send({
        ok: false,
        code: "PIXBOOK_BOOK_PROFILE_MISMATCH",
        error:
          "Selected book belongs to a different profile identity. Load that profile first.",
      });
      return;
    }
    if (String(resolved.book.collectionId || "").trim() !== requestedCollectionId) {
      res.status(409).send({
        ok: false,
        code: "PIXBOOK_BOOK_COLLECTION_MISMATCH",
        error:
          "Selected book belongs to a different collection. Switch collection before opening this pixbook.",
      });
      return;
    }

    const snapshot = await getLatestBookSnapshot(resolved.book.id);

    res.status(200).send({
      ok: true,
      workspaceId: resolved.workspace.id,
      managedUser: resolved.managedUser,
      book: resolved.book,
      snapshot,
    });
  });

  router.put("/v1/account/pixbook/snapshot", requireSession, async (req, res) => {
    try {
      await upsertAuthUserShadow(req.platformSession);
      await ensureWorkspaceForUser(req.platformSession);
    } catch (error) {
      console.error("[account] ensure pixbook workspace failed:", error);
    }

    const profileBinding = resolveProfileBinding(req);
    if (!profileBinding.isBound) {
      res.status(400).send({
        ok: false,
        error: "profileId and identityPublicKey are required to save cloud pixbook snapshots.",
        code: "PIXBOOK_PROFILE_BINDING_REQUIRED",
      });
      return;
    }

    const requestedBookId = resolveBookId(req);
    const requestedCollectionId = resolveCollectionId(req);

    let resolved = null;
    if (requestedBookId) {
      const byBookId = await getBookForWorkspace(
        sessionUserId(req),
        resolveWorkspaceId(req),
        requestedBookId
      );
      if (!byBookId) {
        res.status(404).send({ ok: false, error: "Book not found." });
        return;
      }

      const expectedUserKey = derivePersonalPixbookUserKey(
        sessionUserId(req),
        profileBinding
      );
      const matchesIdentityBinding =
        String(byBookId.managedUser.profileId || "") === profileBinding.profileId &&
        String(byBookId.managedUser.identityKeyFingerprint || "") ===
          profileBinding.identityKeyFingerprint;
      if (byBookId.managedUser.userKey !== expectedUserKey && !matchesIdentityBinding) {
        res.status(409).send({
          ok: false,
          code: "PIXBOOK_BOOK_PROFILE_MISMATCH",
          error:
            "Selected book belongs to a different profile identity. Load that profile first.",
        });
        return;
      }
      if (String(byBookId.book.collectionId || "").trim() !== requestedCollectionId) {
        res.status(409).send({
          ok: false,
          code: "PIXBOOK_BOOK_COLLECTION_MISMATCH",
          error:
            "Selected book belongs to a different collection. Switch collection before saving.",
        });
        return;
      }
      resolved = byBookId;
    } else {
      resolved = await ensurePersonalPixbook(
        sessionUserId(req),
        resolveWorkspaceId(req),
        {
          displayName:
            profileBinding.profileDisplayName ||
            req.platformSession?.user?.name ||
            req.platformSession?.user?.email ||
            "My Pixbook",
          email: req.platformSession?.user?.email || "",
        },
        profileBinding,
        { collectionId: requestedCollectionId }
      );
    }

    if (!resolved) {
      res.status(404).send({ ok: false, error: "Workspace not found." });
      return;
    }

    try {
      const saved = await saveBookSnapshot(
        sessionUserId(req),
        resolved.workspace.id,
        resolved.book.id,
        {
          payload: req.body?.payload,
          ledgerHead: req.body?.ledgerHead,
          expectedVersion: req.body?.expectedVersion,
          expectedLedgerHead: req.body?.expectedLedgerHead,
        }
      );

      res.status(200).send({
        ok: true,
        workspaceId: resolved.workspace.id,
        managedUser: resolved.managedUser,
        book: {
          ...resolved.book,
          currentVersion: saved?.version ?? resolved.book.currentVersion,
        },
        snapshot: saved,
      });
    } catch (error) {
      if (error instanceof BookSnapshotConflictError) {
        res.status(409).send({
          ok: false,
          error: error.message,
          code: error.code,
          conflict: error.details || null,
        });
        return;
      }
      res.status(400).send({
        ok: false,
        error: error?.message || "Unable to save pixbook snapshot.",
      });
    }
  });
}
