export type RuntimeAppSurfaceDefinition = {
  id: string;
  label: string;
  component?: () => Promise<any>;
};

export type RuntimeAppDefinition = {
  id: string;
  label: string;
  description?: string;
  defaultSurfaceId: string;
  surfaces?: RuntimeAppSurfaceDefinition[];
};

const runtimeApps: RuntimeAppDefinition[] = [
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
  },
];

export function listRuntimeApps(): RuntimeAppDefinition[] {
  return runtimeApps;
}

export function getRuntimeAppById(appId: string): RuntimeAppDefinition | null {
  return runtimeApps.find((app) => app.id === appId) ?? null;
}

export function resolveRuntimeSurface(
  app: RuntimeAppDefinition,
  surfaceId?: string,
): RuntimeAppSurfaceDefinition | null {
  if (!surfaceId) {
    return null;
  }

  return app.surfaces?.find((surface) => surface.id === surfaceId) ?? null;
}

export function resolveDefaultRuntimeSurface(
  app: RuntimeAppDefinition,
): RuntimeAppSurfaceDefinition | null {
  return resolveRuntimeSurface(app, app.defaultSurfaceId);
}

export function isRuntimeAppRegistryValid(app: RuntimeAppDefinition): boolean {
  return resolveDefaultRuntimeSurface(app) !== null;
}

export function isSupportedRuntimeSurface(app: RuntimeAppDefinition, surfaceId?: string): boolean {
  if (!surfaceId) {
    return true;
  }

  return resolveRuntimeSurface(app, surfaceId) !== null;
}
