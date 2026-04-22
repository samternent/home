# `@ternent/solid`

Solid integrations for `@ternent/concord`.

## What it provides

- mnemonic-backed `@ternent/identity` provisioning
- passphrase-gated encrypted identity blob persistence for local cache and Solid
- encrypted Solid wallet backup primitives
- a Solid Pod-backed `LedgerStorageAdapter`
- Solid profile/bootstrap helpers for `pim:preferencesFile`, type indexes, and public verification metadata
- anonymous-read validation for private encrypted identity and wallet resources
- a high-level Concord factory for Solid sessions
- a framework-agnostic manager with `subscribe()` and `getState()`

## Install

```bash
pnpm add @ternent/solid @ternent/concord @ternent/identity
```

## Usage

```ts
import {
  createSolidIdentityCache,
  createPassphraseSolidIdentityUnlocker,
  createSolidConcordApp,
  provisionSolidIdentity,
} from "@ternent/solid";

const unlocker = createPassphraseSolidIdentityUnlocker(userProvidedPassword);
const cache = createSolidIdentityCache({ session, unlocker });

const { identity, mnemonic, resources } = await provisionSolidIdentity({
  session,
  words: 24,
  unlocker,
  cache,
  profile: {
    enabled: true,
    bootstrap: true,
    accessValidation: "strict",
  },
});

const { app, identity: appIdentity } = await createSolidConcordApp({
  session,
  plugins: [todoPlugin()],
  encryption: true,
  cache,
  unlocker,
  profile: {
    enabled: true,
    discover: true,
    accessValidation: "strict",
  },
});

await app.load();
console.log(appIdentity.keyId);
console.log(resources?.ledgerUrl);
```

`profile.bootstrap` creates or reuses the user’s `pim:preferencesFile`, public/private type indexes, stores an encrypted identity blob at canonical private app URLs, registers private resources in the private type index, and publishes a public Seal verification document linked from the WebID profile with `rdfs:seeAlso`.

When `profile.accessValidation` is `"strict"` (the default when profile mode is enabled), the library performs anonymous-read probes against private encrypted identity/wallet resources and public verification URLs.

## Security model

- WebIDs are public and are not used to derive private signing keys.
- Concord identity comes from a mnemonic-backed `@ternent/identity` seed.
- Solid is used for session access, Pod storage of encrypted identity blobs, optional encrypted wallet backup discovery, and profile/type-index resource discovery.
- Local identity cache stores encrypted identity blobs only (`ternent-solid-encrypted-identity` v2).
- Unlocking encrypted identity blobs requires an explicit passphrase unlocker from the host application.
- Concord identity is not derived from Solid auth state.
- The package preserves existing `pim:preferencesFile` and type-index links by default. It only rewires them when you explicitly override those URLs.
- Access validation is conservative: it proves unsafe public readability when it can, but it cannot guarantee every Pod’s ACL/ACP policy is configured ideally.
