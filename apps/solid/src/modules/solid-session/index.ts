import { inject, type App, type InjectionKey } from "vue";
import {
  createSolidSessionController,
  getSolidSessionController,
  type SolidSessionController,
} from "./useSolidSession";

const solidSessionKey: InjectionKey<SolidSessionController> = Symbol(
  "solid-session",
);

export function installSolidSessionProvider(app: App) {
  const session = createSolidSessionController();
  app.provide(solidSessionKey, session);

  if (typeof window !== "undefined") {
    void session.restore();
  }

  return session;
}

export function useSolidSession() {
  return inject(solidSessionKey, getSolidSessionController());
}

export * from "./useSolidSession";
