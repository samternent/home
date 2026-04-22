# SidebarNav

## Purpose

Reusable sidebar navigation composition for grouped links and action footer content.

## Category

Pattern

## Public API

Props:

- `sections`: `SidebarNavSection[]`
- `title`: optional string

Slots:

- `header`
- `footer`

Events:

- `select(item, event)` when an item is activated

## Behavior

- renders grouped nav sections with optional section labels
- supports Router links (`to`), external links (`href`), and button-like actions
- applies active-state styling through `item.active`
- keeps footer actions visually separated from route links
