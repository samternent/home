# AI Rules - Ledger Layer

- Keep the ledger model truth-first and append-only.
- Focus on commit identity, authorship, ordering, and verification state.
- Treat verification as mandatory, not best-effort.
- This layer may describe history but must not decide how apps render it.
- Do not place schema reducers or workspace selection state here.
- Prefer normalized commit and ledger descriptors over view-shaped objects.
