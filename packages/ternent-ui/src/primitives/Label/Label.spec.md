# Label

## Purpose

Shared field label primitive for form controls and field patterns.

## Category

Primitive

## Public API

Props:

- `for`: string
- `size`: `sm | md | lg`
- `required`: boolean
- `disabled`: boolean
- `invalid`: boolean

## Accessibility

- uses native `<label>` semantics
- supports `for` linkage to form controls
- required indicator is visual only; field semantics should still be applied to the control itself

## Examples

```vue
<Label for="email" required>Email address</Label>
```
