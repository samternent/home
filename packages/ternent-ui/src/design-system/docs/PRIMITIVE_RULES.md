# PRIMITIVE_RULES

## Goal

Primitives are the stable building blocks of `ternent-ui` v2.
They must be easy for humans and AI agents to understand, extend, and compose.

## Placement

All new reusable low-level and mid-level components go in `src/primitives`.

Do not place new reusable primitives in:

- `src/components`
- app-specific directories
- ad hoc utility folders

## Canonical file structure

Each primitive should normally use this shape:

```txt
Component/
  Component.vue
  Component.props.ts
  Component.types.ts
  Component.variants.ts
  Component.spec.md
```

This may be slightly simplified for very small components, but the default expectation is consistency.

## File responsibilities

### `Component.vue`

Responsible for:

- rendering structure
- wiring props to classes and attributes
- small computed class composition
- slot rendering

Avoid putting large variant maps directly in the SFC.

### `Component.props.ts`

Responsible for:

- prop definitions
- defaults
- shared prop naming consistency

### `Component.types.ts`

Responsible for:

- exported unions
- helper types
- public type surface

### `Component.variants.ts`

Responsible for:

- base classes
- size maps
- variant maps
- stateful class combinations
- token-based class composition

### `Component.spec.md`

Responsible for:

- purpose
- category
- anatomy
- API
- variants
- sizes
- states
- accessibility requirements
- examples
- do and don’t guidance

## API design rules

1. prefer small APIs
2. prefer consistent prop names across primitives
3. prefer composition over one-off prop expansion
4. do not import legacy API quirks without evaluating them
5. use slots when they create a cleaner public surface
6. expose only what is needed for stable usage

## Shared prop conventions

Use these consistently where relevant:

- `variant`
- `size`
- `tone`
- `disabled`
- `invalid`
- `loading`
- `modelValue` for input-like primitives following Vue conventions
- `as` only where polymorphism is genuinely needed

Avoid drift such as:

- `kind` vs `variant`
- `error` vs `invalid`
- `regular` vs `md`
- `tiny` vs `xs`

## Variant philosophy

Use a restrained and repeatable vocabulary.

Preferred baseline:

- `solid`
- `soft`
- `outline`
- `ghost`
- `plain`

Where a component needs a different axis based on existing repo reality, document it clearly.

Because the current Button already uses variants like `primary`, `secondary`, and `critical`, the first refactor may preserve that vocabulary temporarily. If so, document it and avoid inventing yet another scheme in parallel.

## Size philosophy

Preferred baseline:

- `sm`
- `md`
- `lg`

Extra sizes such as `xs`, `xl`, or `micro` are allowed only when there is demonstrated usage.
If a component uses extra sizes, the reason should be documented.

## State requirements

Interactive primitives should define and support relevant states.

Common states:

- default
- hover
- active
- focus-visible
- disabled
- invalid
- loading
- selected
- open

Not every state applies to every primitive, but omission should be intentional.

## Styling rules

1. use semantic tokens only
2. no raw Tailwind palette classes
3. no arbitrary radius or spacing values
4. no inline styles unless technically necessary and documented
5. keep class logic centralized in `*.variants.ts` where practical
6. keep the component silhouette consistent with the system

## Composition rules

Primitives should be:

- composable
- generic
- not tied to app business logic
- not tied to a single product layout

If a component starts needing app-shell opinions or form grouping logic, consider making it a pattern instead.

## Slots

Use slots when they improve flexibility without bloating the prop API.

Common slot use cases:

- leading or trailing adornments
- icon areas
- content override areas
- label or description composition in pattern-level components

Avoid creating a prop for every possible visual arrangement when a slot is cleaner.

## Accessibility expectations

All primitives must meet the accessibility contract defined in `ACCESSIBILITY_RULES.md`.
Where Ark UI is used, rely on it correctly rather than partially reimplementing behavior.

## Spec requirement

Every primitive should have a `Component.spec.md` file.
This is not optional documentation fluff.
It is part of the AI contract.

The spec should describe:

- purpose
- anatomy
- props
- emitted events if relevant
- slots
- variants
- sizes
- states
- accessibility
- token usage
- examples

## Export rules

Every primitive added to `src/primitives` must also be reviewed for export in `src/primitives/index.ts`.
Exports should be deliberate and stable.

## Refactor policy for legacy equivalents

If a legacy `S*` component exists:

- inspect it for behavior and usage reference only
- do not port line by line
- identify whether the v2 version should be a primitive or a pattern
- preserve useful behavior but redesign the API if needed

## Review checklist

Before a primitive is considered ready, confirm:

- it lives in `src/primitives`
- it follows the canonical file shape
- it uses tokens only
- it has a documented API
- it has relevant states
- it is not leaking app logic
- it is exported intentionally
- it has a spec file
