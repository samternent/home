# AI Guidance

- Treat this folder as the single runtime identity authority.
- Do not derive runtime identity from Solid or any storage provider.
- Keep identity catalog persistence explicit and validated with `@ternent/identity`.
- If a provider offers cached identities, surface them as optional recovery candidates only.
- Multi-identity support means one active identity plus explicit switching; do not reintroduce implicit identity selection.
