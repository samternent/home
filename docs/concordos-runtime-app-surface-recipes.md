# concordOS Runtime App Surface Recipes

This guide is for building functional SaaS surfaces inside the runtime app shell (for example, `tasks/list` and `tasks/board`) with a simple, repeatable pattern.

Primary seam:
- route host: `apps/solid/src/routes/app/RouteRuntimeApp.vue`
- registry: `apps/solid/src/runtime/apps/registry.ts`
- surfaces: `apps/solid/src/runtime/apps/tasks/list/RuntimeAppsTaskList.vue`, `apps/solid/src/runtime/apps/tasks/board/RuntimeAppsTaskBoard.vue`
- app API: `apps/solid/src/app/api/useAppApi.ts`

## 1) Mental Model: Build Features In 4 Layers

1. **Commands + replay state (plugin)**
   - Define domain commands and authorization checks in an app plugin.
2. **Typed app API facade**
   - Expose safe methods like `tasks.create`, `tasks.move`, `tasks.archive`.
3. **Surface view-model composable**
   - Keep route/view components thin.
4. **Surface components**
   - `list` and `board` are just alternative projections over the same replay state.

This keeps behavior deterministic and testable while scaling to multiple UI surfaces.

## 2) Route + Surface Wiring (already in place)

Runtime surfaces are mounted through:
- `/app/:appId/:surfaceId?`

Registry example already configured:
- app id `tasks`
- surfaces `list` and `board`

When you add a new surface:
1. Create component file under `apps/solid/src/runtime/apps/<app>/<surface>/...`
2. Register it in `apps/solid/src/runtime/apps/registry.ts`
3. It appears automatically in surface tabs inside `RouteRuntimeApp.vue`

## 3) Simple Command Design Recipe

For each feature, define commands first. Keep command names explicit and scoped.

Example task command set:
- `task.create`
- `task.rename`
- `task.move` (status/column change)
- `task.assign`
- `task.archive`

Recommended command payload shape:
- Required ids and actor identity key
- Optional metadata only where necessary
- No client-trusted authorization flags

Example policy checks inside command handlers:
- Actor must match active signer identity.
- Actor must be a member of the workspace permission/group.
- Target assignee must exist in users projection.

Use current permissions plugin style as baseline:
- signer check: reject forged actor
- membership check: only existing members can mutate membership-sensitive records

## 4) Permissions / Users Rule Set For SaaS Surfaces

Use this baseline for all new runtime apps:

1. **Identity rule**
   - No mutation when active identity is missing.
2. **Signer rule**
   - Reject if command actor does not map to runtime signer.
3. **Membership rule**
   - Mutations require relevant workspace/group membership.
4. **Projection integrity rule**
   - Ignore replay entries that fail author/member consistency.
5. **User existence rule**
   - Assignee/member ids must resolve in users projection.

This is consistent with existing `users`, `profiles`, and `permissions` behavior.

## 5) Encryption Rules (practical and current)

Today, you should treat data protection in two buckets:

1. **Identity secrets**
   - Already handled by encrypted identity storage in runtime identity service.
2. **Ledger domain payloads**
   - Entries are signed/sealed for integrity.
   - Payload-level encryption is optional and should be used for sensitive domain fields.

Pragmatic rule of thumb:
- Public collaboration metadata (titles, statuses, labels): plain payload.
- Secrets/PII (private notes, tokens, regulated fields): encrypted payload strategy.

If you introduce encrypted domain payloads, define it as an explicit plugin-level requirement and include fallback behavior when payload is not decryptable.

## 6) Typed API Pattern (what surface code should call)

Surfaces should call typed APIs, not generic `command(...)` directly.

Target shape to add in `AppApi`:

