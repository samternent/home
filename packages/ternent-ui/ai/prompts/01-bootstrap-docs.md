Audit and update the existing design-system governance docs under `src/design-system/docs`:

- `AI_SYSTEM.md`
- `TOKEN_RULES.md`
- `PRIMITIVE_RULES.md`
- `ACCESSIBILITY_RULES.md`
- `PATTERN_RULES.md`
- `VISUAL_DIRECTION.md`

Requirements:

- Treat the existing docs as the accepted baseline and revise them incrementally rather than replacing them wholesale.
- Treat `src/components/S*` as legacy and freeze future reusable work there.
- Treat `src/primitives/*` as the only future-facing primitive layer.
- Keep the docs grounded in the current repo rather than generic design-system advice.
- Reuse the current `--ui-*` token family as the active semantic contract.
- Explain Ark UI usage selectively, not dogmatically.
- Make the docs concrete enough that future AI agents can use them as implementation rules.
- Reflect current repo facts explicitly:
  - `src/patterns/*` now exists and currently contains `FormField` as the first shared pattern.
  - `src/primitives/Button/*` established the first canonical primitive template.
  - `src/primitives/Accordion/*` is canonical, while `Accordian` remains as a compatibility alias.
  - `src/primitives/index.ts` now exports the broader primitive surface, including both canonical and compatibility accordion names.
  - primitive `*.spec.md` files now exist and must be kept in sync with implementation changes.
- Keep token guidance aligned to the current `src/design-system/tokens.css` contract, including primary, accent, secondary, critical, success, warning, info, tonal, glow, radius, duration, shadow, and interaction motion tokens.
- Note that dark mode currently comes from token remapping in the core token file, with `prefers-color-scheme` defaults.

Do not make unrelated code changes in this task.
