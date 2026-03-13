# ternent-ui drop-in AI pack

This pack is designed to be copied directly into the `ternent-ui` package root.

## What this gives you

- a clear v2 architecture for `src/primitives`
- strict AI governance docs
- token and theming rules
- primitive and accessibility rules
- a pattern boundary so product UI does not leak into the core
- ready-to-paste prompts for Codex or similar agents
- templates for component specs and PR review
- a concrete phased roadmap

## Assumptions this pack makes

- `src/components/S*` is legacy and should be frozen except for urgent maintenance
- `src/primitives/*` is the future design-system source of truth
- Tailwind is retained as the styling implementation layer
- Ark UI is used selectively for interactive/a11y-heavy primitives
- multiple branded themes remain a first-class requirement

## Suggested first move

1. Copy the contents of this pack into the `ternent-ui` repo.
2. Commit the docs before any major refactor so AI has a stable contract.
3. Start Codex with `ai/prompts/00-master-system-prompt.md`.
4. Then run the prompts in order.

## Suggested placement

- `src/design-system/docs/*` should live exactly where provided.
- `ai/prompts/*` and `ai/templates/*` can live at package root or be moved under `.ai/` if you prefer.
- `plans/*` can stay at package root or be copied into your internal docs area.

## Recommended execution order

1. `ai/prompts/00-master-system-prompt.md`
2. `ai/prompts/01-bootstrap-docs.md`
3. `ai/prompts/02-button-hardening.md`
4. `ai/prompts/03-form-primitives.md`
5. `ai/prompts/04-choice-controls.md`
6. `ai/prompts/05-dialog-and-overlays.md`
7. `ai/prompts/06-navigation-and-disclosure.md`

## Grounding notes for this repo

This pack was written to match the current shape of `ternent-ui` as shared:

- legacy `src/components/S*.vue`
- new `src/primitives/Button/*`
- token css under `src/design-system/tokens.css`
- multi-theme setup under `src/themes/*`
- existing token names like `--ui-bg`, `--ui-fg`, `--ui-surface`, `--ui-primary`, `--ui-critical`, `--ui-ring`

The docs intentionally allow a staged migration rather than forcing an immediate token rename.
