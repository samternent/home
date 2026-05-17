# Runtime App Implementation Playbook (New App + Surfaces)

This is a file-by-file instruction set for adding a new runtime app in Solid (example: Tasks), including:

- app registration
- command + schema definitions
- typed API integration
- list/board surface interaction

## 1) Architecture Map

Runtime app feature work in this repo has four layers:

1. Concord replay plugin (domain commands, state, selectors)

- `apps/solid/src/app/plugins/*.ts`

2. Typed app facade (`useAppApi`)

- `apps/solid/src/app/api/types.ts`
- `apps/solid/src/app/api/useAppApi.ts`

3. Runtime app registry

- `apps/solid/src/runtime/apps/registry.ts`

4. Surface components

- `apps/solid/src/runtime/apps/<app>/<surface>/*.vue`

## 2) Create A Domain Plugin

Create `apps/solid/src/app/plugins/tasks.ts`.

Follow the same structure as:

- `apps/solid/src/app/plugins/users.ts`
- `apps/solid/src/app/plugins/profiles.ts`
- `apps/solid/src/app/plugins/permissions.ts`

### 2.1 Define state + records

```ts
export type TaskStatus = "todo" | "doing" | "done";

export type TaskRecord = {
  id: string;
  title: string;
  status: TaskStatus;
  audienceType: "everyone" | "user" | "permission";
  audienceId: string | null;
  cipher: string | null;
  keyRef: string | null;
  keyMissing: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

export type TasksState = {
  byId: Record<string, TaskRecord>;
  order: string[];
};
```

### 2.2 Define command input types (schema contract)

```ts
export type TaskCreateInput = {
  title: string;
  status?: TaskStatus;
  audienceType: "everyone" | "user" | "permission";
  audienceId?: string | null;
  actorIdentityKey: string;
};

export type TaskMoveInput = {
  taskId: string;
  status: TaskStatus;
  actorIdentityKey: string;
};
```

Use parser/normalizer functions (same style as users/profiles/permissions):

- required text checks
- enum checks
- identity-key validation via `validateIdentityKey`

### 2.3 Define commands

Add `commands` inside plugin:

- `task.create`
- `task.rename`
- `task.move`
- `task.archive` (optional v1)

Rules to enforce in command handlers:

1. actor must match runtime signer
2. if `audienceType === "permission"`, selected permission must exist and actor should be a holder/member
3. if `audienceType === "user"`, user must exist

### 2.4 Apply entries + selectors

Implement:

- `applyEntry()` for each command kind
- selectors:
  - `all(state)`
  - `byId(state, taskId)`
  - `byStatus(state, status)`

Return immutable clones from selectors.

## 3) Export Plugin

Update `apps/solid/src/app/plugins/index.ts`:

```ts
export * from "./tasks";
```

## 4) Register Plugin In App Runtime

Update imports in `apps/solid/src/app/api/useAppApi.ts`:

```ts
import { createTasksPlugin } from "@/app/plugins";
```

Update `createDefaultPlugins()`:

```ts
function createDefaultPlugins(): AppProjectionPlugin[] {
  return [
    createUsersPlugin(),
    createProfilesPlugin(),
    createPermissionsPlugin(),
    createTasksPlugin(),
  ];
}
```

## 5) Add Typed API Surface

### 5.1 Extend types

Update `apps/solid/src/app/api/types.ts` with `AppTasksApi` and add `tasks: AppTasksApi` to `AppApi`.

```ts
export type AppTasksApi = {
  create(input: Omit<TaskCreateInput, "actorIdentityKey">): Promise<ConcordCommandResult>;
  move(input: Omit<TaskMoveInput, "actorIdentityKey">): Promise<ConcordCommandResult>;
  all(): TaskRecord[];
  byId(taskId: string): TaskRecord | null;
};
```

### 5.2 Implement in `useAppApi.ts`

Add `tasks` block mirroring existing `users/profiles/permissions` style:

```ts
tasks: {
  create(input) {
    const actor = requireActiveIdentity(activeIdentity.value);
    return api.command("task.create", {
      ...input,
      actorIdentityKey: actor.identityKey,
    });
  },
  move(input) {
    const actor = requireActiveIdentity(activeIdentity.value);
    return api.command("task.move", {
      ...input,
      actorIdentityKey: actor.identityKey,
    });
  },
  all() {
    return api.select<TaskRecord[]>("tasks", "all");
  },
  byId(taskId: string) {
    return api.select<TaskRecord | null>("tasks", "byId", taskId);
  },
},
```

## 6) Register Runtime App + Surfaces

Update `apps/solid/src/runtime/apps/registry.ts`:

```ts
{
  id: "tasks",
  label: "Tasks",
  description: "Task workflows hosted by the ConcordOS runtime.",
  defaultSurfaceId: "list",
  surfaces: [
    {
      id: "list",
      label: "List",
      component: () => import("./tasks/list/RuntimeAppsTaskList.vue"),
    },
    {
      id: "board",
      label: "Board",
      component: () => import("./tasks/board/RuntimeAppsTaskBoard.vue"),
    },
  ],
}
```

No additional router work is needed because runtime routes are already mounted by:

- `apps/solid/src/routes/app/RouteRuntimeApp.vue`
- `apps/solid/src/routes/app/index.ts` (`/app/:appId/:surfaceId?`)

## 7) Build Surfaces (List + Board)

### 7.1 Shared contract

Use shared audience helpers in:

- `apps/solid/src/runtime/apps/tasks/audienceContract.ts`

### 7.2 List surface

In `RuntimeAppsTaskList.vue`:

1. read `tasks` from `appApi.tasks.all()`
2. create tasks via `appApi.tasks.create(...)`
3. optionally call `appApi.commit(...)` for save-based UX or auto-commit after each command

### 7.3 Board surface

In `RuntimeAppsTaskBoard.vue`:

1. derive columns by `status`
2. move tasks using `appApi.tasks.move(...)`
3. reuse same audience rendering/lock behavior as list

## 8) Interaction Pattern In Components

Use this sequence for writes:

1. Validate form input in UI.
2. Call typed method on `appApi.<domain>`.
3. Decide commit strategy:

- explicit save: `appApi.commit(...)`
- immediate persist: commit after each command

4. Handle `appApi.lastError` for user feedback.

## 9) Minimum Tests To Add

1. plugin unit tests (`apps/solid/src/tests/v2/*`):

- signer mismatch rejected
- invalid audience rejected
- deterministic replay for create/move

2. runtime route tests:

- `/app/tasks` normalizes to default surface
- tab switches list <-> board

3. surface behavior tests:

- list create creates staged task
- board move updates status projection

## 10) Practical Checklist

1. Create `tasks.ts` plugin and export it.
2. Add `createTasksPlugin()` to default plugins.
3. Extend `AppApi` types and implement `appApi.tasks`.
4. Ensure `tasks` app and surfaces are in registry.
5. Implement list/board components against typed API only.
6. Add tests for command rules, replay behavior, and route surfaces.

## 11) Current Gap To Resolve

`RuntimeAppsTaskList.vue` currently references `appApi.tasks`.
Before shipping, ensure `AppApi` actually includes `tasks` in:

- `apps/solid/src/app/api/types.ts`
- `apps/solid/src/app/api/useAppApi.ts`

This keeps the runtime surfaces and app facade consistent.
