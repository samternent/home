import type { App } from "vue";
import { provideTheme } from "@/app/providers/provideTheme";

export function installAppProviders(app: App) {
  provideTheme();
}
