# Run Tasks

This folder holds the app-local Tasks domain for `apps/solid`.

Current rule:
- keep Concord generic
- keep the alpha app local
- only split Tasks back into a shared package when a second real app proves the boundary

What belongs here:
- task replay plugin
- task compatibility checks
- task runtime over the active projection
- task UI state and list surface components
- local ledger-level task records, including users and permissions for that ledger

What does not belong here:
- provider-specific storage logic
- generic shell/runtime policy
- fake demo content or placeholder verification states

Current app rule:
- `Tasks` is the app
- `Users` and `Permissions` are not peer apps
- they are local records written into the active task ledger
- their views live under the Tasks route as document-level controls
- future global helper pools may exist in storage, but replay and verification must never depend on them
- importing from a helper pool must copy new local records into the active ledger rather than referencing external truth
