# UI Migration Inventory (`apps/solid/src`)

Status values:

- `legacy`: primarily legacy `ternent-ui/components` usage
- `in-progress`: partial migration
- `migrated`: primitives/patterns only
- `retired`: no longer part of runtime surface

Allowed exceptions for the UI contract checker:

- hidden/auth autofill native fields (`sr-only` or `type="hidden"`)
- semantic read-only structure (`dl/dt/dd`)
- unmanaged third-party render output marked with `data-ui-contract-unmanaged`

Enforcement rollout:

- `pnpm --filter solid check:ui-contract` (warning mode, default)
- `pnpm --filter solid check:ui-contract:strict` (future hard-fail mode)
- hard-fail switch condition: zero violations on `main` and zero violations in three consecutive UI-touching PRs

| File                                                | Status     | Notes                                                         |
| --------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| `src/App.vue`                                       | `migrated` | Router-only shell entry                                       |
| `src/modules/appShell/AppShell.vue`                 | `migrated` | Uses primitives + app shell modules                           |
| `src/modules/appShell/Console.vue`                  | `migrated` | Uses `PanelChrome` pattern                                    |
| `src/modules/appShell/IdentityOnboardingDialog.vue` | `migrated` | Primitive-driven; hidden native inputs retained intentionally |
| `src/modules/appShell/SideNav.vue`                  | `migrated` | Uses `SidebarNav` pattern + primitives                        |
| `src/modules/appShell/ThemeModeToggle.vue`          | `migrated` | New primitive-only mode toggle                                |
| `src/routes/app/RouteApp.vue`                       | `migrated` | Route composition only                                        |
| `src/routes/app/RouteHome.vue`                      | `migrated` | Uses `KeyValueList` pattern + primitives                      |
| `src/routes/app/RouteLaunch.vue`                    | `migrated` | Token-only static route surface                               |
| `src/routes/app/RoutePermissions.vue`               | `migrated` | Uses `KeyValueList`/`FormField` patterns + primitives         |
