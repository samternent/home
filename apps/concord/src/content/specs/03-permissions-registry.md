# SPEC 03 — Semantic Model: Permissions Registry v0.2

File: specs/03-permissions-registry.md  
Status: Normative  
Version: 0.2

## Purpose

Define a deterministic “Permissions Registry” semantic layer that materializes access control state from ledger entries.

This layer mirrors the “permissions table” concept:

- Grants are rows
- Revokes are rows (optional but included in v0.2)
- Effective capabilities are computed by replay

This layer depends on Identity Registry only for convenience (e.g., tooling), not for correctness of can().

## Core Concepts

### Scope

A string namespace, e.g.:

- projects:alpha
- journal:sam:2026

### Capabilities

Allowed capability values:

- read
- write
- grant
- admin

Implications:

- admin implies grant, write, read
- grant implies read

### Targets

v0.2 supports principal targets and groups.

Target forms:

- { "type": "principal", "id": "did:key:..." }
- { "type": "group", "id": "group:..." }

## Bootstrap

Permissions requires initial authority.

Bootstrap rule (Normative for v0.2):

- Tooling MUST accept a configuration array rootAdmins: principalId[]
- rootAdmins are treated as having admin for all scopes

Example:

```
{
"rootAdmins": ["did:key:alice..."]
}
```

## Groups

### Entry Kind: group.upsert

Payload:

```
{
"groupId": "group:engineering",
"displayName": "Engineering"
}
```

Rules:

- First group.upsert for a groupId sets group owner = entry.author
- Subsequent group.upsert may only be authored by group owner or rootAdmin

### Entry Kind: group.member.add

Payload:

```
{
"groupId": "group:engineering",
"principalId": "did:key:..."
}
```

### Entry Kind: group.member.remove

Payload:

```
{
"groupId": "group:engineering",
"principalId": "did:key:..."
}
```

Rules for membership changes:

- Only group owner or rootAdmin may add/remove members
- Membership is effective from the entry forward (replay-ordered)

## Grants and Revokes

### Entry Kind: perm.grant

Payload:

```
{
"scope": "projects:alpha",
"cap": "read",
"target": { "type": "principal", "id": "did:key:bob..." },
"constraints": {
"expires": "2026-06-01T00:00:00Z",
"note": "optional"
}
}
```

Rules:

- author must have effective grant or admin for scope at the point just before applying this entry
- cap must be one of: read, write, grant, admin
- constraints.expires, if present, is ISO-8601
- Grants accumulate (union)

### Entry Kind: perm.revoke

Payload:

```
{
"scope": "projects:alpha",
"cap": "read",
"target": { "type": "principal", "id": "did:key:bob..." },
"reason": "optional"
}
```

Rules:

- author must have effective admin for scope at the point just before applying this entry
- Revokes take effect from that point forward
- A later perm.grant can re-enable

## Effective Capability Computation

To compute effective caps for a principal in a scope at some replay point:

1. Start with implied caps from rootAdmins if principal is in rootAdmins.
2. Expand group membership: principal is member of groups if group.member.add without subsequent remove has occurred.
3. Collect all active grants in scope:
   - Direct grants to principal
   - Grants to groups the principal is a current member of
4. Remove expired grants (if constraints.expires is in the past relative to “nowIso” parameter; if no nowIso supplied, treat as non-expiring for deterministic verification mode)
5. Apply revokes:
   - Any revoke matching (scope, cap, principal) disables that cap from that point forward, unless re-granted later
   - For group-targeted grants, revoking a principal does not alter group membership; it only affects effective caps.

Implied caps:

- admin ⇒ grant, write, read
- grant ⇒ read

## Authorization API (Normative)

Permissions tooling MUST expose:

- getEffectiveCaps(state, principalId, scope, nowIso?) → Set
- can(state, principalId, action, scope, nowIso?) → boolean

Default action mapping:

- perm:read requires read
- perm:write requires write
- perm:grant requires grant
- perm:admin requires admin

Applications may map their own actions to caps.

## Validation Approach (Normative)

Replay must validate authorization “just before apply”:

- When processing perm.grant, check can(author, perm:grant, scope)
- When processing perm.revoke, check can(author, perm:admin, scope)

This requires single-pass replay that maintains current state and validates each entry in order.

## Determinism Modes

Two modes are allowed:

- Deterministic mode (default for consensus checks):

  - Ignore expires unless nowIso is explicitly provided by the caller
  - This makes replay purely ledger-derived

- Operational mode (for live systems):
  - nowIso is set to real current time and expires are enforced

Tooling MUST document which mode is used.
