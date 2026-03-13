import type { NavigationGuard } from "vue-router";
import { useIdentitySession } from "./useIdentitySession";

export const requireIdentityGuard: NavigationGuard = (to) => {
  const { hasIdentity } = useIdentitySession();

  if (hasIdentity.value) {
    return true;
  }

  return {
    name: "settings-identity-import",
    query: {
      redirect: to.fullPath,
    },
  };
};
