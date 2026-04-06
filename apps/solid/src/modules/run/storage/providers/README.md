# Storage Providers

Purpose:

- hold provider-specific runtime adapters behind the shared storage contracts
- keep provider auth, discovery, and mount semantics out of explorer, terminal, and core facades
- make it possible to run the core workspace runtime with zero connected providers

Rules:

- each provider must implement the shared contracts in `run/storage/types.ts`
- provider modules may expose extra provider-local state, but that state must not become a surface dependency
- identity caches are optional provider capabilities, not a replacement for the core identity service
- replay, verification, and hosted-app boot do not belong here
- if a provider needs special UI affordances, surface them as explicit capabilities first

Current direction:

- `local/` provides the default browser-local workspace mount
- `solid/` is transitional and wraps the pre-existing Solid workspace logic
- new providers should be added beside it, not folded back into `run/workspace`
