import { getPlatformAuthRuntime, getPlatformSession } from "./platform-auth.mjs";
import { ensureWorkspaceForUser, userHasCapability } from "../account/platform-account-store-switch.mjs";
import { resolveRequestedAccountId } from "../account/account-schema-flags.mjs";

function resolveWorkspaceFromRequest(req) {
  return resolveRequestedAccountId(req);
}

export async function isPlatformAuthReady() {
  const runtime = await getPlatformAuthRuntime();
  return runtime.ok;
}

export async function requestHasCapability(req, capability) {
  const runtime = await getPlatformAuthRuntime();
  if (!runtime.ok) {
    return {
      ok: false,
      statusCode: 503,
      error: runtime.reason,
      reason: "auth-not-configured",
    };
  }

  const sessionResult = await getPlatformSession(req);
  if (!sessionResult.ok) {
    return {
      ok: false,
      statusCode: sessionResult.statusCode,
      error: sessionResult.error,
      reason: "unauthorized",
    };
  }

  const session = sessionResult.session;
  await ensureWorkspaceForUser(session);

  const workspaceId = resolveWorkspaceFromRequest(req);
  const permission = await userHasCapability(session.user.id, capability, workspaceId);

  if (!permission.ok) {
    return {
      ok: false,
      statusCode: 403,
      error: "Forbidden.",
      reason: permission.reason,
      session,
      workspace: permission.workspace || null,
    };
  }

  return {
    ok: true,
    statusCode: 200,
    session,
    workspace: permission.workspace,
  };
}

export function requirePermission(capability) {
  return async (req, res, next) => {
    const access = await requestHasCapability(req, capability);
    if (!access.ok) {
      res.status(access.statusCode).send({
        ok: false,
        error: access.error,
      });
      return;
    }

    req.platformSession = access.session;
    req.platformWorkspace = access.workspace || null;
    next();
  };
}
