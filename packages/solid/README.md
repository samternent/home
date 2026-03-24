# `@ternent/solid`

Solid integrations for `@ternent/concord`.

## What it provides

- mnemonic-backed `@ternent/identity` provisioning and recovery
- encrypted Solid wallet backup primitives
- a Solid Pod-backed `LedgerStorageAdapter`
- Solid profile/bootstrap helpers for `pim:preferencesFile`, type indexes, and public verification metadata
- anonymous-read validation for private mnemonic and wallet resources
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
  createSolidConcordApp,
  provisionSolidIdentity,
} from "@ternent/solid";

const cache = createSolidIdentityCache({ session });

const { identity, mnemonic, resources } = await provisionSolidIdentity({
  session,
  words: 24,
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
  profile: {
    enabled: true,
    discover: true,
    accessValidation: "strict",
  },
  walletPassphrase: mnemonic,
});

await app.load();
console.log(appIdentity.keyId);
console.log(resources?.ledgerUrl);
```

`profile.bootstrap` creates or reuses the user’s `pim:preferencesFile`, public/private type indexes, stores the mnemonic and wallet at canonical private app URLs, registers those resources in the private type index, and publishes a public Seal verification document linked from the WebID profile with `rdfs:seeAlso`.

When `profile.accessValidation` is `"strict"` (the default when profile mode is enabled), the library performs anonymous-read probes against the mnemonic, wallet, and verification URLs. It will refuse to continue if the mnemonic or wallet secret is publicly readable.

## Security model

- WebIDs are public and are not used to derive private signing keys.
- Concord identity comes from a mnemonic-backed `@ternent/identity` seed.
- Solid is used for session access, Pod storage, encrypted wallet backup discovery, and profile/type-index resource discovery.
- For recovery on a new device, log into Solid and decrypt the wallet backup with the mnemonic or another wrapping passphrase.
- Local identity cache is for same-device UX. It stores the unlocked serialized identity on the current device and should be treated as device-secret state.
- Solid mnemonic secrets are intentionally full-secret materials. If you store the mnemonic in a private Pod secret, access to that secret is equivalent to access to the account keys.
- The package preserves existing `pim:preferencesFile` and type-index links by default. It only rewires them when you explicitly override those URLs.
- Access validation is conservative: it proves unsafe public readability when it can, but it cannot guarantee every Pod’s ACL/ACP policy is configured ideally.
