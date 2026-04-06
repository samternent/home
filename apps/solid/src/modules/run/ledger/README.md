# Ledger Layer

Purpose:

- represent signed history as inspectable ledger and commit models
- expose integrity, authorship, and verification state

Phase 1 rule:

- only verified history is valid runtime input
- Concord identity is required for valid commits and entries
- the active identity comes from the core local identity catalog, not from a storage provider

Own here:

- ledger identity
- commit metadata
- verification summaries
- history access helpers

Do not own here:

- projection state
- UI route behavior
- storage discovery
