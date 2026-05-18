# CLAUDE.md

This package is legacy (`ternent-ledger`) and not the primary Concord runtime ledger.

- Prefer implementing new Concord runtime behavior in `packages/ledger-v2` (`@ternent/ledger`).
- Keep legacy changes minimal and compatibility-focused.
- Do not backport new app/domain patterns here unless explicitly required.
