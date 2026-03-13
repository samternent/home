# Textarea

## Purpose

Multiline text entry primitive for the v2 form system.

## Category

Primitive

## Public API

Props:

- `modelValue`: string
- `size`: `sm | md | lg`
- `rows`: number
- `disabled`: boolean
- `invalid`: boolean
- `readonly`: boolean
- `resize`: `vertical | none`

Events:

- `update:modelValue`
- `focus`
- `blur`

## States

- default
- hover
- focus-visible
- disabled
- invalid
- readonly

## Accessibility

- uses native `<textarea>` semantics
- supports `aria-invalid` when invalid
- relies on external labels and descriptions through attrs such as `id` and `aria-describedby`

## Token usage

- `--ui-surface`
- `--ui-fg`
- `--ui-fg-muted`
- `--ui-border`
- `--ui-primary`
- `--ui-critical`
- `--ui-ring`
- `--ui-radius-md`

## Examples

```vue
<Textarea v-model="notes" rows="6" />
```
