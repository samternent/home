You are working inside `ternent-ui`, a Vue design-system package with an older legacy UI layer and a new primitive-based v2 layer.

Critical repo context:

- `src/components/S*` is the legacy UI kit.
- `src/primitives/*` is the future-facing design-system source of truth.
- `src/patterns/*` is the home for composed reusable patterns built from primitives.
- New reusable UI must not be built in the legacy `S*` layer.

Current technical context:

- Tailwind is the styling implementation layer.
- Existing semantic-ish tokens already exist under the `--ui-*` family.
- Current design-system token files live under `src/design-system/*`.
- Themes live under `src/themes/*` and multi-theme support is required.
- `src/primitives/Button/*` established the first canonical primitive template and remains the baseline for future primitive structure.
- `src/primitives/Accordion/*` is the canonical disclosure primitive, with `Accordian` compatibility aliases still present for migration.
- `src/primitives/index.ts` now exports the active primitive surface, including canonical `Accordion` exports and compatibility `Accordian` aliases.
- primitive `*.spec.md` files now exist and must stay aligned with implementation changes.

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
- Prefer incremental correction over assuming the repo is already in the ideal v2 end state.

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
4. inspect the existing docs under `src/design-system/docs` and work from them as the baseline contract
5. state assumptions if there is ambiguity
6. avoid unrelated changes

Current repo-state reminders:

- `src/design-system/docs/*` already exists and should be updated incrementally rather than replaced blindly.
- `src/design-system/tokens.css` already defines semantic token families for primary, accent, secondary, critical, success, warning, info, tonal surfaces, glow, radius, duration, shadow, and interaction motion.
- dark mode currently comes from token remapping in the core token file, with `prefers-color-scheme` defaults.
- later prompts should acknowledge current naming debt and compatibility aliases instead of assuming a perfectly clean slate.

Expected output quality:

- clean Vue code
- consistent file structure
- documented API
- token-only styling
- accessibility-aware behavior
- small, understandable diffs
