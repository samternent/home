# TOKEN_RULES

## Goal

Tokens are the contract that makes multi-theme support, visual consistency, and AI-driven implementation possible.

Primitives must consume tokens, not raw visual values.

## Token layers

Use three conceptual layers.

### 1. Raw tokens

Raw tokens represent palette and scale values.
These are theme authoring values, not component consumption values.

Examples:

- raw color values in theme files
- scale values for radius, shadow, duration, spacing

Raw tokens are allowed inside theme definitions and token generation logic.
Primitives should not consume them directly.

### 2. System semantic tokens

These are the tokens primitives should consume.
In this repo, the existing `--ui-*` tokens are already acting as the semantic layer.

Existing examples include:

- `--ui-bg`
- `--ui-fg`
- `--ui-fg-muted`
- `--ui-surface`
- `--ui-surface-hover`
- `--ui-border`
- `--ui-primary`
- `--ui-on-primary`
- `--ui-primary-muted`
- `--ui-primary-hover`
- `--ui-primary-active`
- `--ui-accent`
- `--ui-on-accent`
- `--ui-secondary`
- `--ui-on-secondary`
- `--ui-critical`
- `--ui-on-critical`
- `--ui-success`
- `--ui-on-success`
- `--ui-warning`
- `--ui-on-warning`
- `--ui-info`
- `--ui-on-info`
- `--ui-tonal-secondary`
- `--ui-tonal-tertiary`
- `--ui-ring`
- `--ui-glow-primary`
- `--ui-radius-md`
- `--ui-shadow-sm`
- `--ui-duration-normal`
- `--ui-ease-out`
- `--ui-lift-hover`
- `--ui-scale-active`

These are acceptable as the current canonical consumption layer.

Compatibility aliases also exist where needed, for example the `--ui-danger*` aliases that currently map to the `--ui-critical*` family.

### 3. Optional component aliases

Component aliases may be introduced sparingly when a primitive has a stable, repeated need that is too specific for the general semantic layer.

Examples:

- `--button-bg-primary`
- `--input-border-default`
- `--card-surface-default`

Avoid component aliases unless the general token model cannot express the need cleanly.

## Current repo strategy

Do not perform a giant token rewrite first.
Use the existing `--ui-*` family as the active semantic contract.
Improve coverage and naming gradually.

That means:

- reuse the current token family wherever possible
- expand carefully when a real gap appears
- only rename tokens when the system meaning becomes meaningfully clearer
- treat `src/design-system/tokens.css` as the current source of truth for the active semantic contract
- preserve the current light/dark remapping behavior, which is defined in the core token file using `prefers-color-scheme`

## Consumption rules

Primitives must:

1. consume existing `--ui-*` tokens or approved new semantic tokens only
2. never hard-code hex, rgb, hsl, oklch, or named colors
3. never use Tailwind palette utilities like `bg-zinc-900` or `text-red-500`
4. never introduce arbitrary motion or radius values without updating the token contract
5. prefer semantic token combinations over one-off visual hacks

## Allowed primitive usage examples

Good:

- `bg-[var(--ui-primary)]`
- `text-[var(--ui-on-primary)]`
- `rounded-[var(--ui-radius-md)]`
- `shadow-[var(--ui-shadow-sm)]`
- `duration-[var(--ui-duration-normal)]`
- `focus-visible:ring-[var(--ui-ring)]`

Bad:

- `bg-purple-700`
- `text-zinc-100`
- `rounded-[13px]`
- `duration-150`
- `shadow-[0_8px_30px_rgba(0,0,0,0.18)]` unless the shadow token is added first

## Minimal semantic categories to preserve

Even if token names evolve, the system should continue to support these semantic roles.

### Base and text

- canvas background
- primary foreground
- muted foreground
- inverse foreground where needed

### Surfaces

- surface
- surface hover
- border
- tonal surfaces

### Interactive accents

- primary
- on primary
- primary muted
- primary hover
- primary active

### Feedback tones

- critical
- success
- warning
- info
- corresponding “on” colors and muted or hover states where relevant

### Utility tokens

- focus ring
- radii
- shadows
- durations
- easing
- interaction lift or active scale if retained

## Adding a new token

A new token may be added only when all of the following are true:

1. a real component need exists
2. the need cannot be expressed cleanly with current tokens
3. the token has a clear semantic meaning
4. it can be themed consistently across all supported themes
5. the addition is documented in both token docs and affected components

## Updating themes

When a new semantic token is added:

1. define it in the base token layer
2. add it to every supported theme or ensure it safely falls back
3. verify both light and dark behavior if relevant
4. update any generated theme outputs if the build pipeline requires it

AI must not add a new token in only one theme.

## Token naming guidance

Prefer names that describe role, not appearance.

Prefer:

- `--ui-surface`
- `--ui-primary`
- `--ui-fg-muted`
- `--ui-ring`

Avoid:

- `--ui-purple`
- `--ui-dark-border`
- `--ui-button-green`

If a name includes a component, it should only be because the token is a deliberate component alias.

## Migration guidance

Because the repo already has a working token family, migration should be staged.

### Good migration work

- replacing hard-coded values with existing `--ui-*` tokens
- expanding missing states using current tokens
- rationalizing inconsistent use of `surface`, `tonal`, and `primary` roles
- preserving existing compatibility aliases until the consuming surface is deliberately migrated
- introducing missing utility tokens with documentation

### Bad migration work

- renaming many tokens at once without a real need
- introducing a second semantic vocabulary in parallel without a plan
- forcing every primitive to adopt a new naming model before the token layer is stable

## Review checklist

Before merging token-related changes, confirm:

- does the primitive use tokens only?
- is the token meaning clear?
- does the token work across all themes?
- is the token documented?
- is the change incremental rather than disruptive?
