# @concord/cli

CLI tooling for Concord ledgers.

## Install

```bash
pnpm add -D @concord/cli
```

## Usage

```bash
concord init --out ledger.json
concord init --out ledger.json --timestamp 2024-01-01T00:00:00.000Z

concord entry create --kind identity.upsert --author did:alice --payload '{"principalId":"did:alice"}'
concord entry create --kind perm.grant --author did:root --payload @entry.json

concord append --ledger ledger.json --entry @entry.json
concord append --ledger ledger.json --entry @entry-1.json --entry @entry-2.json
concord append --ledger ledger.json --entry @entry.json --metadata '{"note":"batch"}' --out next-ledger.json

concord verify --ledger ledger.json
concord verify --ledger ledger.json --semantic
concord inspect --ledger ledger.json --json

concord identity upsert --principal did:alice --age age1alice --name "Alice"
concord identity upsert --principal did:alice --age age1alice --name "Alice" --write --ledger ledger.json
concord identity show --ledger ledger.json --principal did:alice
concord identity list --ledger ledger.json

concord perms can --ledger ledger.json --as did:alice --scope projects:alpha --action perm:read
concord perms can --ledger ledger.json --as did:alice --scope projects:alpha --action perm:read --now 2024-01-01T00:00:00.000Z
concord perms grant --ledger ledger.json --as did:root --scope projects:alpha --cap read --to did:bob
concord perms grant --ledger ledger.json --as did:root --scope projects:alpha --cap read --to did:bob --write
concord perms revoke --ledger ledger.json --as did:root --scope projects:alpha --cap read --from did:bob
concord perms revoke --ledger ledger.json --as did:root --scope projects:alpha --cap read --from did:bob --write

concord enc rotate --ledger ledger.json --as did:root --scope projects:alpha
concord enc rotate --ledger ledger.json --as did:root --scope projects:alpha --write
concord enc wrap --ledger ledger.json --as did:root --scope projects:alpha --epoch 2 --to did:bob
concord enc wrap --ledger ledger.json --as did:root --scope projects:alpha --epoch 2 --to did:bob --write
concord enc decrypt --ledger ledger.json --as did:bob
concord enc decrypt --ledger ledger.json --as did:bob --now 2024-01-01T00:00:00.000Z
```

## Commands

### concord init

Create a new ledger with a genesis commit.

```bash
concord init --out <path> [--timestamp <iso>]
```

### concord entry create

Create an entry JSON without modifying a ledger.

```bash
concord entry create --kind <kind> --author <author> --payload <json|@file> [--timestamp <iso>]
```

### concord append

Append one or more entries into a new commit and update the ledger head.

```bash
concord append --ledger <path> --entry <json|@file> [--entry <json|@file> ...] [--metadata <json|@file>] [--timestamp <iso>] [--out <path>]
```

### concord verify

Verify protocol structure and optionally semantic rules.

```bash
concord verify --ledger <path> [--semantic]
```

### concord inspect

Inspect ledger summary.

```bash
concord inspect --ledger <path>
```

### concord identity

Upsert and read identity entries.

```bash
concord identity upsert --principal <did> [--name <displayName>] [--age <recipient>] [--write|--append --ledger <path>] [--out <path>]
concord identity show --ledger <path> --principal <did>
concord identity list --ledger <path>
```

### concord perms

Permissions checks and entries.

```bash
concord perms can --ledger <path> --as <principal> --scope <scope> --action <action> [--now <iso>]
concord perms grant --ledger <path> --as <principal> --scope <scope> --cap <cap> --to <principal|group:...> [--expires <iso>] [--write|--append] [--out <path>]
concord perms revoke --ledger <path> --as <principal> --scope <scope> --cap <cap> --from <principal|group:...> [--reason <text>] [--write|--append] [--out <path>]
```

### concord enc

Encryption epoch and wrap helpers.

```bash
concord enc rotate --ledger <path> --as <principal> --scope <scope> [--write|--append] [--out <path>]
concord enc wrap --ledger <path> --as <principal> --scope <scope> --epoch <number> --to <principal> [--age <recipient>] [--write|--append] [--out <path>]
concord enc decrypt --ledger <path> --as <principal> [--now <iso>]
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
- `--write` or `--append` appends the generated entry to the ledger instead of printing the entry JSON.
- `--out` writes to a separate output ledger file for commands that write ledgers.
- `--timestamp` overrides commit or entry timestamp where supported.

## Exit Codes

- 0 success
- 1 protocol failure
- 2 semantic validation failure
- 3 authorization failure
- 4 encryption failure
