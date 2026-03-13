# Tooltip

## Purpose

Lightweight non-interactive hint overlay for short explanatory text.

## Category

Primitive

## Public API

Props:

- `open` via `v-model:open`
- `placement`: `top | bottom | left | right`
- `openDelay`
- `closeDelay`
- `showArrow`

Slots:

- `trigger`
- default tooltip content

## Accessibility

- built on Ark tooltip semantics
- intended for short supplemental text, not complex interactive content

## Keyboard behavior

- opens on focus and hover via Ark behavior
- closes on blur, pointer leave, or Escape

## Example

```vue
<Tooltip>
  <template #trigger>
    <Button variant="plain-secondary">?</Button>
  </template>
  Helpful context
</Tooltip>
```
