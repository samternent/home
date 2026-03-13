# Tabs

## Purpose

Single-selection navigation primitive for switching between related panels.

## Category

Primitive

## Public API

Props:

- `modelValue`
- `items`: `{ value, label, disabled? }[]`
- `size`: `sm | md`
- `variant`: `underline | pill`
- `lazyMount`

Slots:

- dynamic panel slots named `panel-{value}`

## Accessibility

- built on Ark tabs semantics
- keyboard roving focus and active tab semantics come from Ark

## Keyboard behavior

- arrow keys move focus between tabs
- Enter/Space activate the focused tab

## Example

```vue
<Tabs
  v-model="tab"
  :items="[
    { value: 'overview', label: 'Overview' },
    { value: 'activity', label: 'Activity' },
  ]"
>
  <template #panel-overview>Overview content</template>
  <template #panel-activity>Activity content</template>
</Tabs>
```
