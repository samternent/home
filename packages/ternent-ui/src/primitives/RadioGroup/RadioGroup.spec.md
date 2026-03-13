# RadioGroup

## Purpose

Single-selection choice primitive built on Ark UI.

## Category

Primitive

## Public API

Props:

- `modelValue`: string
- `options`: `{ value, label, description?, disabled? }[]`
- `orientation`: `horizontal | vertical`
- `size`: `sm | md`
- `disabled`: boolean
- `invalid`: boolean

Events:

- `update:modelValue`

## States

- unchecked
- checked
- focus-visible
- disabled
- invalid

## Accessibility

- built on Ark `RadioGroup.Root`
- each option includes a hidden input and item control
- external group labelling can be passed through standard attrs such as `aria-label`

## Example

```vue
<RadioGroup
  v-model="plan"
  :options="[
    { value: 'starter', label: 'Starter' },
    { value: 'pro', label: 'Pro', description: 'Best for teams' },
  ]"
/>
```
