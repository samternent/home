# SPEC 05 — Tooling: CLI, CI, and Inspector v0.2

File: specs/05-tooling-cli-ci.md  
Status: Normative  
Version: 0.2

## Purpose

Define the minimum tooling expected to make the semantic layers usable:

- CLI to manage identity, permissions, and encryption epochs
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

- `concord enc rotate --scope <scope>`

  - Computes eligible principals (read+)
  - Resolves their current age recipients
  - Generates new epoch key, increments epoch
  - Emits enc.epoch.rotate entry containing wraps

- `concord enc wrap --scope <scope> --epoch <n> --to <principalId>`

  - Emits enc.wrap.publish

- `concord enc decrypt --file <ledger> --as <principalId>` (operational)
  - Attempts to decrypt encrypted payloads where wraps exist

## Output

All commands SHOULD support:

- `--json` for machine readable output
- `--quiet` for minimal text

## Exit Codes (Normative)

- 0 success
- 1 protocol validation failure
- 2 semantic validation failure (identity/permissions/encryption rules)
- 3 authorization failure (attempted grant/rotate not allowed)
- 4 encryption/decryption failure (missing keys/wraps)

## GitHub Actions / CI

Recommended jobs:

1. Protocol Verify

- Run concord verify
- Fail build on invalid ledger

2. Semantic Replay Check

- Replay identity + permissions + epochs deterministically (deterministic mode)
- Fail on invalid semantic entries (e.g., unauthorized grants)

3. Policy Checks (optional)

- Example: only allow rootAdmins to perform enc.epoch.rotate

4. Publish Report (optional)

- Generate static report artifact:
  - commit graph summary
  - principals list
  - permissions by scope
  - epoch status and wrap coverage

## Web Inspector

A static inspector SHOULD:

- Load ledger JSON
- Verify hashes (core)
- Replay semantic layers
- Display:
  - commit chain
  - identity registry
  - permission matrix per scope
  - epoch keys coverage (wraps present / missing)
- Provide explanations:
  - “Why can’t I grant?” (missing cap)
  - “Why can’t I decrypt?” (missing wrap or missing private key)

## Determinism Note

Inspector MUST support deterministic replay without using current time unless explicitly enabled, matching the permissions spec deterministic mode.
