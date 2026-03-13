# Checkbox

## Purpose

Binary or indeterminate choice primitive built on Ark UI.

## Category

Primitive

## Public API

Props:

- `modelValue`: `boolean | "indeterminate"`
- `size`: `sm | md`
- `disabled`: boolean
- `invalid`: boolean

Slots:

- default: inline label
- `description`: supporting text below the label

Events:

- `update:modelValue`

## States

- unchecked
- checked
- indeterminate
- focus-visible
- disabled
- invalid

## Accessibility

- built on Ark `Checkbox.Root`
- includes hidden input for form participation
- supports keyboard interaction through Ark
- focus treatment is applied at the wrapper level with `focus-within`

## Examples

```vue
<Checkbox v-model="agreed">
  Accept terms
</Checkbox>
```
