# Popover

## Purpose

Anchored overlay primitive for non-modal contextual content.

## Category

Primitive

## Public API

Props:

- `open` via `v-model:open`
- `title`
- `description`
- `placement`: `top | bottom | left | right`
- `showArrow`
- `showClose`

Slots:

- `trigger`
- `header`
- default content
- `footer`

## Accessibility

- built on Ark popover semantics
- supports anchored positioning and dismiss behavior
- title and description are wired when provided

## Keyboard behavior

- trigger remains the anchor point
- Escape closes the popover

## Example

```vue
<Popover title="Shortcuts">
  <template #trigger>
    <Button variant="plain-secondary">Help</Button>
  </template>
  Press <kbd>?</kbd> to open the command menu.
</Popover>
```
