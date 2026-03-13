# PreviewPanel

## Purpose

Reusable technical preview surface for code, structured rows, and status-heavy callouts.

## Category

Pattern

## Public API

Props:

- `title`
- `meta`
- `tabs`
- `activeTab`
- `rows`
- `code`
- `statusLabel`
- `statusTone`
- `emphasis`: `subtle | default | strong`
- `badgeMode`: `default | quiet`
- `footerLabel`
- `footerTone`
- `footerText`

Slots:

- default: custom panel body when `rows` and `code` are not enough
