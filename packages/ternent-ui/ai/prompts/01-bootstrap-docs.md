Using the existing repo structure and the design-system direction docs, create or update the following files under `src/design-system/docs`:

- `AI_SYSTEM.md`
- `TOKEN_RULES.md`
- `PRIMITIVE_RULES.md`
- `ACCESSIBILITY_RULES.md`
- `PATTERN_RULES.md`
- `VISUAL_DIRECTION.md`

Requirements:

- Treat `src/components/S*` as legacy and freeze future reusable work there.
- Treat `src/primitives/*` as the only future-facing primitive layer.
- Keep the docs grounded in the current repo rather than generic design-system advice.
- Reuse the current `--ui-*` token family as the active semantic contract.
- Explain Ark UI usage selectively, not dogmatically.
- Make the docs concrete enough that future AI agents can use them as implementation rules.

Do not make unrelated code changes in this task.
