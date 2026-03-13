# ternent-vue-app template

Canonical template for new Ternent Vue apps.

## Features

- Feature-driven architecture (`src/modules/*`)
- Route-folder modules (`src/routes/*`) with CamelCase `Route*.vue`
- Foundational `ternent-identity`, `ternent-utils`, `ternent-ui` support
- Identity create/import/export baseline flows
- Tailwind + custom light/dark theme pair
- PWA + offline-first defaults
- Lighthouse CI thresholds (95+ for perf/a11y/best-practices/seo)

## Generate a New App

From repo root:

```bash
pnpm scaffold:ternent-app -- --name my-app --title "My App" --host my-app.ternent.dev
```

Optional:

```bash
pnpm scaffold:ternent-app -- --name my-app --title "My App" --host my-app.ternent.dev --theme myapp
```

## Monthly Template Refresh

1. Update external dependencies to latest stable.
2. Run `pnpm --filter proof test:unit`.
3. Run `pnpm --filter proof build`.
4. Run `pnpm --filter proof lighthouse:ci`.
5. Update template changelog notes.
