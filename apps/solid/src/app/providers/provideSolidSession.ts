import type { App } from "vue";
import { installSolidSessionProvider } from "@/modules/solid-session";

export function provideSolidSession(app: App) {
  return installSolidSessionProvider(app);
}
