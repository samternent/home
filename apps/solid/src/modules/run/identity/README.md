# Identity Layer

Purpose:

- own the runtime identity catalog independently from storage providers
- keep one active validated Concord identity available across all provider connections
- gate runtime usability until a valid active identity exists

Own here:

- local identity catalog persistence
- active identity selection
- mnemonic and serialized identity import flows
- provider-backed recovery candidate discovery
- explicit sync of the active identity into provider caches

Do not own here:

- provider auth/session state
- replay or verification reducers
- route-local onboarding logic

Rules:

- runtime identity is local-authoritative
- providers may cache identities, but they do not define the active runtime identity
- metadata stays adjacent to `SerializedIdentity`, never inside it
