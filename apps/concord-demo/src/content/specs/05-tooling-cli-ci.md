# SPEC 05 — Tooling: CLI, CI, and Inspector v0.2

File: specs/05-tooling-cli-ci.md  
Status: Normative  
Version: 0.2

## Purpose

Define the minimum tooling expected to make the semantic layers usable:

- CLI to manage identity and permissions
- CI to validate ledgers and enforce policies
- Web inspector to explore and explain ledger state

Tooling reflects and enforces the semantics. It does not modify core protocol rules.

## CLI Requirements

The CLI name is non-normative. Example uses “concord”.

### Core

- concord verify

  - Validates core protocol structure, hashes, and replay order
  - Exits non-zero on failure

- concord inspect
  - Prints commit chain summary
  - Lists entry kinds and counts

### Identity

- `concord identity upsert --principal <id> --age <age1...> [--name ...]`
- `concord identity show --principal <id>`
- `concord identity list`

### Permissions

- `concord perms can --as <principalId> --scope <scope> --action <perm:read|perm:write|perm:grant|perm:admin>`
- `concord perms grant --scope <scope> --cap <cap> --to <principalId|groupId> [--expires <iso>]`
- `concord perms revoke --scope <scope> --cap <cap> --from <principalId|groupId>`

Bootstrap:

- CLI must allow specifying rootAdmins in config.

### Encryption

Encryption tooling is implementation-defined. Concord does not require epoch
rotation or wrap distribution at the protocol level.

## Output

All commands SHOULD support:

- `--json` for machine readable output
- `--quiet` for minimal text

## Exit Codes (Normative)

- 0 success
- 1 protocol validation failure
- 2 semantic validation failure (identity/permissions rules)
- 3 authorization failure (attempted grant/rotate not allowed)
- 4 encryption/decryption failure

## GitHub Actions / CI

Recommended jobs:

1. Protocol Verify

- Run concord verify
- Fail build on invalid ledger

2. Semantic Replay Check

- Replay identity + permissions deterministically (deterministic mode)
- Fail on invalid semantic entries (e.g., unauthorized grants)

3. Policy Checks (optional)

- Example: only allow rootAdmins to perform permission changes

4. Publish Report (optional)

- Generate static report artifact:
  - commit graph summary
  - principals list
  - permissions by scope
  - encryption status (optional)

## Web Inspector

A static inspector SHOULD:

- Load ledger JSON
- Verify hashes (core)
- Replay semantic layers
- Display:
  - commit chain
  - identity registry
  - permission matrix per scope
  - encryption coverage (optional)
- Provide explanations:
  - “Why can’t I grant?” (missing cap)
  - “Why can’t I decrypt?” (missing private key or payload metadata)

## Determinism Note

Inspector MUST support deterministic replay without using current time unless explicitly enabled, matching the permissions spec deterministic mode.
