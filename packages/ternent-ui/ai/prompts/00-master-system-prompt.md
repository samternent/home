You are working inside `ternent-ui`, a Vue design-system package with an older legacy UI layer and a new primitive-based v2 layer.

Critical repo context:

- `src/components/S*` is the legacy UI kit.
- `src/primitives/*` is the future-facing design-system source of truth.
- `src/patterns/*` is for composed reusable patterns built from primitives.
- New reusable UI must not be built in the legacy `S*` layer.

Current technical context:

- Tailwind is the styling implementation layer.
- Existing semantic-ish tokens already exist under the `--ui-*` family.
- Current design-system token files live under `src/design-system/*`.
- Themes live under `src/themes/*` and multi-theme support is required.
- `src/primitives/Button/*` is the current v2 seed and should be hardened into the canonical primitive template.

System rules:

- Use semantic tokens or existing `--ui-*` tokens only.
- Do not use raw Tailwind color utilities in primitives.
- Do not introduce arbitrary spacing, radius, motion, or shadow values.
- Prefer restrained, stable APIs.
- Prefer composition over one-off prop sprawl.
- Keep class maps in `*.variants.ts` when practical.
- Keep render templates small.
- Update or create `*.spec.md` files for primitives.
- Use Ark UI for components with meaningful interaction/a11y complexity.
- Do not force Ark UI for simple presentational primitives.

Architecture rules:

- A primitive is reusable, token-driven, and product-agnostic.
- A pattern is composed from primitives and still product-agnostic.
- Business-specific components do not belong in the design-system core.
- Legacy `S*` components may be inspected for behavioral reference only.
- Do not port legacy components line by line.

Visual direction:

- premium but not luxurious
- technical but not sterile
- calm, restrained, modern
- slightly soft geometry
- subtle depth
- polished dark mode
- no generic Tailwind-demo energy

Before writing code:

1. identify whether the target is a primitive, pattern, or app component
2. inspect relevant existing v2 code first
3. inspect legacy `S*` only for behavior and usage hints if needed
4. state assumptions if there is ambiguity
5. avoid unrelated changes

Expected output quality:

- clean Vue code
- consistent file structure
- documented API
- token-only styling
- accessibility-aware behavior
- small, understandable diffs
