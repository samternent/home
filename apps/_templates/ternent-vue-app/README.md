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

## App Manifest

The template landing page is driven by `app.yaml`.

- Author landing copy, links, snippets, and theme selection in YAML.
- Run `pnpm sync:ternent-app -- --app apps/<app-name>` to regenerate typed runtime config.
- The browser consumes generated TS config only; it does not parse YAML at runtime.

## Generate a New App

From repo root:

```bash
pnpm scaffold:ternent-app -- --manifest apps/my-app/app.yaml
```

Optional:

```bash
pnpm scaffold:ternent-app -- --name my-app --title "My App" --host my-app.ternent.dev --theme aurora
pnpm sync:ternent-app -- --app apps/my-app
```

## Monthly Template Refresh

1. Update external dependencies to latest stable.
2. Run `pnpm --filter __APP_ID__ test:unit`.
3. Run `pnpm --filter __APP_ID__ build`.
4. Run `pnpm --filter __APP_ID__ lighthouse:ci`.
5. Update template changelog notes.
