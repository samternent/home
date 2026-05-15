# Build a Secure concordOS Application

This tutorial shows how to build a secure concordOS app using the same API surface used by the Solid host, centered on [`useAppApi.ts`](../apps/solid/src/app/api/useAppApi.ts).

It is written for production-minded engineers: identity-first startup, least-privilege access, deterministic replay, and safe mutation patterns.

## What `useAppApi` gives you

`createAppApi()` / `useAppApi()` composes four security-critical layers:

1. **Identity service**
   - Password-protected encrypted identity blob.
   - Optional TOTP MFA.
   - Explicit lock/unlock lifecycle.
2. **Concord runtime**
   - Signed commands, staged entries, explicit commit/discard.
   - Replay-based state reconstruction.
3. **Projection plugins**
   - Domain validation and authorization rules in plugin command handlers.
4. **Typed app facade**
   - Safer wrappers (`users`, `profiles`, `permissions`) that inject actor identity from the active signer.

## Security model (short version)

- Identity is required before protected operations (`Active identity is required`).
- Permission mutations enforce signer checks (`Actor identity does not match the active signer`).
- Permission membership changes require existing membership (`Only existing group members can add/remove collaborators`).
- Profile writes are self-service only (`actorIdentityKey` must match `identityKey`).
- Replay hardening drops entries that fail author/member consistency checks.

## Step 1: Create a production-safe API instance

Use `createAppApi()` with explicit storage keys and explicit bootstrap behavior. Avoid dev bypass in production.

```ts
import { createAppApi } from "@/app/api";

const appApi = createAppApi({
  // In production, keep this false.
  devSessionUnlockBypass: false,

  // Optional but recommended for tenant/app scoping.
  identityStorageKey: "yourapp/identity/encrypted/v1",
  concordStorageKey: "yourapp/concord/ledger/v1",

  // Optional relying-party label for TOTP UX.
  rpName: "YourApp",
});

await appApi.load();
```

Production note:
- In the current implementation, `devSessionUnlockBypass` defaults to `import.meta.env.DEV` if you do not set it. Set it explicitly in production-facing code.

## Step 2: Handle identity lifecycle before app routes

Your app should gate privileged routes until identity is unlocked.

```ts
const identity = await appApi.identity.ensureUnlocked("auto");
// If locked, this throws and your UI should show unlock/onboarding flow.
```

Recommended lifecycle:

1. `ensureUnlocked("auto")` on app startup.
2. If no identity exists, create onboarding draft:
   - `createOnboardingDraft()`
   - `completeOnboarding({...})`
3. If identity exists but locked:
   - `unlockWithPassword({ password, totpCode? })`
4. On logout/lock button:
   - `await appApi.identity.lock()`

Security behaviors already enforced by the runtime:
- Password minimum length validation.
- Optional TOTP verification at onboarding/recovery/unlock.
- Encrypted identity envelope verification (metadata must match decrypted identity).

## Step 3: Use typed APIs for domain operations

Prefer typed wrappers over raw `command()` for standard operations.

```ts
await appApi.users.create({
  identityKey: teammateIdentityKey,
});

await appApi.profiles.upsert({
  identityKey: myIdentityKey,
  displayName: "Sam",
  bio: "Platform engineer",
});

await appApi.permissions.create({
  title: "Deployers",
  scope: "workspace",
});

await appApi.permissions.grantFromUser({
  permissionId,
  identityKey: teammateIdentityKey,
});
```

Why this is safer:
- Wrapper methods derive actor fields from active identity.
- You avoid client-side actor spoofing mistakes.
- `grantFromUser` resolves labels from projected user/profile state and blocks duplicate assignments.

## Step 4: Respect staged vs committed state

Concord commands stage entries first. You control durability explicitly.

```ts
await appApi.permissions.create({ title: "Approvers" });

// Visible in projection immediately:
console.log(appApi.getState().stagedCount); // 1

// Persist staged entries:
await appApi.commit({ metadata: { message: "Create Approvers group" } });

// Or drop staged entries:
await appApi.discard();
```

Security value:
- You can review and validate pending operations before commit.
- You can cancel unsafe or accidental mutations deterministically.

## Step 5: Apply least-privilege authorization in UI selectors

Permissions selectors already support viewer-aware filtering.

- `permissions.all(viewerIdentityKey, viewerIdentityId)` returns only memberships visible to viewer.
- `permissions.byId(...)` also applies viewer scoping.

In the app facade, active identity is passed through to selector calls automatically.

## Step 6: Don't expose unsafe raw command surfaces

`appApi.command(type, input)` is intentionally available for extensibility. Treat it as a privileged API.

Recommended rules:

- Do not expose free-form command execution to untrusted UI/plugin input.
- Keep an allowlist of command types your app can issue.
- Prefer typed wrappers for known operations.
- Log and monitor rejected command attempts (forged actor, unauthorized grant/revoke, malformed payloads).

## Step 7: Verify security invariants with tests

Use contract tests similar to existing v2 tests:

1. Reject forged actor IDs for permission mutations.
2. Block non-members from granting/revoking collaborators.
3. Keep replay deterministic across reload/replay.
4. Confirm staged changes are reversible via `discard()`.

A minimal pattern:

```ts
await expect(
  guestApp.command("permission.grant", {
    permissionId,
    memberId: guestIdentityKey,
    actor: { memberId: ownerIdentityKey },
  }),
).rejects.toThrow("does not match the active signer");
```

## Production hardening checklist

- [ ] Set `devSessionUnlockBypass: false` in production builds.
- [ ] Use app-scoped storage keys per environment/tenant.
- [ ] Gate protected routes on `status === "ready"` and active identity presence.
- [ ] Require explicit `commit()` actions for security-sensitive mutations.
- [ ] Handle and surface `lastError` safely without leaking sensitive internals.
- [ ] Keep identity onboarding/recovery UX explicit about mnemonic handling.
- [ ] Add CI tests for forged actor, non-member escalation, and replay invariants.

## Reference map

- App API facade: [`apps/solid/src/app/api/useAppApi.ts`](../apps/solid/src/app/api/useAppApi.ts)
- API types: [`apps/solid/src/app/api/types.ts`](../apps/solid/src/app/api/types.ts)
- Identity runtime: [`apps/solid/src/app/runtime/identity.ts`](../apps/solid/src/app/runtime/identity.ts)
- Storage adapter: [`apps/solid/src/app/runtime/storage.ts`](../apps/solid/src/app/runtime/storage.ts)
- Permissions plugin: [`apps/solid/src/app/plugins/permissions.ts`](../apps/solid/src/app/plugins/permissions.ts)
- Profiles plugin: [`apps/solid/src/app/plugins/profiles.ts`](../apps/solid/src/app/plugins/profiles.ts)
- Users plugin: [`apps/solid/src/app/plugins/users.ts`](../apps/solid/src/app/plugins/users.ts)

## Suggested next doc

If you want, the next complementary public doc should be:

- **"Threat Model for concordOS App Integrators"**
  - assets and trust boundaries
  - command forgery and replay abuse scenarios
  - required controls at UI, runtime, and plugin layers
