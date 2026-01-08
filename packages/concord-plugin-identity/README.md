# @ternent/concord-plugin-identity

Materialize identity registry state from a Concord ledger.

## Install

```bash
pnpm add @ternent/concord-plugin-identity
```

## Usage

```ts
import { replayIdentity, getPrincipal } from "@ternent/concord-plugin-identity";

const state = replayIdentity(ledger);
const alice = getPrincipal(state, "did:alice");
```

## API

- replayIdentity(ledger, head?)
- getPrincipal(state, principalId)
- resolveAgeRecipients(state, principalId)
- resolveCurrentAgeRecipient(state, principalId)
