# ACCESSIBILITY_RULES

## Goal

Accessibility is a built-in requirement of the design system, not a later enhancement.
AI must treat accessibility as part of the primitive contract.

## Current repo baseline

The accessibility contract is ahead of the current primitive implementation.

- `Button` established the baseline for focus treatment in the current v2 primitive layer.
- `Accordion` is the canonical disclosure primitive in `src/primitives`, and several Ark-backed accessibility patterns also exist in legacy `src/components/S*` files as behavior reference only.
- Some existing primitives such as `SplitButton` predate the full contract in this document.
- Primitive `*.spec.md` files now exist for the active v2 surface, so future interactive primitive work must update them rather than assume documentation can lag behind behavior.

## Core principles

1. keyboard access must work without mouse interaction
2. focus visibility must be present and consistent
3. semantics must match the component role
4. ARIA must be correct, not decorative
5. disabled and invalid states must remain understandable
6. stateful behavior must be operable and perceivable

## Focus treatment

All interactive primitives must implement a consistent focus-visible style using system tokens.

Preferred pattern based on current repo tokens:

- `focus-visible:outline-none`
- `focus-visible:ring-2`
- `focus-visible:ring-[var(--ui-ring)]`

The exact ring width may vary if the system later defines a dedicated token, but the treatment must remain consistent across primitives.

## Native elements first

Use native semantics whenever practical.

Examples:

- use `<button>` for clickable button behavior
- use `<input>` for text entry
- use `<textarea>` for multiline text
- use `<label>` for labels

Do not replace native semantics with generic elements unless the component model truly requires it.

## Polymorphism caution

If a primitive supports `as` or similar polymorphism:

- ensure semantic responsibility stays correct
- do not allow broken combinations silently
- do not apply button-only attributes to links
- document expectations in the spec

## Disabled state

Disabled controls must:

- be visibly distinguishable
- not appear interactive
- not retain misleading hover behavior
- not trap focus unexpectedly

If a component uses a non-native disabled pattern, it must still communicate state through both semantics and styling.

## Invalid state

When a control supports invalid state:

- expose the state clearly in styling
- wire ARIA invalid semantics where appropriate
- ensure associated messages can be referenced where relevant

## Ark UI usage

Ark UI should be the default foundation for primitives with meaningful a11y/state complexity.

Use Ark UI for:

- Checkbox
- RadioGroup
- Switch
- Dialog
- Tooltip
- Popover
- Menu
- Tabs
- Select
- Combobox
- Accordion

When using Ark UI:

1. rely on its semantics rather than reimplementing them poorly
2. expose a clean system-level API on top
3. keep styling token-driven
4. document keyboard behavior in the spec
5. use legacy Ark-backed `S*` components for behavior reference only, not as implementation dependencies

## Keyboard expectations by primitive type

### Button-like

- Enter and Space should activate native buttons as expected
- focus-visible must be present

### Input-like

- labels should be connectable
- invalid and disabled state must remain clear
- placeholder must not be the only form of instruction

### Checkbox, RadioGroup, Switch

- keyboard interaction must match expected native or ARIA behavior
- labels must be clearly associated
- state change must be perceivable

### Dialog

- focus should move into the dialog on open
- focus should be constrained appropriately while open
- Escape behavior should be documented if supported
- returning focus on close should be handled correctly when possible

### Menu and Popover

- keyboard navigation must be coherent
- open and close behavior must be predictable
- menu items must have correct semantics

### Tabs

- tablist semantics must be correct
- active tab state must be exposed properly
- keyboard movement should follow expected conventions

## Icon-only controls

If a control is icon-only, it must have an accessible name.
This may come from:

- `aria-label`
- visually hidden text
- a clearly connected accessible label

Do not ship icon-only controls with no accessible name.

## Content and contrast

The design system should prefer token combinations that maintain sufficient contrast.
AI should avoid creating states that sacrifice readability for stylistic subtlety.

## Motion

Motion should support clarity and state change, not create confusion.
Avoid flashy or unnecessary animation in primitives.

## Spec requirement

Each interactive primitive spec should document:

- semantics used
- keyboard behavior
- focus behavior
- disabled behavior
- invalid behavior where relevant
- Ark UI dependency if present

Current repo note: interactive primitive changes should update the relevant spec file as part of the implementation work.

## Review checklist

Before merging an interactive primitive, confirm:

- can it be used by keyboard?
- does it have visible focus?
- are semantics correct?
- is ARIA meaningful rather than decorative?
- does disabled state behave correctly?
- is the behavior documented?
