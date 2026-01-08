# Protocol vs Semantics (Normative Clarification)

This section defines the boundary between Concord Protocol (what the ledger guarantees)
and Semantic / Application Layers (how ledgers are interpreted and enforced).

This separation is intentional and foundational.

---

## 1. Scope of Concord Protocol

Concord Protocol is responsible for recording, ordering, and verifying events
in a tamper-evident ledger.

The protocol MUST guarantee:

- Deterministic canonicalisation of all entries and commits
- Cryptographic integrity of entries, commits, and ledger head
- Replayability of ledger state from genesis
- Explicit, immutable recording of:
  - Identity declarations
  - Permission grants and revocations
  - Encryption epoch transitions
  - Key-wrap publication

The protocol DOES NOT decide:

- Whether an action is allowed
- Whether a principal should be able to decrypt data
- Whether revocation applies retroactively

Those concerns are intentionally deferred.

---

## 2. Protocol Primitives

The following are first-class protocol primitives.

### 2.1 Identity

- Identity entries bind a principal identifier to zero or more encryption recipients.
- The protocol records identity assertions; it does not resolve or validate identity schemes.
- Principal identifiers are treated as opaque strings.

### 2.2 Permissions

- Permission entries record claims about capabilities granted or revoked.
- The protocol does not enforce authorization rules.
- Permission entries are replayed into semantic state by consumers.

### 2.3 Encryption Epochs

- Encryption is modeled using epochs scoped to a logical namespace.
- An epoch represents a versioned encryption context.
- Epoch transitions are explicit ledger events.

### 2.4 Wrap Distribution

- Epoch rotation entries may include key wraps.
- A wrap represents encrypted material required to derive the epoch key.
- Wrap publication is declarative and immutable.

Key rotation in Concord is defined as:
An epoch transition accompanied by wrap distribution.

---

## 3. Canonicalisation Invariant

The protocol enforces a strict canonicalisation invariant.

- Undefined values are illegal in any canonicalised structure
- Optional fields must be omitted entirely when not present
- Null may be used only where semantically meaningful

Violations of this invariant must result in verification failure.

This invariant applies to:

- Entry payloads
- Commit metadata
- Any structure contributing to a hash

---

## 4. Semantic Layer Responsibilities

Semantic layers such as CLIs, applications, and services are responsible for
interpreting the ledger.

This includes:

- Authorization decisions
- Capability implication rules
- Revocation semantics
- Decryption eligibility checks
- Time-based evaluation of permissions

Multiple semantic interpretations may coexist over the same ledger.

---

## 5. Decryptability Semantics

The protocol records cryptographic facts, not access policy.

Two valid semantic interpretations exist.

### 5.1 Cryptographic Decryptability

A principal is decryptable if:

- A wrap exists for the principal
- The wrap corresponds to the ciphertext epoch
- The principal possesses the required private material

This reflects historical capability.

### 5.2 Policy-Based Decryptability

A principal is decryptable if:

- Cryptographic decryptability holds
- The principal currently holds required permissions

This reflects current authorization.

Both interpretations are valid.
Neither is enforced by the protocol.

---

## 6. Revocation Model

Revocation in Concord is non-retroactive at the protocol level.

- Revocation entries do not modify historical ledger data
- Revocation does not remove previously published wraps
- Access to historical data cannot be cryptographically revoked without re-encryption

Applications may:

- Treat revocation as immediately blocking access
- Allow historical decryption but block future epochs

The protocol remains neutral.

---

## 7. Design Rationale

This separation ensures:

- The protocol remains minimal, verifiable, and future-proof
- Applications retain flexibility without forking the ledger format
- Security decisions are explicit and inspectable

Concord prioritizes truthful recording of events over enforcement.

---

## 8. Non-Goals

Concord Protocol does not attempt to:

- Resolve decentralized identifiers
- Enforce authorization
- Prevent offline key misuse
- Retroactively revoke encrypted data
- Impose a single security policy model

---

## 9. Summary

Concord records what happened.
Semantics decide what it means.

This boundary is intentional and essential.
