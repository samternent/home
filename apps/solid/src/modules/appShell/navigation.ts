import type { SidebarNavSection } from "ternent-ui/patterns";
import {
  isRuntimeAppRegistryValid,
  listRuntimeApps,
  type RuntimeAppDefinition,
} from "@/runtime/apps";

export function listValidRuntimeApps(
  apps: RuntimeAppDefinition[] = listRuntimeApps(),
): RuntimeAppDefinition[] {
  return apps.filter((app) => isRuntimeAppRegistryValid(app));
}

function isAppRouteActive(path: string, appId: string): boolean {
  return path === `/w/${appId}` || path.startsWith(`/w/${appId}/`);
}

type SidebarNavigationOptions = {
  appCounts?: Partial<Record<string, number | string>>;
};

export function buildSidebarNavigationSections(
  path: string,
  apps: RuntimeAppDefinition[] = listRuntimeApps(),
  options: SidebarNavigationOptions = {},
): SidebarNavSection[] {
  const validApps = listValidRuntimeApps(apps);

  const appsSection: SidebarNavSection = {
    id: "apps",
    label: "Workspace",
    items: validApps.map((app) => ({
      id: `app-${app.id}`,
      label: app.label,
      count: options.appCounts?.[app.id],
      to: `/w/${app.id}`,
      dataTest: `nav-app-${app.id}`,
      active: isAppRouteActive(path, app.id),
      showActiveDot: true,
    })),
  };

  const systemSection: SidebarNavSection = {
    id: "system",
    label: "System",
    items: [
      {
        id: "users",
        label: "Users",
        to: "/s/users",
        dataTest: "nav-users",
        active: path.startsWith("/s/users"),
      },
      {
        id: "permissions",
        label: "Permissions",
        to: "/s/permissions",
        dataTest: "nav-permissions",
        active: path.startsWith("/s/permissions"),
      },
      {
        id: "storage",
        label: "Storage",
        to: "/s/storage",
        dataTest: "nav-storage",
        active: path.startsWith("/s/storage"),
      },
    ],
  };

  return [...(appsSection.items.length > 0 ? [appsSection] : []), systemSection];
}
