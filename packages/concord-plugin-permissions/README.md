# @ternent/concord-plugin-permissions

Materialize permissions registry state from a Concord ledger.

## Install

```bash
pnpm add @ternent/concord-plugin-permissions
```

## Usage

```ts
import {
  replayPermissions,
  getEffectiveCaps,
  can,
} from "@ternent/concord-plugin-permissions";

const state = replayPermissions(ledger, undefined, {
  rootAdmins: ["did:root"],
});

const caps = getEffectiveCaps(state, "did:alice", "projects:alpha");
const allowed = can(state, "did:alice", "perm:write", "projects:alpha");
```

## API

- replayPermissions(ledger, head?, config?)
- getEffectiveCaps(state, principalId, scope, nowIso?)
- can(state, principalId, action, scope, nowIso?)
