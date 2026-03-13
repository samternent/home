# Logo

## Purpose

Shared Ternent brand mark for product chrome, headers, and navigation.

## Category

Pattern

## Public API

Props:

- `decorative`
- `title`

Behavior:

- merges consumer classes so callers control rendered size
- uses per-instance SVG ids to avoid collisions when multiple logos render on one page
- uses `--ui-logo-start`, `--ui-logo-end`, and `--ui-logo-cutout` so the mark follows the active theme without overloading generic component colors