```ts
export type AppTasksApi = {
  create(input: { title: string; status?: "todo" | "doing" | "done" }): Promise<ConcordCommandResult>;
  rename(input: { taskId: string; title: string }): Promise<ConcordCommandResult>;
  move(input: { taskId: string; status: "todo" | "doing" | "done" }): Promise<ConcordCommandResult>;
  assign(input: { taskId: string; identityKey: string | null }): Promise<ConcordCommandResult>;
  archive(input: { taskId: string }): Promise<ConcordCommandResult>;
  all(): TaskRecord[];
  byId(taskId: string): TaskRecord | null;
};
```

Implementation pattern in `useAppApi.ts`:
- Derive actor from `activeIdentity`
- Validate projected users before assignment
- Delegate actual authorization to plugin command handlers

## 7) Surface Recipe: List View

List view responsibilities:
- Fast create/edit/assign interactions
- Simple status filtering
- Bulk actions (optional)

Surface component pattern (`RuntimeAppsTaskList.vue`):

```ts
<script setup lang="ts">
import { computed, ref } from "vue";
import { useAppApi } from "@/app/api";

const appApi = useAppApi();
const createTitle = ref("");

const tasks = computed(() => appApi.tasks.all());

async function createTask(): Promise<void> {
  if (!createTitle.value.trim()) return;
  await appApi.tasks.create({ title: createTitle.value.trim(), status: "todo" });
  createTitle.value = "";
}

async function saveChanges(): Promise<void> {
  await appApi.commit({ metadata: { message: "Task updates" } });
}

async function discardChanges(): Promise<void> {
  await appApi.discard();
}
</script>
```

## 8) Surface Recipe: Board View

Board view responsibilities:
- Group same tasks by status
- Drag/drop or action-based move between columns
- Same command surface as list view (`task.move`)

Pattern for `RuntimeAppsTaskBoard.vue`:

```ts
<script setup lang="ts">
import { computed } from "vue";
import { useAppApi } from "@/app/api";

const appApi = useAppApi();
const tasks = computed(() => appApi.tasks.all());

const columns = computed(() => ({
  todo: tasks.value.filter((t) => t.status === "todo"),
  doing: tasks.value.filter((t) => t.status === "doing"),
  done: tasks.value.filter((t) => t.status === "done"),
}));

async function move(taskId: string, status: "todo" | "doing" | "done"): Promise<void> {
  await appApi.tasks.move({ taskId, status });
}
</script>
```

Key point:
- `list` and `board` share the same command/state model, so switching surfaces never forks data logic.

## 9) Commit Strategy For Product UX

Use a consistent strategy per app:

1. **Auto-commit mode**
   - Commit after each mutation.
   - Simple UX, more commit noise.
2. **Session staging mode**
   - Stage many edits, explicit Save/Discard.
   - Better for high-edit surfaces.

Whichever you choose, apply it consistently across list and board.

## 10) Feature Delivery Checklist (new runtime app surface)

1. Define plugin state + commands + selectors.
2. Add plugin to default plugin list in `useAppApi.ts`.
3. Add typed facade to `AppApi` (`types.ts` + `useAppApi.ts`).
4. Register runtime app and surfaces in `runtime/apps/registry.ts`.
5. Build shared composable/view-model for list + board.
6. Implement `list` and `board` components.
7. Add tests:
   - forged actor rejected
   - non-member mutation rejected
   - deterministic replay across reload
   - surface route normalization and tab navigation
8. Add docs for command contracts and commit semantics.

## 11) Minimal Do / Don't

Do:
- keep auth checks in command handlers
- keep surfaces thin and projection-driven
- keep command names explicit and domain-scoped
- use typed API wrappers from `useAppApi`

Don't:
- trust UI-only role checks
- expose arbitrary raw `command(type, input)` from UI
- duplicate business logic across list and board
- put sensitive fields into plain payloads by default

---

If you want, the next step can be a concrete scaffold patch that adds:
- `tasks` plugin (`apps/solid/src/app/plugins/tasks.ts`)
- `appApi.tasks` typed facade
- first functional list + board surfaces wired to real ledger commands.
