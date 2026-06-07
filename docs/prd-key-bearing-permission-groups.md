# PRD: Key-Bearing Permission Groups with Delegated Key Sharing

## Document Control

- Owner: Platform / Runtime Apps
- Status: Draft
- Target release: v1 (runtime apps foundation)
- Last updated: 2026-05-15

## 1. Summary

Permission groups must become cryptographically key-bearing so app surfaces (tasks list/board and future SaaS modules) can encrypt data to a selected audience without relying on slow Age-group wrapping workflows.

The new model introduces delegable key grants: any current key holder can issue access to another identity by encrypting a copy of the same permission-group key for that recipient and writing a signed grant entry to the ledger.

## 2. Problem Statement

Current system-level permissions in Solid runtime are membership-only records and do not carry group key state. This blocks:

- Encrypting feature data directly to permission audiences.
- Delegating cryptographic access from one holder to another.
- Building high-performance encrypted SaaS surfaces with consistent UX.

Current demo patterns validate direction, but we need a formalized production model that is:

- Ledger-native
- Replay-verifiable
- Fast enough for frequent UI writes and reads

## 3. Goals

1. Permission groups are key-bearing objects.
2. Key holders can delegate access to other users without centralized escrow.
3. Feature payloads can be encrypted to permission groups, individuals, or everyone.
4. Runtime replay can validate grant issuance and reject forged delegation.
5. Crypto path is optimized for performance and avoids Age armored group workflows.

## 4. Non-Goals

1. Full historical re-encryption on membership changes.
2. Cross-org federation in v1.
3. Hardware-backed key custody requirements in v1.
4. Replacing signer/identity model already used by Concord.

## 5. User Outcomes

1. As an app user, when I create a task I can select audience: everyone, one user, or permission group.
2. As a current holder, I can grant another user access without backend admin intervention.
3. As a granted user, I can decrypt historical and future entries encrypted with that permission key.

## 6. High-Level Design

### 6.1 Entities

1. `PermissionGroup`

- `id`, `title`, `scope`
- `publicKey` (permission encryption public key)
- `createdBy`, `createdAt`

2. `PermissionGrant`

- `grantId`
- `permissionId`
- `issuerIdentityKey`
- `recipientIdentityKey`
- `issuerGrantId` (optional lineage pointer)
- `wrappedGroupPrivateKey` (recipient-targeted encrypted permission private key)
- `issuedAt`

3. `EncryptedAudiencePayload`

- `audienceType`: `everyone | user | permission`
- `audienceId`: nullable string
- `cipher`: encrypted blob
- `keyRef`: metadata required to resolve decryption key (e.g. permission id)

### 6.2 Key Model

1. Each permission group has one persistent key pair.
2. The group private key is never stored plaintext in ledger.
3. Grants store recipient-specific encrypted copies of the same group private key.
4. Delegation works by holder decrypting the group private key locally and issuing a new wrapped copy for recipient.
5. Data encrypted to a permission group is always encrypted with that group's public key.
6. Because access is key-based (not user-session-based), once a user receives the group private key they can decrypt all payloads encrypted with that key, including historical entries.

### 6.3 Algorithm Direction (Performance)

Use compact binary envelope crypto (e.g. X25519/HPKE + AEAD or equivalent) with base64 payloads. Do not use Age armored group wrappers for runtime hot paths.

Rationale:

- Lower serialization overhead
- Faster parse/decrypt path in browser
- Better suitability for high-frequency SaaS interactions

## 7. Functional Requirements

### FR-1: Create Key-Bearing Group

System must create a permission group with a key pair and a root grant for creator.

### FR-2: Delegate Key Access (Holder-Issued)

Any holder can issue a grant for another identity by encrypting the same group private key to recipient's user encryption key.

### FR-3: Enforce Delegation Validity

Grant command must fail unless issuer has a valid grant for that permission.

### FR-4: Audience Encryption in App Surfaces

When a route surface writes protected data:

1. `everyone`: plaintext or workspace key path (configurable policy)
2. `user`: encrypt for user key
3. `permission`: encrypt using selected permission group's public key

### FR-5: Decrypt on Replay/Projection

Runtime must attempt decryption using local key material and grant records.
If unavailable, payload remains locked with non-fatal marker.

### FR-6: Historical Access Semantics

If a user has ever received a grant containing the group private key, all entries encrypted to that group key are considered readable by that user (historical and future).

### FR-7: Chain Integrity

Replay must reject grants where:

- issuer signature/identity mismatch
- issuer grant missing at issue time
- malformed parent reference (when lineage field is used)

## 8. Non-Functional Requirements

1. Decrypt/resolve path must be non-blocking and tolerant of missing keys.
2. Grant issuance must be local-first and work offline; sync via ledger commit.
3. P95 local operations target (guideline):

- issue grant < 25ms
- encrypt payload < 15ms for typical task-sized payload
- decrypt payload < 15ms

4. No full-ledger scan required for each decrypt in steady state; maintain indexed projection.

## 9. Command/API Contract (v1)

1. `permission.group.create`
2. `permission.grant.issue`
3. `task.create` / `task.update` carry `audience` and encrypted payload metadata

Typed facade in app API should expose:

- `permissions.createGroup(...)`
- `permissions.issueGrant(...)`
- feature APIs (e.g. `tasks.create`) that accept audience selector input

## 10. UX Requirements for Runtime Surfaces

1. System-level `Users` and `Permissions` are always available as selectors.
2. Task create/edit forms include audience selector:

- Everyone
- Individual user
- Permission group

3. Locked items must render explicit "no key" state, not generic failure.
4. Board and list surfaces must share identical encryption/decryption behavior.

## 11. Data Migration

1. Preserve existing membership-only permissions records for compatibility.
2. Introduce new key-bearing group and grant kinds.
3. Backfill creator root grants where possible.
4. Feature surfaces should prefer new model; legacy records become read-only compatibility layer.

## 12. Security Requirements

1. Signer identity must match command actor for all grant mutations.
2. Grant issuance authorization checks are enforced in command handlers, not UI-only.
3. Wrapped key blobs are authenticated (AEAD/tag verification).
4. Revocation is non-cryptographic in v1: removal from membership UI does not imply loss of decryption capability once key material was shared.
5. Audit metadata (issuer, recipient, timestamp) immutable in ledger.

## 13. Open Questions

1. Should `everyone` be plaintext by default or encrypted with workspace-wide key?
2. Do we require explicit grant acceptance, or issue-is-active is enough for v1?

## 14. Milestones

1. M1: Domain + projection

- Add key-bearing permission group and grant plugins
- Add replay validation for grant chains

2. M2: App API + system surfaces

- Extend typed API
- Update Users/Permissions system routes for grant issuance and visibility state

3. M3: Runtime app integration

- Wire tasks list/board audience selector
- Encrypt/decrypt task payload path

4. M4: Hardening

- Add performance and security tests

## 15. Acceptance Criteria

1. A holder can grant another user access; recipient can decrypt permission-scoped task payloads.
2. Forged grant issuer is rejected.
3. A granted user can decrypt historical payloads encrypted with that permission key.
4. List and board surfaces both function with identical encrypted data semantics.
5. Runtime remains responsive with target P95 timings on local operations.
