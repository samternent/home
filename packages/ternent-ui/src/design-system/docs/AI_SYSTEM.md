# AI_SYSTEM

## Mission

Build `ternent-ui` into a coherent, token-driven, multi-theme Vue design system that can be safely extended by AI without architectural or visual drift.

The system must allow Sam to operate primarily as reviewer, orchestrator, and approver rather than hands-on implementer.

## Repo model

Treat the codebase as three layers.

### 1. Legacy layer

`src/components/S*`

This is the old UI kit.
It may be used as behavior reference and migration reference only.
No new reusable UI should be added here.
Do not use legacy components as dependencies for new primitives.
Do not copy legacy APIs blindly.

### 2. Design-system core

`src/primitives/*`

This is the future-facing reusable UI surface.
All new reusable components must be built here.
This is the only layer that should be exported as the stable primitive API.

### 3. Composed patterns

`src/patterns/*`

This layer is for higher-level reusable compositions built from primitives.
Patterns are not low-level primitives.
Patterns may be opinionated but must remain product-agnostic.

## Taxonomy

### Primitive

A primitive is:

- reusable across products
- token-driven
- not business-specific
- usually small or medium in scope
- safe for broad public export
- visually and behaviorally consistent with the system

Examples:

- Button
- Input
- Textarea
- Checkbox
- RadioGroup
- Switch
- Dialog
- Tooltip
- Popover
- Tabs
- Badge
- Card
- Spinner
- Skeleton
- Separator

### Pattern

A pattern is:

- composed from primitives
- opinionated in layout or grouping
- still product-agnostic
- not the lowest-level building block

Examples:

- FormField
- SearchField
- EmptyState
- FilterBar
- PageHeader
- SidebarNav
- AppShell
- CommandMenu

### App component

An app component is:

- business-specific
- domain-specific
- not part of the shared design-system core

Examples:

- PackRevealPanel
- LedgerAuditHeader
- ProjectStatusCard

App components must not be added to the design system package unless there is a clear shared-system reason.

## Non-negotiable rules

1. `src/primitives` is the only source for new reusable UI.
2. `src/components/S*` is legacy and must not be extended with new work.
3. New primitives must not depend on legacy `S*` components.
4. Product-specific logic must not enter `src/primitives`.
5. All reusable public exports must come from `src/primitives/index.ts` or `src/patterns/index.ts`.
6. All primitives must consume semantic design tokens only.
7. No raw Tailwind color utilities in primitives.
8. No arbitrary spacing, radius, or motion values unless first added to the system contract.
9. Theme support must come from token mapping, not per-component theme branching.
10. AI must favor consistency and composability over cleverness.

## Existing token reality

The current system already uses a token family such as:

- `--ui-bg`
- `--ui-fg`
- `--ui-fg-muted`
- `--ui-surface`
- `--ui-surface-hover`
- `--ui-border`
- `--ui-primary`
- `--ui-critical`
- `--ui-ring`
- `--ui-radius-md`
- `--ui-shadow-sm`

These are acceptable as the starting contract.
AI should prefer reusing and rationalizing these tokens before inventing new ones.
A broader semantic model can be introduced gradually, but migration should be deliberate.

## Visual direction

Default design direction:

- premium but not luxurious
- technical but not sterile
- calm, restrained, and modern
- slightly soft geometry
- strong dark mode support
- subtle depth, not showy effects
- polished indie product energy
- close to modern product tooling, not generic Tailwind demo aesthetics

When making visual choices, prefer restraint over novelty.

## Styling rules

1. Use semantic tokens or existing system tokens only.
2. Never hard-code colors in primitives.
3. Prefer class composition in `*.variants.ts` rather than giant inline strings in the SFC.
4. Keep render templates small.
5. Keep spacing and sizing aligned to shared scale.
6. Use system radius tokens for silhouette consistency.
7. Use system motion tokens for transitions.
8. Focus treatment must be consistent across all interactive primitives.

## API rules

1. Prefer stable, small APIs.
2. Keep naming consistent across primitives.
3. Use `variant` consistently rather than inventing synonyms like `kind` or `appearance` unless absolutely required.
4. Use `size` consistently.
5. Use `disabled`, `invalid`, and `loading` consistently where relevant.
6. Prefer composition over one-off prop sprawl.
7. Support slots when they produce a cleaner API than multiple special props.

## File conventions

Each primitive should normally follow this structure:

```txt
Component/
  Component.vue
  Component.props.ts
  Component.types.ts
  Component.variants.ts
  Component.spec.md
```

Responsibilities:

- `Component.vue`: rendering and small computed composition only
- `Component.props.ts`: prop definitions and defaults
- `Component.types.ts`: exported unions and helper types
- `Component.variants.ts`: size and variant maps, token-aware class composition
- `Component.spec.md`: purpose, anatomy, props, variants, states, accessibility, usage

## Ark UI policy

Use Ark UI when it solves real interaction and accessibility complexity.

Prefer Ark UI for:

- Accordion
- Checkbox
- RadioGroup
- Switch
- Dialog
- Popover
- Tooltip
- Menu
- Tabs
- Select
- Combobox

Do not force Ark UI for:

- Button
- Badge
- Card
- Spinner
- Skeleton
- Separator
- Avatar wrapper

## Required states for interactive primitives

Where relevant, primitives must define and visually support:

- default
- hover
- active
- focus-visible
- disabled
- invalid
- loading
- open or selected where relevant

## Forbidden AI behavior

AI must not:

- add new reusable UI under legacy `S*`
- use raw Tailwind color utilities in primitives
- invent arbitrary spacing or radius values ad hoc
- create one-off variants without documenting the reason
- bake theme differences into component logic when token mapping can solve it
- copy legacy APIs line for line without evaluating their suitability for v2
- place product-specific compositions into `src/primitives`

## Output expectations

When implementing or refactoring components, AI should:

- state assumptions clearly
- preserve good existing behavior when sensible
- improve structure without unnecessary abstraction
- keep code understandable for future agents
- update the relevant spec file
- update exports where appropriate
- avoid unrelated churn
