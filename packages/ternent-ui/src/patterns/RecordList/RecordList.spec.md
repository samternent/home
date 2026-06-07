# RecordList

## Purpose

Reusable selectable list composition for entity navigation and lightweight grouped records.

## Category

Pattern

## Public API

Props:

- `items`: `RecordListItem[]`
- `title`: optional section title
- `emptyLabel`: empty-state copy (`No records yet.` default)
- `defaultActionLabel`: optional fallback row action label
- `surface`: `card | plain` (`card` default)

Slots:

- `item-action` scoped slot (`item`)

Events:

- `select(item, event)` when an item row is selected
- `action(item, event)` default action button event

## Behavior

- composes `Card`, `Button`, and `Separator` primitives
- highlights active item with secondary button treatment
- supports per-item disabled behavior
- renders explicit empty state when no items are available
