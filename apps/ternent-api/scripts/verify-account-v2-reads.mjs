#!/usr/bin/env node

function parseArgs(argv) {
  const args = {
    api: String(process.env.ACCOUNT_VERIFY_API_BASE || "http://localhost:3000").trim(),
    cookie: String(process.env.ACCOUNT_VERIFY_COOKIE || "").trim(),
    profileId: String(process.env.ACCOUNT_VERIFY_PROFILE_ID || "").trim(),
    identityPublicKey: String(process.env.ACCOUNT_VERIFY_IDENTITY_PUBLIC_KEY || "").trim(),
    collectionId: String(process.env.ACCOUNT_VERIFY_COLLECTION_ID || "primary").trim() || "primary",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = String(argv[i] || "").trim();
    if (!arg) continue;
    if (arg === "--api" && argv[i + 1]) {
      args.api = String(argv[i + 1] || "").trim();
      i += 1;
    }
    if (arg === "--cookie" && argv[i + 1]) {
      args.cookie = String(argv[i + 1] || "").trim();
      i += 1;
    }
    if (arg === "--profile-id" && argv[i + 1]) {
      args.profileId = String(argv[i + 1] || "").trim();
      i += 1;
    }
    if (arg === "--identity-public-key" && argv[i + 1]) {
      args.identityPublicKey = String(argv[i + 1] || "").trim();
      i += 1;
    }
    if (arg === "--collection-id" && argv[i + 1]) {
      args.collectionId = String(argv[i + 1] || "").trim() || "primary";
      i += 1;
    }
  }

  return args;
}

async function requestJson(api, path, cookie) {
  const response = await fetch(`${api}${path}`, {
    headers: {
      Accept: "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} for ${path}`);
    error.body = body;
    throw error;
  }
  return body;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.cookie) {
    throw new Error("Missing session cookie. Provide --cookie or ACCOUNT_VERIFY_COOKIE.");
  }

  const session = await requestJson(args.api, "/v1/account/session", args.cookie);
  const accountId = String(session?.workspace?.accountId || session?.workspace?.workspaceId || "").trim();
  if (!accountId) {
    throw new Error("Unable to resolve accountId from /v1/account/session response.");
  }

  const users = await requestJson(
    args.api,
    `/v1/account/users?accountId=${encodeURIComponent(accountId)}`,
    args.cookie
  );

  const books = await requestJson(
    args.api,
    `/v1/account/books?accountId=${encodeURIComponent(accountId)}`,
    args.cookie
  );

  let pixbook = null;
  if (args.profileId && args.identityPublicKey) {
    const query = new URLSearchParams({
      accountId,
      profileId: args.profileId,
      identityPublicKey: args.identityPublicKey,
      collectionId: args.collectionId,
    });
    pixbook = await requestJson(args.api, `/v1/account/pixbook?${query.toString()}`, args.cookie);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        accountId,
        userCount: Array.isArray(users?.users) ? users.users.length : 0,
        bookCount: Array.isArray(books?.books) ? books.books.length : 0,
        pixbookResolved: Boolean(pixbook?.book?.id),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error?.message || String(error),
        details: error?.body || null,
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});
