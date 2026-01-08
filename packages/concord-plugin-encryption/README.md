# @ternent/concord-plugin-encryption

Materialize encryption metadata for scope epochs and wraps from a Concord ledger.

## Install

```bash
pnpm add @ternent/concord-plugin-encryption
```

## Usage

```ts
import {
  replayEncryption,
  findWrapsForPrincipal,
  explainWhyCannotDecrypt,
} from "@ternent/concord-plugin-encryption";

const state = replayEncryption(ledger, undefined, {
  permissionsConfig: { rootAdmins: ["did:root"] },
});

const wraps = findWrapsForPrincipal(state, "did:alice", "projects:alpha", 2);
const diagnostics = explainWhyCannotDecrypt(
  state,
  "did:alice",
  "projects:alpha",
  2,
  { permissionsState, identityState }
);
```

## API

- replayEncryption(ledger, head?, config?)
- findWrapsForPrincipal(state, principalId, scope, epoch)
- explainWhyCannotDecrypt(state, principalId, scope, epoch, context?)
