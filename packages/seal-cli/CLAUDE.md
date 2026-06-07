# CLAUDE.md

`@ternent/seal-cli` signs/verifies artifacts and supports recipient-targeted encrypted artifacts.

- Treat manifest/proof/artifact schema stability as critical.
- Keep cryptographic operations explicit and auditable.
- Use armour/identity composition; avoid duplicated crypto implementations.
- Preserve offline verification and deterministic output behavior where expected.
