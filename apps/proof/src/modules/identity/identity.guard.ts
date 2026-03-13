import { useIdentitySession } from "./useIdentitySession";

export function resolveAppDefaultRoute() {
  const { hasIdentity } = useIdentitySession();
  return hasIdentity.value ? { name: "app-sign" } : { name: "app-identity" };
}
