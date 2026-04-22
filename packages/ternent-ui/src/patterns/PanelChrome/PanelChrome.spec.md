# PanelChrome

## Purpose

Reusable bottom/side panel shell with collapsible chrome and token-driven resize behavior.

## Category

Pattern

## Public API

Models:

- `v-model:open` (`boolean`)
- `v-model:height` (`number`)
- `v-model:dragging` (`boolean`)

Props:

- `container`: optional resize bounds container
- `minHeight`: minimum expanded panel height
- `maxHeight`: optional maximum expanded panel height
- `collapsedHeight`: panel height when closed
- `resizable`: enables drag handle
- `title`: fallback header text

Slots:

- `header`
- `actions`
- default body slot

## Behavior

- composes primitive `Button` and `Separator`
- uses pointer drag on a dedicated resize handle
- clamps height to min/max bounds
- keeps collapse toggle behavior consistent across panel consumers
