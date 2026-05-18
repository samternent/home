# CLAUDE.md

`@ternent/concord` is the command/replay runtime over `@ternent/ledger`.

- Do not add app-domain behavior here; keep this package runtime-generic.
- Replay flow is entry-first: for each entry, every plugin runs `applyEntry` in plugin order.
- Decrypt capability is identity-derived; plugins receive `plain`, `decrypted`, or `encrypted` replay payloads.
- Keep integrity strict: invalid committed history must not produce trusted runtime state.
- Preserve plugin contract stability (`reset/beginReplay/applyEntry/endReplay`).
