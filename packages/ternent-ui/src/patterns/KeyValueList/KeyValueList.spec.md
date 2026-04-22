# KeyValueList

## Purpose

Reusable metadata and status list composition for concise key/value summaries.

## Category

Pattern

## Public API

Props:

- `items`: `KeyValueListItem[]`
- `variant`: card variant (`outline` by default)
- `padding`: card padding (`md` by default)

Slots:

- `value` scoped slot for custom value rendering

## Behavior

- composes `Card` and `Separator` primitives
- uses semantic `dl/dt/dd` markup for accessibility
- normalizes boolean values to `yes/no`
- renders `-` for empty values
