import { getPlatformAuthNodeHandler, getPlatformAuthRuntime, getPlatformSession } from "../../services/auth/platform-auth.mjs";

export default function authRoutes(router) {
  router.get("/v1/auth/health", async (_req, res) => {
    const runtime = await getPlatformAuthRuntime();
    if (!runtime.ok) {
      res.status(503).send({
        ok: false,
        ready: false,
        error: runtime.reason,
      });
      return;
    }

    res.status(200).send({
      ok: true,
      ready: true,
    });
  });

  router.get("/v1/auth/session", async (req, res) => {
    const session = await getPlatformSession(req);
    if (!session.ok) {
      res.status(session.statusCode).send({
        ok: false,
        authenticated: false,
        error: session.error,
      });
      return;
    }

    res.status(200).send({
      ok: true,
      authenticated: true,
      session: {
        user: session.session.user,
        session: session.session.session,
      },
    });
  });

  router.all("/v1/auth/*", async (req, res, next) => {
    const handler = await getPlatformAuthNodeHandler();
    if (!handler) {
      res.status(503).send({
        ok: false,
        error:
          "Platform auth is not configured. Set AUTH_SECRET, AUTH_BASE_URL, DATABASE_URL, and install auth dependencies.",
      });
      return;
    }

    return handler(req, res, next);
  });
}
