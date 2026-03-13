# Menu

## Purpose

Anchored action list primitive for command and option selection.

## Category

Primitive

## Public API

Props:

- `open` via `v-model:open`
- `items`: `{ value?, label?, disabled?, type?: 'item' | 'separator' }[]`
- `placement`: `top | bottom | left | right`
- `showArrow`

Slots:

- `trigger`
- `item`

Events:

- `select`

## Accessibility

- built on Ark menu semantics
- keyboard navigation and dismiss behavior come from Ark

## Keyboard behavior

- arrow keys move between items
- Enter/Space select the highlighted item
- Escape closes the menu
