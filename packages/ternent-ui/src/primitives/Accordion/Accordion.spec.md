# Accordion

## Purpose

Disclosure primitive for stacked sections of related content.

## Category

Primitive

## Public API

`Accordion` props:

- `multiple`
- `collapsible`
- `lazyMount`
- `value`

`Accordion` events:

- `update:value`

`AccordionItem` props:

- `value`
- `title`
- `disabled`

Slots:

- `AccordionItem#title`
- default item content

## Accessibility

- built on Ark accordion semantics
- keyboard navigation and disclosure state come from Ark
- supports controlled usage through `value` + `update:value`

## Keyboard behavior

- trigger is focusable
- Enter/Space toggle sections
- arrow-key behavior follows Ark accordion rules

## Compatibility

Canonical naming is `Accordion` / `AccordionItem`.
Legacy `Accordian` / `AccordianItem` exports remain as compatibility aliases for now.
