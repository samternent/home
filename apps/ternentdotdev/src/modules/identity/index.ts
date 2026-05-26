import { inject, type App, type InjectionKey } from "vue";
import {
  useIdentitySession,
  type IdentitySession,
  type StoredIdentity,
} from "./useIdentitySession";

const identitySessionKey: InjectionKey<IdentitySession> = Symbol("identity-session");

export function installIdentityProvider(app: App) {
  const session = useIdentitySession();
  app.provide(identitySessionKey, session);
  return session;
}

export function useIdentity() {
  return inject(identitySessionKey, useIdentitySession());
}

export type { StoredIdentity };
export * from "./useIdentityCreate";
export * from "./useIdentityImport";
export * from "./useIdentityExport";
export * from "./useIdentitySession";
