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

## Fastest Path

If you want the shortest route to a new branded app:

```bash
pnpm scaffold:ternent-app -- --name ledger-demo --title "Ledger Demo" --host ledger-demo.ternent.dev --theme aurora
pnpm --filter ledger-demo dev
```

That creates `apps/ledger-demo`, writes `apps/ledger-demo/app.yaml`, and generates the runtime config immediately.

## Config-First Workflow

If you want to author the app from a manifest before scaffolding it, use a manifest outside `apps/` first.

1. Create a starter manifest:

```bash
pnpm prepare:ternent-app -- --out .ternent-apps/ledger-demo.yaml --name ledger-demo --title "Ledger Demo" --host ledger-demo.ternent.dev --theme aurora
```

2. Edit `.ternent-apps/ledger-demo.yaml` with your copy, links, previews, and theme choice.

3. Scaffold the app from that manifest:

```bash
pnpm scaffold:ternent-app -- --manifest .ternent-apps/ledger-demo.yaml
```

4. Run the app:

```bash
pnpm --filter ledger-demo dev
```

## Updating an Existing App

After scaffolding, the app’s source-of-truth manifest lives inside the app:

- `apps/<app-name>/app.yaml`

When you change that file, regenerate the runtime config with:

```bash
pnpm sync:ternent-app -- --app apps/ledger-demo
```

## Concrete Example

Minimal config-first session:

```bash
pnpm prepare:ternent-app -- --out .ternent-apps/receipt-checker.yaml --name receipt-checker --title "Receipt Checker" --host receipt-checker.ternent.dev --theme harbor-rose
pnpm scaffold:ternent-app -- --manifest .ternent-apps/receipt-checker.yaml
pnpm --filter receipt-checker dev
```

## Monthly Template Refresh

1. Update external dependencies to latest stable.
2. Run `pnpm --filter __APP_ID__ test:unit`.
3. Run `pnpm --filter __APP_ID__ build`.
4. Run `pnpm --filter __APP_ID__ lighthouse:ci`.
5. Update template changelog notes.
