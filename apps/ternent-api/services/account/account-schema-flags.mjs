function isTruthy(value, fallback = false) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return fallback;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

export function getAccountSchemaFlags() {
  return {
    readsV2: isTruthy(process.env.ACCOUNT_SCHEMA_V2_READS, false),
    writesV2: isTruthy(process.env.ACCOUNT_SCHEMA_V2_WRITES, false),
    dualWrite: isTruthy(process.env.ACCOUNT_SCHEMA_V2_DUAL_WRITE, false),
    acceptWorkspaceAlias: isTruthy(process.env.ACCOUNT_API_ACCEPT_WORKSPACE_ALIAS, true),
  };
}

export function resolveRequestedAccountId(req, options = {}) {
  const flags = options.flags || getAccountSchemaFlags();

  const accountId =
    String(req?.headers?.["x-account-id"] || "").trim() ||
    String(req?.query?.accountId || req?.body?.accountId || "").trim();

  if (accountId) return accountId;
  if (!flags.acceptWorkspaceAlias) return "";

  return (
    String(req?.headers?.["x-workspace-id"] || "").trim() ||
    String(req?.query?.workspaceId || req?.body?.workspaceId || "").trim()
  );
}

export function asAccountAliasPayload(accountId) {
  const id = String(accountId || "").trim();
  return {
    accountId: id,
    workspaceId: id,
  };
}
