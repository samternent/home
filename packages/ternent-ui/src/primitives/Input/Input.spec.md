# Input

## Purpose

Single-line text entry primitive for the v2 form system.

## Category

Primitive

## Anatomy

- input root
- optional `leading` adornment slot
- optional `trailing` adornment slot

## Public API

Props:

- `modelValue`: string or number
- `type`: `text | email | password | search | url | tel | number`
- `size`: `sm | md | lg`
- `disabled`: boolean
- `invalid`: boolean
- `readonly`: boolean

Slots:

- `leading`
- `trailing`

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

- uses native `<input>` semantics
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
- `--ui-duration-normal`
- `--ui-ease-out`

## Examples

```vue
<Input v-model="email" type="email" />
```

```vue
<Input v-model="query" invalid aria-describedby="search-message">
  <template #leading>
    <IconSearch />
  </template>
</Input>
```
