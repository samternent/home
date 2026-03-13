# VISUAL_DIRECTION

## Design intent

`ternent-ui` should feel:

- premium but not luxurious
- technical but not sterile
- calm, restrained, and modern
- slightly soft in geometry
- dense enough for serious app interfaces
- polished in dark mode
- quietly expressive rather than loud

## Current repo baseline

This visual direction should be applied through the existing semantic token system, not through one-off component styling.
The active token contract already includes surface, border, accent, feedback, shadow, radius, duration, easing, and interaction-motion tokens.
Legacy `S*` styling is not the visual standard for new primitive work.

## Benchmark energy

Aim closer to:

- Stripe-level restraint
- Vercel-level clarity
- HeroUI-level polish in component finish

Avoid:

- generic Tailwind demo aesthetics
- over-glassy or over-neumorphic effects
- heavy gradients as a default surface strategy
- toy-like radii and novelty motion

## Surface model

- canvas should feel quiet
- surfaces should separate subtly from the canvas
- interactive controls should read clearly from their container
- elevation should be visible but restrained
- borders should support structure without looking muddy

## Shape model

- controls should have consistent silhouette language
- radius should feel modern and deliberate
- default geometry should be rounded, not playful

## Motion model

- fast
- subtle
- purposeful
- no decorative bounce
- motion should support comprehension, not spectacle

## Content density

Default density should support real product work.
Not cramped, not oversized.
Aim for a professional app density that still feels breathable.

## Theme strategy

Multiple branded themes are a feature, but the system should still feel like one family.
Theme changes should alter mood, not break structural consistency.
The current default light/dark behavior comes from token remapping in the core token file, and future theme work should preserve that contract.
