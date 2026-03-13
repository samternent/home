# Drawer

## Purpose

Side-sheet overlay primitive for longer workflows or contextual panels.

## Category

Primitive

## Public API

Props:

- `open` via `v-model:open`
- `title`
- `description`
- `side`: `left | right`
- `size`: `sm | md | lg`
- `showClose`
- `closeOnEscape`
- `closeOnInteractOutside`

Slots:

- `trigger`
- `header`
- default content
- `footer`

## Accessibility

- built on Ark dialog semantics
- traps focus while open
- behaves like a modal side sheet rather than a resizable app-specific panel

## Keyboard behavior

- focus moves into the drawer on open
- Escape closes when enabled

## Example

```vue
<Drawer v-model:open="open" title="Filters" side="right">
  <template #trigger>
    <Button variant="secondary">Open filters</Button>
  </template>
</Drawer>
```
