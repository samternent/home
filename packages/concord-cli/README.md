# @concord/cli

CLI tooling for Concord ledgers.

## Install

```bash
pnpm add -D @concord/cli
```

## Usage

```bash
concord verify --ledger ledger.json
concord verify --ledger ledger.json --semantic
concord inspect --ledger ledger.json --json

concord identity upsert --principal did:alice --age age1alice --name "Alice"
concord identity show --ledger ledger.json --principal did:alice
concord identity list --ledger ledger.json

concord perms can --ledger ledger.json --as did:alice --scope projects:alpha --action perm:read
concord perms grant --ledger ledger.json --as did:root --scope projects:alpha --cap read --to did:bob
concord perms revoke --ledger ledger.json --as did:root --scope projects:alpha --cap read --from did:bob

concord enc rotate --ledger ledger.json --as did:root --scope projects:alpha
concord enc wrap --ledger ledger.json --as did:root --scope projects:alpha --epoch 2 --to did:bob
concord enc decrypt --ledger ledger.json --as did:bob
```

## Config

Optional config file `concord.config.json`:

```json
{
  "rootAdmins": ["did:root"]
}
```

## Output

- `--json` emits machine-readable output.
- `--quiet` suppresses non-error output.

## Exit Codes

- 0 success
- 1 protocol failure
- 2 semantic validation failure
- 3 authorization failure
- 4 encryption failure
