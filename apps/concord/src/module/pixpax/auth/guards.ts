import type { NavigationGuardWithThis } from "vue-router";
import { usePixpaxAuth, type PixPaxPermission } from "./usePixpaxAuth";

function loginRedirect(fullPath: string) {
  return {
    path: "/pixpax/control/login",
    query: {
      redirect: fullPath,
    },
  };
}

export function requirePixPaxPermission(
  permission: PixPaxPermission
): NavigationGuardWithThis<undefined> {
  return async (to) => {
    const auth = usePixpaxAuth();
    const ok = await auth.ensurePermission(permission);
    if (ok) return true;
    if (auth.isAuthenticated.value) {
      return {
        path: "/pixpax/control/creator",
        query: {
          denied: permission,
        },
      };
    }
    return loginRedirect(to.fullPath);
  };
}

export const redirectPixPaxControlEntry: NavigationGuardWithThis<undefined> = async () => {
  const auth = usePixpaxAuth();
  const ok = await auth.ensurePermission("pixpax.admin.manage");
  if (ok) {
    return { path: "/pixpax/control/admin" };
  }
  return { path: "/pixpax/control/creator" };
};
