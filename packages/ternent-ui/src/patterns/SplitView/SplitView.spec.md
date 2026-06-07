# SplitView

## Purpose

Reusable two-pane layout composition for in-content navigation rails and detail surfaces.

## Category

Pattern

## Public API

Props:

- `railAriaLabel`: optional `aria-label` for rail landmark
- `railWidth`: `sm | md | lg` (`md` default)
- `divider`: toggles rail/content divider (`true` default)

Slots:

- `rail`
- default slot (detail content)

## Behavior

- stacks on small screens and switches to side-by-side split at `md`
- constrains rail width via tokenized width presets
- keeps rail and detail as distinct semantic regions
