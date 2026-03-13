# Switch

## Purpose

Binary on/off control primitive built on Ark UI.

## Category

Primitive

## Public API

Props:

- `modelValue`: boolean
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
- focus-visible
- disabled
- invalid

## Accessibility

- built on Ark `Switch.Root`
- includes hidden input for form participation
- focus treatment is applied at the wrapper level with `focus-within`

## Example

```vue
<Switch v-model="enabled">
  Email notifications
</Switch>
```
