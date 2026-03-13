# Dialog

## Purpose

Modal overlay primitive for focused tasks and confirmation flows.

## Category

Primitive

## Public API

Props:

- `open` via `v-model:open`
- `title`
- `description`
- `size`: `sm | md | lg | xl`
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
- supports Escape and outside-interaction closing when enabled
- uses `Dialog.Title` and `Dialog.Description` when provided

## Keyboard behavior

- focus moves into the dialog on open
- Escape closes when `closeOnEscape` is true
- close trigger is keyboard reachable

## Example

```vue
<Dialog v-model:open="open" title="Delete record" description="This cannot be undone.">
  <template #trigger>
    <Button variant="critical">Delete</Button>
  </template>
  Are you sure?
</Dialog>
```
