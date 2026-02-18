import { requireSession, upsertAuthUserShadow } from "../../services/auth/platform-auth.mjs";
import { requirePermission } from "../../services/auth/permissions.mjs";
import {
  createBook,
  createManagedUser,
  ensurePersonalPixbook,
  ensureWorkspaceForUser,
  getLatestBookSnapshot,
  getWorkspaceSummary,
  listBooks,
  listManagedUsers,
  renameWorkspace,
  saveBookSnapshot,
  updateBook,
  updateManagedUser,
} from "../../services/account/platform-account-store.mjs";

function resolveWorkspaceId(req) {
  const header = String(req?.headers?.["x-workspace-id"] || "").trim();
  if (header) return header;
  return String(req?.query?.workspaceId || req?.body?.workspaceId || "").trim();
}

function sessionUserId(req) {
  return String(req?.platformSession?.user?.id || "").trim();
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

    const profile = ensurePersonalPixbook(
      sessionUserId(req),
      resolveWorkspaceId(req),
      {
        displayName: req.platformSession?.user?.name || req.platformSession?.user?.email || "My Pixbook",
        email: req.platformSession?.user?.email || "",
      }
    );

    const resolved = await profile;
    if (!resolved) {
      res.status(404).send({ ok: false, error: "Workspace not found." });
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

    const resolved = await ensurePersonalPixbook(
      sessionUserId(req),
      resolveWorkspaceId(req),
      {
        displayName: req.platformSession?.user?.name || req.platformSession?.user?.email || "My Pixbook",
        email: req.platformSession?.user?.email || "",
      }
    );

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
      res.status(400).send({
        ok: false,
        error: error?.message || "Unable to save pixbook snapshot.",
      });
    }
  });
}
