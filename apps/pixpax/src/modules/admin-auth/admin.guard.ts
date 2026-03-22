import type { RouteLocationNormalized } from "vue-router";
import { usePixpaxAdminAuth } from "./usePixpaxAdminAuth";

export async function ensurePixpaxAdminAuthenticated(to: RouteLocationNormalized) {
  const auth = usePixpaxAdminAuth();
  const ok = await auth.validateToken({ force: true });
  if (ok && auth.isAuthenticated.value) {
    return true;
  }

  return {
    name: "app-admin-login",
    query: {
      redirect: to.fullPath,
    },
  };
}
